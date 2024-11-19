// backend/database/db.js

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

// First try connection string if available
const connectionString = process.env.DATABASE_URL;

// Backup configuration object
const poolConfig = connectionString ? { connectionString } : {
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  port: process.env.POSTGRES_PORT,
};

// Add SSL configuration if needed (for production)
if (process.env.NODE_ENV === 'production') {
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
}

// Add pool specific configurations
const poolSettings = {
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  maxUses: 7500
};

const finalConfig = {
  ...poolConfig,
  ...poolSettings
};

// Log configuration (safely)
console.log('Database configuration:', {
  ...finalConfig,
  password: '[REDACTED]',
  connectionString: connectionString ? '[REDACTED]' : undefined
});

let pool;
try {
  pool = new Pool(finalConfig);
  console.log('Pool created successfully');
} catch (err) {
  console.error('Error creating pool:', err);
  process.exit(1);
}

// Enhanced error handling
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client:', {
    error: err.message,
    code: err.code,
    stack: err.stack
  });
  if (client) {
    client.release(true);
  }
});

// Connection monitoring
pool.on('connect', () => console.log('New database connection established'));
pool.on('acquire', () => console.log('Database connection acquired from pool'));
pool.on('remove', () => console.log('Database connection removed from pool'));

// Wrapped query function with retries
const query = async (text, params, retries = 3) => {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      try {
        console.log(`Executing query (attempt ${i + 1}):`, text);
        const start = Date.now();
        const result = await client.query(text, params);
        const duration = Date.now() - start;
        console.log(`Query completed in ${duration}ms`);
        return result;
      } finally {
        client.release();
      }
    } catch (err) {
      lastError = err;
      console.error(`Query attempt ${i + 1} failed:`, {
        error: err.message,
        code: err.code
      });
      // Wait before retrying
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  throw lastError;
};

// Test connection immediately
(async () => {
  try {
    console.log('Testing database connection...');
    const result = await query('SELECT NOW()', []);
    console.log('Database connection test successful:', result.rows[0]);
  } catch (err) {
    console.error('Initial database connection test failed:', {
      error: err.message,
      code: err.code,
      stack: err.stack
    });
    // Don't exit here - let the application handle reconnection
  }
})();

module.exports = {
  query,
  pool,
  getClient: async () => {
    const client = await pool.connect();
    const originalQuery = client.query.bind(client);
    const release = client.release.bind(client);

    const timeout = setTimeout(() => {
      console.error('A client has been checked out for too long.');
      console.error(`The last executed query on this client was: ${client.lastQuery}`);
    }, 5000);

    client.query = (...args) => {
      client.lastQuery = args;
      return originalQuery(...args);
    };

    client.release = () => {
      clearTimeout(timeout);
      client.query = originalQuery;
      client.lastQuery = null;
      return release();
    };

    return client;
  }
};