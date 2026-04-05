require('dotenv').config();
const { executeQuery, executeQueryWithPagination, closePool } = require('./config/database');

async function testQueries() {
  try {
    console.log("Testing getProfile query...");
    const userId = 1; // Assuming admin has ID 1
    const userResult = await executeQuery(
      `SELECT U.USER_ID, U.USERNAME, U.EMAIL, U.FIRST_NAME, U.LAST_NAME, 
              U.PHONE, U.STATUS, U.PROFILE_IMAGE, U.LAST_LOGIN, U.CREATED_AT,
              R.ROLE_ID, R.ROLE_NAME, R.PERMISSIONS
       FROM USERS U
       JOIN ROLES R ON U.ROLE_ID = R.ROLE_ID
       WHERE U.USER_ID = $1`,
      [userId]
    );
    console.log("getProfile query result:", userResult.rows[0]);

    console.log("\\nTesting getPatients query...");
    const baseQuery = `
      SELECT 
        P.PATIENT_ID, P.PATIENT_CODE, P.FIRST_NAME, P.LAST_NAME, 
        P.DATE_OF_BIRTH, P.GENDER, P.BLOOD_GROUP, P.PHONE, 
        P.EMAIL, P.STATUS, P.CREATED_AT,
        D.DOCTOR_ID, U.FIRST_NAME || ' ' || U.LAST_NAME as DOCTOR_NAME
      FROM PATIENTS P
      LEFT JOIN DOCTORS D ON P.ASSIGNED_DOCTOR_ID = D.DOCTOR_ID
      LEFT JOIN USERS U ON D.USER_ID = U.USER_ID
      WHERE 1=1
    `;
    const patientsResult = await executeQueryWithPagination(baseQuery, [], 1, 10);
    console.log("getPatients query success. Found", patientsResult.data.length, "patients");

  } catch (err) {
    console.error("Test queries failed:", err);
  } finally {
    await closePool();
  }
}

testQueries();
