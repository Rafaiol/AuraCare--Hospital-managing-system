require('dotenv').config();
const { executeQuery } = require('./config/database');

async function addNotificationsTable() {
  try {
    console.log('Creating NOTIFICATIONS table...');
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS NOTIFICATIONS (
          NOTIFICATION_ID SERIAL PRIMARY KEY,
          USER_ID INT,
          TITLE VARCHAR(100) NOT NULL,
          MESSAGE TEXT NOT NULL,
          TYPE VARCHAR(20) DEFAULT 'INFO' CHECK (TYPE IN ('INFO', 'SUCCESS', 'WARNING', 'ERROR')),
          IS_READ INT DEFAULT 0,
          CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT FK_NOTIFICATION_USER FOREIGN KEY (USER_ID) REFERENCES USERS(USER_ID) ON DELETE CASCADE
      );
    `);
    
    await executeQuery(`CREATE INDEX IF NOT EXISTS IDX_NOTIFICATIONS_USER ON NOTIFICATIONS(USER_ID);`);
    await executeQuery(`CREATE INDEX IF NOT EXISTS IDX_NOTIFICATIONS_READ ON NOTIFICATIONS(IS_READ);`);
    
    console.log('NOTIFICATIONS table created successfully.');
  } catch (err) {
    console.error('Error creating NOTIFICATIONS table:', err);
  } finally {
    process.exit(0);
  }
}

addNotificationsTable();
