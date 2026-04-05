/**
 * PostgreSQL Database Configuration
 * Implements connection pooling for optimal performance
 */
const { Pool, types } = require('pg');

// Tell pg to return DATE and TIMESTAMP columns as raw strings
// instead of converting to JS Date objects (which causes timezone-based day shifts).
types.setTypeParser(1082, val => val); // DATE
types.setTypeParser(1114, val => val); // TIMESTAMP WITHOUT TIME ZONE
types.setTypeParser(1184, val => val); // TIMESTAMP WITH TIME ZONE

// Database configuration
const dbConfig = {
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE || 'hospital_db',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

if (process.env.DATABASE_URL) {
  dbConfig.connectionString = process.env.DATABASE_URL;
  // Render requires SSL for external connections
  dbConfig.ssl = {
    rejectUnauthorized: false
  };
}

// Connection pool instance
let connectionPool = null;

/**
 * Initialize the connection pool
 */
async function initializePool() {
  try {
    if (!connectionPool) {
      console.log('Initializing PostgreSQL connection pool...');
      connectionPool = new Pool(dbConfig);
      console.log('PostgreSQL connection pool initialized successfully');
    }
    return connectionPool;
  } catch (error) {
    console.error('Error initializing PostgreSQL connection pool:', error);
    throw error;
  }
}

/**
 * Get a connection from the pool
 */
async function getConnection() {
  try {
    if (!connectionPool) {
      await initializePool();
    }
    const client = await connectionPool.connect();
    return {
      execute: async (sql, params) => client.query(sql, params),
      commit: async () => client.query('COMMIT'),
      rollback: async () => client.query('ROLLBACK'),
      close: async () => client.release()
    };
  } catch (error) {
    console.error('Error getting connection from pool:', error);
    throw error;
  }
}

/**
 * Execute a query with automatic connection management
 */
async function executeQuery(sql, params = []) {
  try {
    if (!connectionPool) {
      await initializePool();
    }

    const result = await connectionPool.query(sql, params);

    // Format output to match existing expectations
    const formattedResult = {
      rows: result.rows || [],
      rowsAffected: result.rowCount
    };

    // Convert lowercase property names to UPPERCASE to mimic Oracle mapping
    if (formattedResult.rows.length > 0) {
      formattedResult.rows = formattedResult.rows.map(row => {
        const upperRow = {};
        for (const [key, value] of Object.entries(row)) {
          upperRow[key.toUpperCase()] = value;
        }
        return upperRow;
      });
    }

    return formattedResult;
  } catch (error) {
    console.error('Query execution error:', error);
    throw error;
  }
}

/**
 * Execute a query with pagination support using Postgres LIMIT and OFFSET
 */
async function executeQueryWithPagination(sql, params = [], page = 1, limit = 10) {
  try {
    if (!connectionPool) {
      await initializePool();
    }

    const offset = (page - 1) * limit;

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as count_query`;
    const countResult = await connectionPool.query(countSql, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // Paginated query
    const paginatedSql = `${sql} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const paginatedParams = [...params, limit, offset];

    const result = await connectionPool.query(paginatedSql, paginatedParams);

    // Uppercase property names
    const rows = result.rows.map(row => {
      const upperRow = {};
      for (const [key, value] of Object.entries(row)) {
        upperRow[key.toUpperCase()] = value;
      }
      return upperRow;
    });

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    };
  } catch (error) {
    console.error('Pagination query error:', error);
    throw error;
  }
}

/**
 * Close the connection pool
 */
async function closePool() {
  try {
    if (connectionPool) {
      await connectionPool.end();
      connectionPool = null;
      console.log('PostgreSQL connection pool closed');
    }
  } catch (error) {
    console.error('Error closing connection pool:', error);
    throw error;
  }
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    if (!connectionPool) {
      await initializePool();
    }
    const result = await connectionPool.query('SELECT 1 as test');
    console.log('Database connection test successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

module.exports = {
  initializePool,
  getConnection,
  executeQuery,
  executeQueryWithPagination,
  closePool,
  testConnection
};
