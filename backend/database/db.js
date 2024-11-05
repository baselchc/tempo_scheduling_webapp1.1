const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

// Configuration object with all pool settings
const poolConfig = {
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  // Pool specific configurations
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  maxUses: 7500 // Close and replace a connection after it has been used 7500 times
};

// Log configuration (excluding sensitive data)
console.log('Database configuration:', {
  user: poolConfig.user,
  host: poolConfig.host,
  database: poolConfig.database,
  port: poolConfig.port,
  max: poolConfig.max,
  idleTimeoutMillis: poolConfig.idleTimeoutMillis,
  connectionTimeoutMillis: poolConfig.connectionTimeoutMillis,
  maxUses: poolConfig.maxUses
});

// Create the pool with the configuration
const pool = new Pool(poolConfig);

// Error handling for the pool itself
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client:', err);
  // Optionally close the client
  if (client) {
    client.release(true); // Force close the client
  }
});

// Connection handling
pool.on('connect', client => {
  console.log('New client connected to pool');
});

pool.on('acquire', client => {
  console.log('Client acquired from pool');
});

pool.on('remove', client => {
  console.log('Client removed from pool');
});

// Test the connection and export utilities
const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

// Initial connection test
(async () => {
  try {
    const result = await query('SELECT NOW()');
    console.log('Database connected successfully. Server time:', result.rows[0].now);
  } catch (err) {
    console.error('Error connecting to the database:', err);
    process.exit(1); // Exit if we can't connect to the database
  }
})();

// Export both the pool and a query utility
module.exports = {
  query,
  pool,
  // Helper function for transactions
  getClient: async () => {
    const client = await pool.connect();
    const originalQuery = client.query.bind(client);
    const release = client.release.bind(client);

    // Set a timeout of 5 seconds on client queries
    const timeout = setTimeout(() => {
      console.error('A client has been checked out for too long.');
      console.error(`The last executed query on this client was: ${client.lastQuery}`);
    }, 5000);

    // Monkey patch the query method to keep track of the last query executed
    client.query = (...args) => {
      client.lastQuery = args;
      return originalQuery(...args);
    };

    client.release = () => {
      clearTimeout(timeout);
      // Clear last query before releasing
      client.query = originalQuery;
      client.lastQuery = null;
      return release();
    };

    return client;
  }
};