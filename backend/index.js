const express = require('express');
const next = require('next');
const path = require('path');
const cors = require('cors');  // Import CORS
const bodyParser = require('body-parser');

// Import route handlers and database configuration.
const userRoutes = require('./routes/userRoutes');
const clerkWebhooks = require('./routes/clerkWebhooks');
const scheduleRoutes = require('./routes/scheduleRoutes');
const { pool } = require('./database/db');

// Load environment variables from the .env file located in the parent directory.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
console.log('CLERK_WEBHOOK_SECRET:', process.env.CLERK_WEBHOOK_SECRET ? 'is set' : 'is NOT set');

// Check if the environment is in development mode.
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev, dir: path.join(__dirname, '..') });
const handle = nextApp.getRequestHandler(); // Get request handler from the Next.js app.

// Create a new Express server instance.
const app = express();

// Enable CORS for requests coming from the frontend on port 3000
const corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Async function to set up the server
const setupServer = async () => {
  await nextApp.prepare(); // Prepare Next.js for handling requests
  console.log('Next.js app prepared');

  // Test database connection by querying the current timestamp.
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Database connection successful. Current time:', res.rows[0].now);
  } catch (err) {
    console.error('Error connecting to the database:', err);
  }

  // Setup routes for the Express server.
  app.use('/webhooks/clerk', bodyParser.raw({ type: 'application/json' }), clerkWebhooks);
  app.use('/api/users', bodyParser.json(), userRoutes); // Route for handling user-related API calls
  app.use('/api/schedule', bodyParser.json(), scheduleRoutes); // Route for handling schedule-related API calls

  // Handle all other routes using Next.js's custom request handler.
  app.all('*', (req, res) => {
    return handle(req, res); // For all other requests, use Next.js to handle routing
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

//taken help of chatgpt for connecting