require('dotenv').config();
const { executeQuery, closePool } = require('./config/database');

async function createSequences() {
  try {
    console.log("Creating sequences...");
    await executeQuery(`CREATE SEQUENCE IF NOT EXISTS SEQ_PATIENTS START WITH 1 INCREMENT BY 1`);
    await executeQuery(`CREATE SEQUENCE IF NOT EXISTS SEQ_APPOINTMENTS START WITH 1 INCREMENT BY 1`);
    console.log("Sequences created successfully.");
  } catch (err) {
    console.error("Failed to create sequences:", err);
  } finally {
    await closePool();
  }
}

createSequences();
