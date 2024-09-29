const express = require('express');
const next = require('next');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const result = dotenv.config({ path: path.join(__dirname, '..', '.env') });
if (result.error) {
  throw result.error;
}

console.log('Environment variables loaded:', process.env.CLERK_WEBHOOK_SECRET ? 'CLERK_WEBHOOK_SECRET is set' : 'CLERK_WEBHOOK_SECRET is not set');

const clerkWebhooks = require('./routes/clerkWebhooks');
const { pool } = require('./database/db');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev, dir: path.join(__dirname, '..') });
const handle = nextApp.getRequestHandler();

console.log('Starting server...');
const app = express();

const setupServer = async () => {
  await nextApp.prepare();
  console.log('Next.js app prepared');

  // Test the database connection
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Database connection successful. Current time:', res.rows[0].now);
  } catch (err) {
    console.error('Error connecting to the database:', err);
  }

  // Use the clerkWebhooks router
  app.use('/webhooks/clerk-webhooks', clerkWebhooks);
  console.log('Clerk webhooks route set up');

  // Handle all other routes with Next.js
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  return app;
};

if (require.main === module) {
  setupServer().then((server) => {
    const port = process.env.PORT || 5000;
    server.listen(port, (err) => {
      if (err) throw err;
      console.log(`> Server ready on http://localhost:${port}`);
      console.log('> Database server and Clerk webhooks are active');
    });
  }).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = setupServer;