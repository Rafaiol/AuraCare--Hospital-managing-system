require('dotenv').config();
const { Client } = require('pg');

async function createDatabase() {
  const client = new Client({
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || 5432,
    database: 'postgres' // connect to default db
  });

  try {
    await client.connect();
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname='hospital_db'");
    if (res.rowCount === 0) {
      console.log('Creating database hospital_db...');
      await client.query('CREATE DATABASE hospital_db');
      console.log('Database created successfully.');
    } else {
      console.log('Database hospital_db already exists.');
    }
  } catch (err) {
    console.error('Error creating database:', err);
  } finally {
    await client.end();
  }
}

createDatabase();
