const express = require('express');
const next = require('next');
const path = require('path');
const bodyParser = require('body-parser');

// Import route handlers and database configuration.
const userRoutes = require('./routes/userRoutes');
const clerkWebhooks = require('./routes/clerkWebhooks');
const { pool } = require('./database/db');

// Load environment variables from the .env file located in the parent directory.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
console.log('CLERK_WEBHOOK_SECRET:', process.env.CLERK_WEBHOOK_SECRET ? 'is set' : 'is NOT set');

// Check if the environment is in development mode.
const dev = process.env.NODE_ENV !== 'production';
// Create a new Next.js app instance, passing in dev mode and setting the directory to the parent directory.
const nextApp = next({ dev, dir: path.join(__dirname, '..') });
const handle = nextApp.getRequestHandler(); // Get request handler from the Next.js app.

// Create a new Express server instance.
const app = express();

const setupServer = async () => {
  // Prepare the Next.js app before starting the server.
  await nextApp.prepare();
  console.log('Next.js app prepared');

  // Test database connection by querying the current timestamp.
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Database connection successful. Current time:', res.rows[0].now);
  } catch (err) {
    console.error('Error connecting to the database:', err);
  }

  // Setup routes for the Express server.
  // Use raw body parsing for the Clerk webhooks route to handle JSON payloads correctly.
  app.use('/webhooks/clerk', bodyParser.raw({ type: 'application/json' }), clerkWebhooks);
  
  // Use JSON body parsing middleware for API routes related to users.
  app.use('/api/users', bodyParser.json(), userRoutes);

  // Handle all other routes using Next.js's custom request handler.
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  return app; // Return the configured Express server instance.
};

// If the file is being executed directly (instead of being imported as a module), set up the server.
if (require.main === module) {
  setupServer().then((server) => {
    const port = process.env.PORT || 5000; // Set port to environment variable or default to 5000.
    server.listen(port, (err) => {
      if (err) throw err;
      console.log(`> Server ready on http://localhost:${port}`);
      console.log('> Database server and Clerk webhooks are active');
    });
  }).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1); // Exit the process if server setup fails.
  });
}

// Export the setupServer function for use in other files 
module.exports = setupServer;


// References used for backend
// https://ngrok.com/docs/integrations/clerk/webhooks/
// AI was used for debugging and fixing errors