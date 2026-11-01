import datetime
import json
import os
from pathlib import Path
import signal
import subprocess
import time
import urllib.error
import urllib.request
import urllib.parse

API_BASE = 'http://api:3000'
CONFIG = Path('/zap/config')
REPORTS = Path('/zap/wrk')
ZAP = '/zap/zap.sh'
SESSION = Path('/tmp/cnm-zap-session')
TIMEOUT_SECONDS = 660


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def request_json(path, body=None, token=None):
    headers = {'Accept': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    if body is not None:
        headers['Content-Type'] = 'application/json'
    request = urllib.request.Request(API_BASE + path, headers=headers,
                                     data=None if body is None else json.dumps(body).encode())
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
    with opener.open(request, timeout=20) as response:
        if response.status != 200:
            raise RuntimeError('La API local no respondio como se esperaba.')
        return json.load(response)


def alert_summary(report):
    sites = report.get('site')
    if not isinstance(sites, list) or not sites:
        raise RuntimeError('El reporte no contiene sitios analizados.')
    counts = {'high': 0, 'medium': 0, 'low': 0, 'informational': 0}
    names = ['informational', 'low', 'medium', 'high']
    alerts = []
    for site in sites:
        if site.get('@name') != API_BASE:
            raise RuntimeError('El reporte contiene un sitio fuera del entorno local.')
        for alert in site.get('alerts', []):
            risk = int(alert['riskcode'])
            if risk not in range(4):
                raise RuntimeError('Nivel de riesgo no reconocido.')
            counts[names[risk]] += 1
            alerts.append({'pluginId': str(alert['pluginid']), 'risk': names[risk],
                           'name': alert.get('name', alert.get('alert', '')),
                           'instances': len(alert.get('instances', []))})
    return counts, alerts


def main():
    REPORTS.mkdir(parents=True, exist_ok=True)
    password = os.environ.get('AUTH_FIXTURE_PASSWORD')
    if not password:
        raise RuntimeError('Falta la clave de la cuenta sintetica.')
    login = request_json('/api/mobile/auth/login', {'username': 'dast_patient_a', 'password': password})
    token = login.get('data', {}).get('token') if login.get('ok') is True else None
    if not isinstance(token, str) or not token or any(ch.isspace() for ch in token):
        raise RuntimeError('El login sintetico no emitio un token valido.')
    identity = request_json('/api/mobile/auth/me', token=token)
    if identity.get('ok') is not True or identity.get('data', {}).get('username') != 'dast_patient_a':
        raise RuntimeError('No se pudo confirmar la identidad sintetica.')

    child_env = {**os.environ, 'ZAP_AUTH_HEADER': 'Authorization',
                 'ZAP_AUTH_HEADER_VALUE': 'Bearer ' + token,
                 'ZAP_AUTH_HEADER_SITE': urllib.parse.urlsplit(API_BASE).hostname}
    command = [ZAP, '-Xmx512m', '-cmd', '-silent', '-dir', str(SESSION),
               '-config', 'view.locale=en_GB', '-config', 'autoupdate.checkOnStart=false',
               '-autorun', str(CONFIG / 'auth.plan.yml')]
    process = None
    started = time.monotonic()
    try:
        with (REPORTS / 'zap-console.log').open('w') as log:
            print('ZAP: identidad local verificada; comienza el escaneo activo de autenticacion.', flush=True)
            process = subprocess.Popen(command, env=child_env, stdout=log, stderr=subprocess.STDOUT,
                                       start_new_session=True)
            while process.poll() is None:
                if time.monotonic() - started > TIMEOUT_SECONDS:
                    raise RuntimeError('Se agoto el tiempo del scanner; no se acredita un escaneo terminado.')
                try:
                    process.wait(timeout=30)
                except subprocess.TimeoutExpired:
                    print('ZAP sigue trabajando; los detalles quedan en el reporte local.', flush=True)
    finally:
        if process is not None and process.poll() is None:
            os.killpg(process.pid, signal.SIGTERM)
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGKILL)
                process.wait()

    console = (REPORTS / 'zap-console.log').read_text(errors='replace')
    if process.returncode != 0 or 'Job activeScan finished' not in console:
        raise RuntimeError('El scanner no termino correctamente; revisa zap-console.log.')
    raw = json.loads((REPORTS / 'zap-auth.json').read_text(encoding='utf-8-sig'))
    counts, alerts = alert_summary(raw)
    after = request_json('/api/mobile/auth/me', token=token)
    if after.get('ok') is not True or after.get('data', {}).get('username') != 'dast_patient_a':
        raise RuntimeError('La verificacion de sesion posterior al escaneo fallo.')
    summary = {'executedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
               'scanner': 'OWASP ZAP', 'version': raw.get('@version'),
               'scope': ['POST /api/mobile/auth/login', 'GET /api/mobile/auth/me'],
               'target': API_BASE, 'scannerExecuted': True, 'scannerExitCode': process.returncode,
               'counts': counts, 'highRiskGatePassed': counts['high'] == 0, 'alerts': alerts,
               'limitations': ['API en desarrollo y HTTP local', 'Solo dos rutas de autenticacion',
                               'Sin OAST externo, TLS nativo, pinning ni pruebas de dispositivo',
                               'Escaneo acotado a cinco minutos de fase activa']}
    (REPORTS / 'summary.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
    print('ZAP termino. Hallazgos por nivel: ' + json.dumps(counts), flush=True)
    return 1 if counts['high'] else 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except Exception:
        print('El escaneo no pudo completarse. Revisa los archivos locales de esta ejecucion; no se publico un resultado aprobado.', flush=True)
        raise SystemExit(3)
