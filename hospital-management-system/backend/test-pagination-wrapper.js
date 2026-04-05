require('dotenv').config();
const { executeQueryWithPagination, initializePool, closePool } = require('./config/database');

async function testQuery() {
  await initializePool();
  let sql = `
    SELECT PATIENT_ID, PATIENT_CODE, FIRST_NAME, LAST_NAME, GENDER, 
           PHONE, EMAIL, STATUS, CREATED_AT
    FROM PATIENTS
    WHERE 1=1
  `;
  const result = await executeQueryWithPagination(sql, {}, 1, 10);
  console.log('Total count:', result.pagination.total);
  console.log('Result length:', result.data.length);
  await closePool();
}

testQuery().catch(console.error);
