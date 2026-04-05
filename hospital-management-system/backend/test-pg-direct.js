require('dotenv').config();
const { Pool } = require('pg');

async function testCount() {
  const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    database: process.env.PGDATABASE || 'hospital_db'
  });

  const res = await pool.query('SELECT COUNT(*) as total FROM PATIENTS');
  console.log('Direct PG COUNT:', res.rows[0].total);

  const res2 = await pool.query('SELECT COUNT(*) as total FROM (SELECT PATIENT_ID, PATIENT_CODE, FIRST_NAME, LAST_NAME, GENDER, PHONE, EMAIL, STATUS, CREATED_AT FROM PATIENTS WHERE 1=1) as count_query');
  console.log('Nested PG COUNT:', res2.rows[0].total);

  await pool.end();
}

testCount().catch(console.error);
