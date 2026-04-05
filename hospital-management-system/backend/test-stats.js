require('dotenv').config();
const { executeQuery, initializePool } = require('./config/database');

async function testStats() {
  try {
    await initializePool();
    console.log('Running query...');
    const result = await executeQuery('SELECT * FROM V_DASHBOARD_STATS');
    console.log('Result:', result.rows);
  } catch (error) {
    console.error('FULL ERROR:', error);
  } finally {
    process.exit(0);
  }
}

testStats();
