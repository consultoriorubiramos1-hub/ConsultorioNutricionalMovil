const profiles = [
  { id: 200001, userId: 100001, username: 'dast_patient_a', surname: 'A', birthDate: '2000-01-15', phone: '0000000000' },
  { id: 200002, userId: 100002, username: 'dast_patient_b', surname: 'B', birthDate: '2001-02-20', phone: '0000000001' },
];
const markerFor = profile => `[CNM-LOCAL-FIXTURE] perfil ${profile.surname}`;

function localConnection(env) {
  const url = new URL(env.DATABASE_URL);
  if (env.CNM_LOCAL_DAST !== '1' || env.POSTGRES_URL !== env.DATABASE_URL ||
      !['postgres:', 'postgresql:'].includes(url.protocol) || url.hostname !== 'db' ||
      url.port !== '5432' || url.pathname !== '/cnm_dast' || url.username !== 'dast' ||
      !url.password || url.search || url.hash) {
    throw new Error('El sembrado solo admite el entorno de fixtures db:5432/cnm_dast.');
  }
  return url.href;
}

async function seedProfiles(client, env = process.env) {
  localConnection(env);
  await client.query('BEGIN');
  try {
    await client.query('LOCK TABLE tblusers, tblpatients IN SHARE ROW EXCLUSIVE MODE');
    const marker = await client.query('SELECT purpose FROM dast_control.environment WHERE singleton = true');
    if (marker.rows.length !== 1 || marker.rows[0].purpose !== 'cnm-local-dast') throw new Error('Falta la marca de aislamiento.');
    const expected = [...profiles.map(p => ({ id: p.userId, username: p.username, rol_id: 2, active: true })),
      { id: 100003, username: 'dast_other_role', rol_id: 1, active: true },
      { id: 100004, username: 'dast_inactive', rol_id: 2, active: false }];
    const users = await client.query('SELECT id, username, rol_id, active FROM tblusers');
    if (users.rows.length !== expected.length || users.rows.some(row => !expected.some(user =>
      user.id === Number(row.id) && user.username === row.username && user.rol_id === Number(row.rol_id) && user.active === row.active))) {
      throw new Error('Se requieren exclusivamente las cuatro cuentas de autenticacion sinteticas.');
    }
    const existing = await client.query('SELECT id, user_id, notes FROM tblpatients');
    if (existing.rows.some(row => !profiles.some(profile => Number(row.id) === profile.id && Number(row.user_id) === profile.userId && row.notes === markerFor(profile)))) {
      throw new Error('Hay pacientes distintos de los perfiles sinteticos previstos.');
    }
    let created = 0;
    for (const profile of profiles) {
      const result = await client.query(`INSERT INTO tblpatients
        (id, user_id, first_name, second_name, first_lastname, second_lastname,
         age, gender, phone, notes, active, fecha_nacimiento, estado_civil, ocupacion)
        VALUES ($1, $2, 'Prueba', NULL, 'Paciente', $3,
          EXTRACT(YEAR FROM AGE(CURRENT_DATE, $4::date))::integer, 'No especificado', $5, $6,
          true, $4::date, 'No especificado', 'Cuenta ficticia de pruebas')
        ON CONFLICT (id) DO NOTHING`,
      [profile.id, profile.userId, profile.surname, profile.birthDate, profile.phone, markerFor(profile)]);
      created += result.rowCount;
    }
    await client.query('COMMIT');
    return { created, preserved: profiles.length - created };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  }
}

async function main() {
  const { Client } = require('pg');
  const client = new Client({ connectionString: localConnection(process.env) });
  await client.connect();
  try {
    const result = await seedProfiles(client);
    console.log(`Perfiles ficticios preparados: ${result.created} creados y ${result.preserved} conservados. No se sobrescribieron cambios de pruebas.`);
    console.log('No se crearon mediciones, planes ni correos. Siguiente: node dast-tools/check-profiles.cjs');
  } finally { await client.end(); }
}

module.exports = { localConnection, seedProfiles, profiles };
if (require.main === module) main().catch(() => {
  console.error('No se pudieron preparar perfiles. Revisa las cuentas sinteticas, la marca de aislamiento y el esquema local; no se confirmaron cambios.');
  process.exitCode = 1;
});
