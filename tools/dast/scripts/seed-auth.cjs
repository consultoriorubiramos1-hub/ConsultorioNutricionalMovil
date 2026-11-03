const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function main() {
  const url = new URL(process.env.DATABASE_URL);
  if (url.hostname !== 'db' || url.pathname !== '/cnm_dast' || url.username !== 'dast' || url.search) {
    throw new Error('El sembrado solo admite la base del servicio db/cnm_dast.');
  }
  const password = process.env.AUTH_FIXTURE_PASSWORD;
  if (!password || password.length < 20) throw new Error('Falta la contraseña sintética del entorno.');
  const client = new Client({ connectionString: url.href });
  await client.connect();
  try {
    const marker = await client.query('SELECT purpose FROM dast_control.environment WHERE singleton = true');
    if (marker.rows[0]?.purpose !== 'cnm-local-dast') throw new Error('Falta la marca de aislamiento de la base.');
    const users = [
      { id: 100001, username: 'dast_patient_a', role: 2, active: true },
      { id: 100002, username: 'dast_patient_b', role: 2, active: true },
      { id: 100003, username: 'dast_other_role', role: 1, active: true },
      { id: 100004, username: 'dast_inactive', role: 2, active: false },
    ];
    const existing = await client.query('SELECT id, username FROM tblusers');
    if (existing.rows.some(row => !users.some(user => user.id === Number(row.id) && user.username === row.username))) {
      throw new Error('La base contiene usuarios distintos de los fixtures. No se modificó ninguna cuenta.');
    }
    const hash = await bcrypt.hash(password, 12);
    await client.query('BEGIN');
    await client.query("INSERT INTO tblroles (id, rol) VALUES (1, 'dast_otro'), (2, 'dast_paciente') ON CONFLICT (id) DO NOTHING");
    for (const user of users) {
      await client.query(`INSERT INTO tblusers (id, rol_id, username, email, password_hash, active, verified)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash, active = EXCLUDED.active, rol_id = EXCLUDED.rol_id`,
      [user.id, user.role, user.username, `${user.username}@example.test`, hash, user.active]);
    }
    await client.query('COMMIT');
    console.log('Creadas cuatro cuentas sintéticas para autenticación; no se crearon historias clínicas ni se enviaron correos.');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

main().catch(() => {
  console.error('No se pudo sembrar la base local. Comprueba la marca de aislamiento y la compatibilidad del esquema real.');
  process.exitCode = 1;
});
