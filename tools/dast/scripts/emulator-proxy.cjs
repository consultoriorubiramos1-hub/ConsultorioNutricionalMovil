const http = require('node:http');

// Puente de pruebas: destino fijo en la red interna, sin secretos ni logs de peticiones.
function createEmulatorProxy({ hostname = 'api', port = 3000 } = {}) {
  return http.createServer({ requestTimeout: 30000, headersTimeout: 10000 }, (request, response) => {
    if (!request.url?.startsWith('/api/')) {
      response.writeHead(404, { 'Content-Type': 'application/json' });
      response.end('{"ok":false}');
      return;
    }
    const headers = { host: `${hostname}:${port}` };
    for (const key of ['accept', 'accept-language', 'authorization', 'content-type', 'content-length', 'cookie', 'user-agent']) {
      if (request.headers[key] !== undefined) headers[key] = request.headers[key];
    }
    const upstream = http.request({ hostname, port, method: request.method, path: request.url, headers }, incoming => {
      const outgoingHeaders = { ...incoming.headers };
      for (const key of ['connection', 'keep-alive', 'transfer-encoding', 'upgrade', 'proxy-authenticate', 'proxy-authorization', 'trailer', 'te']) delete outgoingHeaders[key];
      response.writeHead(incoming.statusCode, outgoingHeaders);
      incoming.on('error', () => response.destroy());
      incoming.pipe(response);
    });
    upstream.setTimeout(30000, () => upstream.destroy());
    upstream.on('error', () => {
      if (response.destroyed) return;
      if (response.headersSent) response.destroy();
      else {
        response.writeHead(502, { 'Content-Type': 'application/json' });
        response.end('{"ok":false,"message":"API local de pruebas no disponible."}');
      }
    });
    request.on('aborted', () => upstream.destroy());
    request.on('error', () => upstream.destroy());
    response.on('close', () => { if (!response.writableEnded) upstream.destroy(); });
    request.pipe(upstream);
  });
}

if (require.main === module) {
  createEmulatorProxy().listen(3300, '0.0.0.0', () => console.log('Puente local de pruebas listo en el puerto 3300.'));
}

module.exports = { createEmulatorProxy };
