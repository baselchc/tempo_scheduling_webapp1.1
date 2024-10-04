const express = require('express');
const next = require('next');
const path = require('path');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes');

// Load environment variables from .env file
// This is crucial for keeping sensitive info out of the codebase
const result = dotenv.config({ path: path.join(__dirname, '..', '.env') });
if (result.error) {
  throw result.error;
}

// Log whether CLERK_WEBHOOK_SECRET is set - important for webhook functionality
console.log('Environment variables loaded:', process.env.CLERK_WEBHOOK_SECRET ? 'CLERK_WEBHOOK_SECRET is set' : 'CLERK_WEBHOOK_SECRET is not set');

const clerkWebhooks = require('./routes/clerkWebhooks');
const { pool } = require('./database/db');

// Determine if we're in dev mode - affects how Next.js behaves
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev, dir: path.join(__dirname, '..') });
const handle = nextApp.getRequestHandler();

console.log('Starting server...');

const app = express();

const setupServer = async () => {
  await nextApp.prepare();
  console.log('Next.js app prepared');

  // Test the database connection
  // This helps catch DB issues early on startup
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Database connection successful. Current time:', res.rows[0].now);
  } catch (err) {
    console.error('Error connecting to the database:', err);
  }

  // Set up the Clerk webhooks route
  // This is where Clerk will send user-related events
  app.use('/webhooks/clerk-webhooks', clerkWebhooks);
  app.use('/api/users', userRoutes);
  console.log('Clerk webhooks route set up');

  // Handle all other routes with Next.js
  // This allows Next.js to control routing for the rest of the app
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  return app;
};

// Only run the server if this file is run directly (not imported)
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

// Export setupServer for potential use in testing or other modules
module.exports = setupServer;

// References used
// https://ngrok.com/docs/integrations/clerk/webhooks/
// AI was used for debugging and fixing errors