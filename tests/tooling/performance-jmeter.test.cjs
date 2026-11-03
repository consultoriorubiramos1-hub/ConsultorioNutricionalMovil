const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { STAGES, parseSamples, stats, assessStage, javaArgs, apiRequest, prepareToken } = require('../../tools/performance/run-jmeter.cjs');
const header = 'timeStamp,elapsed,label,responseCode,success,bytes,Latency,Connect\n';
function samples(count = 20, change = {}) {
  return Array.from({length:count}, (_,i) => ({ timestamp: 10000+i*1000, elapsed:100,
    label: i%2 ? 'perfil' : 'auth-me', code:'200', passed:true, ...change }));
}

test('CSV solo acepta los ocho campos de metricas y las dos rutas previstas', () => {
  assert.deepEqual(parseSamples(header+'10000,120,auth-me,200,true,100,100,0\n')[0],
    {timestamp:10000,elapsed:120,label:'auth-me',code:'200',passed:true});
  assert.throws(() => parseSamples(header.replace('Connect','token')), {code:'results-fields'});
  assert.throws(() => parseSamples(header+'10000,120,otra-ruta,200,true,100,100,0\n'), {code:'results-sample'});
  assert.throws(() => parseSamples(header+'10000,NaN,perfil,200,true,100,100,0\n'), {code:'results-sample'});
});

test('no considera exitosa una respuesta distinta de 200 aunque JMeter marque true', () => {
  assert.equal(parseSamples(header+'10000,120,perfil,302,true,100,100,0\n')[0].passed,false);
  assert.equal(parseSamples(header+'10000,120,perfil,200,false,100,100,0\n')[0].passed,false);
});

test('rechaza muestras vacias y no inventa percentiles', () => {
  assert.throws(() => stats([]), {code:'results-empty'});
  assert.throws(() => assessStage(STAGES[0],[]), {code:'results-empty'});
});

test('calcula percentiles por rango mas cercano, errores y throughput medido', () => {
  const data = samples(20).map((s,i) => ({...s,elapsed:(i+1)*10,passed:i!==19}));
  const value = stats(data);
  assert.equal(value.p50Ms,100);assert.equal(value.p95Ms,190);assert.equal(value.p99Ms,200);
  assert.equal(value.errors,1);assert.equal(value.errorPercent,5);assert.equal(value.measuredSeconds,19.2);
  assert.equal(value.requestsPerSecond,1.042);
});

test('el criterio se aplica a cada ruta para no ocultar una lenta en el promedio global', () => {
  const data = samples().map(s => s.label==='perfil' ? {...s,elapsed:2500} : s);
  assert.equal(assessStage(STAGES[1],data).criteriaPassed,false);
  assert.equal(assessStage(STAGES[2],data).criteriaPassed,true);
  assert.equal(assessStage(STAGES.at(-1),data).criteriaPassed,false);
});

test('una prueba escasa o con errores no se presenta como aprobada', () => {
  assert.equal(assessStage(STAGES[0],samples(18)).criteriaPassed,false);
  const data=samples();data[0].passed=false;
  assert.equal(assessStage(STAGES[0],data).criteriaPassed,false);
  assert.equal(assessStage(STAGES[0],samples()).criteriaPassed,true);
});

test('la degradacion detiene el aumento de carga y los limites son cerrados', () => {
  assert.equal(assessStage(STAGES[2],samples(20,{elapsed:5000})).stopIncrease,true);
  assert.deepEqual(STAGES.map(s=>s.threads),[1,5,10,20,1]);
  assert.equal(STAGES.reduce((sum,s)=>sum+s.seconds,0),210);
  assert.throws(()=>javaArgs('j.jar','p.jmx','r.properties','out',{id:'custom',threads:1000,seconds:600}),{code:'stage-scope'});
});

test('argumentos Java no contienen credenciales ni permiten URL alternativa', () => {
  const args=javaArgs('j.jar','p.jmx','r.properties','out',STAGES[2]);
  assert.ok(args.includes('-n'));assert.ok(args.includes('-Jcnm.threads=10'));
  assert.ok(!args.some(s=>/token|password|Bearer|https?:/i.test(s)));
});

test('HTTP preparatorio usa exclusivamente loopback y rechaza redirecciones', async () => {
  let observed;
  await apiRequest('/api/mobile/auth/me',{},async (url,options)=>{
    observed={url,options};return new Response('{"ok":true}',{status:200});
  });
  assert.equal(observed.url,'http://127.0.0.1:3300/api/mobile/auth/me');
  assert.equal(observed.options.redirect,'error');
  await assert.rejects(apiRequest('https://outside.example.test/'),{code:'api-scope'});
  await assert.rejects(apiRequest('/api/mobile/auth/me',{},async()=>new Response('redirect',{status:302})),{code:'api-http'});
});

test('prepara un token una vez, comprueba identidad y conserva el token solo en memoria', async () => {
  const routes=[];
  const fetcher=async (url,options)=>{
    routes.push(url);
    let body;
    if(url.endsWith('/login'))body={ok:true,data:{token:'aaa.bbb.ccc'}};
    else if(url.endsWith('/me')){assert.equal(options.headers.Authorization,'Bearer aaa.bbb.ccc');body={ok:true,data:{username:'dast_patient_a',rol_id:2}};}
    else body={ok:true,data:{username:'dast_patient_a',first_name:'Prueba',first_lastname:'Paciente',second_lastname:'A',email:'dast_patient_a@example.test'}};
    return new Response(JSON.stringify(body),{status:200});
  };
  assert.equal(await prepareToken('a'.repeat(40),fetcher),'aaa.bbb.ccc');
  assert.equal(routes.length,3);assert.equal(routes.filter(r=>r.endsWith('/login')).length,1);
});

test('bloquea otra identidad antes de iniciar JMeter y reduce errores HTTP a codigos', async () => {
  await assert.rejects(prepareToken('a'.repeat(40),async url=>new Response(JSON.stringify(url.endsWith('/login')?
    {ok:true,data:{token:'aaa.bbb.ccc'}}:{ok:true,data:{username:'dast_patient_b',rol_id:2}}),{status:200})),{code:'fixture-identity'});
  await assert.rejects(apiRequest('/api/mobile/auth/me',{},async()=>{throw new Error('private token');}), e=>{
    assert.equal(e.message,'api-http');assert.ok(!JSON.stringify(e).includes('private'));return true;
  });
});

test('el plan fijo usa GET, loopback, pausas, limites de tiempo y no sigue redirecciones',()=>{
  const xml=fs.readFileSync(path.join(__dirname,'../../tools/performance/local-read.jmx'),'utf8');
  assert.equal((xml.match(/name="HTTPSampler.domain">127.0.0.1/g)||[]).length,2);
  assert.equal((xml.match(/name="HTTPSampler.method">GET/g)||[]).length,2);
  assert.equal((xml.match(/name="HTTPSampler.follow_redirects">false/g)||[]).length,2);
  assert.equal((xml.match(/name="HTTPSampler.auto_redirects">false/g)||[]).length,2);
  assert.ok(xml.includes('System.getenv(\'CNM_JMETER_TOKEN\')'));
  assert.ok(xml.includes('name="ConstantTimer.delay">1000'));
  assert.ok(!xml.includes('POST') || xml.includes('DO_MULTIPART_POST'));
});
