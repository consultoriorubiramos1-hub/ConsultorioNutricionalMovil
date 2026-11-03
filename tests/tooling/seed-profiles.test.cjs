const assert = require('node:assert/strict');
const { test } = require('node:test');
const { localConnection, seedProfiles, profiles } = require('../../tools/dast/scripts/seed-profiles.cjs');
const localUrl = 'postgresql://dast:fixture-only@db:5432/cnm_dast';
const env = { CNM_LOCAL_DAST: '1', DATABASE_URL: localUrl, POSTGRES_URL: localUrl };
function clientFixture() {
  const users = [
    { id: 100001, username: 'dast_patient_a', rol_id: 2, active: true },
    { id: 100002, username: 'dast_patient_b', rol_id: 2, active: true },
    { id: 100003, username: 'dast_other_role', rol_id: 1, active: true },
    { id: 100004, username: 'dast_inactive', rol_id: 2, active: false },
  ];
  const client = { users, patients: [], calls: [], marker: 'cnm-local-dast', failSecond: false };
  let before;
  client.query = async (sql, params) => {
    client.calls.push(sql);
    if (sql === 'BEGIN') { before = structuredClone(client.patients); return {}; }
    if (sql === 'ROLLBACK') { client.patients = before; return {}; }
    if (sql === 'COMMIT' || sql.startsWith('LOCK TABLE')) return {};
    if (sql.includes('FROM dast_control.environment')) return { rows: [{ purpose: client.marker }] };
    if (sql.startsWith('SELECT id, username')) return { rows: client.users };
    if (sql.startsWith('SELECT id, user_id')) return { rows: client.patients };
    if (sql.startsWith('INSERT INTO tblpatients')) {
      if (client.failSecond && params[0] === 200002) throw new Error('fixture insert failure');
      if (client.patients.some(row => row.id === params[0])) return { rowCount: 0 };
      client.patients.push({ id: params[0], user_id: params[1], notes: params[5], second_name: null });
      return { rowCount: 1 };
    }
    throw new Error('Unexpected SQL: ' + sql);
  };
  return client;
}

test('crea dos perfiles y conserva las ediciones al repetir', async () => {
  const client = clientFixture();
  assert.deepEqual(await seedProfiles(client, env), { created: 2, preserved: 0 });
  client.patients[0].second_name = 'Validacion';
  assert.deepEqual(await seedProfiles(client, env), { created: 0, preserved: 2 });
  assert.equal(client.patients[0].second_name, 'Validacion');
  assert.deepEqual(client.patients.map(row => row.user_id), profiles.map(row => row.userId));
  assert.equal(client.calls.some(sql => /UPDATE|DELETE|TRUNCATE/.test(sql)), false);
});

test('rechaza destinos ajenos antes de iniciar consultas', async () => {
  const client = clientFixture();
  for (const url of [localUrl.replace('@db:', '@external.example.test:'), localUrl + '?host=external.example.test', localUrl.replace('/cnm_dast', '/other')]) {
    await assert.rejects(seedProfiles(client, { ...env, DATABASE_URL: url, POSTGRES_URL: url }));
  }
  assert.throws(() => localConnection({ ...env, CNM_LOCAL_DAST: undefined }));
  assert.throws(() => localConnection({ ...env, POSTGRES_URL: undefined }));
  assert.equal(client.calls.length, 0);
});

test('rechaza una marca de aislamiento distinta antes de insertar', async () => {
  const client = clientFixture(); client.marker = 'other';
  await assert.rejects(seedProfiles(client, env));
  assert.equal(client.calls.at(-1), 'ROLLBACK');
  assert.equal(client.calls.some(sql => sql.startsWith('INSERT')), false);
});

test('rechaza cuentas ajenas y pacientes ajenos sin insertar', async () => {
  for (const kind of ['user', 'patient', 'ownership']) {
    const client = clientFixture();
    if (kind === 'user') client.users[0].username = 'foreign';
    if (kind === 'patient') client.patients.push({ id: 1, user_id: 1, notes: 'foreign' });
    if (kind === 'ownership') client.patients.push({ id: 200001, user_id: 100001, notes: 'foreign' });
    await assert.rejects(seedProfiles(client, env));
    assert.equal(client.calls.at(-1), 'ROLLBACK');
    assert.equal(client.calls.some(sql => sql.startsWith('INSERT')), false);
  }
});

test('un fallo parcial revierte las dos inserciones sin confirmar', async () => {
  const client = clientFixture(); client.failSecond = true;
  await assert.rejects(seedProfiles(client, env));
  assert.deepEqual(client.patients, []);
  assert.equal(client.calls.at(-1), 'ROLLBACK');
  assert.equal(client.calls.includes('COMMIT'), false);
});
