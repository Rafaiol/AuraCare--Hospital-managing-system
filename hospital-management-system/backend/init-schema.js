require('dotenv').config();
const fs = require('fs');
const { Pool } = require('pg');
const path = require('path');

async function initSchema() {
  const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    database: process.env.PGDATABASE || 'hospital_db'
  });

  try {
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('Executing schema.sql...');
    await pool.query(schemaSql);
    console.log('Schema created successfully.');
  } catch (err) {
    console.error('Error executing schema:', err);
  } finally {
    await pool.end();
  }
}

initSchema();
