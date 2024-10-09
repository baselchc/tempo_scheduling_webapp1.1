const express = require('express');
const next = require('next');
const path = require('path');
const bodyParser = require('body-parser');

// Import route handlers and database configuration.
const userRoutes = require('./routes/userRoutes'); // Routes for user-related API calls
const clerkWebhooks = require('./routes/clerkWebhooks'); // Routes for Clerk webhooks
const scheduleRoutes = require('./routes/scheduleRoutes'); // Import schedule routes
const { pool } = require('./database/db'); // Import the PostgreSQL database connection pool

// Load environment variables from the .env file located in the parent directory.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
console.log('CLERK_WEBHOOK_SECRET:', process.env.CLERK_WEBHOOK_SECRET ? 'is set' : 'is NOT set'); // Log whether the Clerk Webhook Secret is correctly set

// Check if the environment is in development mode.
const dev = process.env.NODE_ENV !== 'production'; // Determine whether the app is in development mode
// Create a new Next.js app instance, passing in dev mode and setting the directory to the parent directory.
const nextApp = next({ dev, dir: path.join(__dirname, '..') });
const handle = nextApp.getRequestHandler(); // Get request handler from the Next.js app to handle Next.js-specific routes

// Create a new Express server instance.
const app = express(); // Initialize Express server

// Async function to set up the server
const setupServer = async () => {
  // Prepare the Next.js app before starting the server.
  await nextApp.prepare(); // Prepare Next.js for handling requests
  console.log('Next.js app prepared'); // Confirm Next.js is ready

  // Test database connection by querying the current timestamp.
  try {
    const res = await pool.query('SELECT NOW()'); // Test query to verify database connectivity
    console.log('Database connection successful. Current time:', res.rows[0].now); // Log current timestamp to confirm successful database connection
  } catch (err) {
    console.error('Error connecting to the database:', err); // Log database connection error
  }

  // Setup routes for the Express server.
  
  // Use raw body parsing for the Clerk webhooks route to handle JSON payloads correctly.
  app.use('/webhooks/clerk', bodyParser.raw({ type: 'application/json' }), clerkWebhooks); // Route for handling Clerk webhooks

  // Use JSON body parsing middleware for API routes related to users and schedules.
  app.use('/api/users', bodyParser.json(), userRoutes); // Route for handling user-related API calls
  app.use('/api/schedule', bodyParser.json(), scheduleRoutes); // Route for handling schedule-related API calls

  // Handle all other routes using Next.js's custom request handler.
  app.all('*', (req, res) => {
    return handle(req, res); // For all other requests, use Next.js to handle routing
  });

  return app; // Return the configured Express server instance.
};

// If the file is being executed directly (instead of being imported as a module), set up the server.
if (require.main === module) {
  setupServer()
    .then((server) => {
      const port = process.env.PORT || 5000; // Set port to environment variable or default to 5000.
      server.listen(port, (err) => {
        if (err) throw err;
        console.log(`> Server ready on http://localhost:${port}`); // Log server readiness
        console.log('> Database server and Clerk webhooks are active'); // Log that webhooks and database are active
      });
    })
    .catch((err) => {
      console.error('Failed to start server:', err); // Log failure to start the server
      process.exit(1); // Exit the process if server setup fails.
    });
}

// Export the setupServer function for use in other files.
module.exports = setupServer;
