// index.js (Backend entry point)
const express = require('express');
const next = require('next');
const path = require('path');
const cors = require('cors');  // Import CORS

const bodyParser = require('body-parser');

// Import route handlers and database configuration.
const userRoutes = require('./routes/userRoutes');
const clerkWebhooks = require('./routes/clerkWebhooks');
const scheduleRoutes = require('./routes/scheduleRoutes');

const employeeRoutes = require('./routes/employeeRoutes'); // Employee routes

const { pool } = require('./database/db');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev, dir: path.join(__dirname, '..') });
const handle = nextApp.getRequestHandler();

// Create a new Express server instance.
const app = express();

// Enable CORS for frontend

// Enable CORS for requests coming from the frontend on port 3000

const corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Async function to set up the server
const setupServer = async () => {

  await nextApp.prepare();

  await nextApp.prepare(); // Prepare Next.js for handling requests

  console.log('Next.js app prepared');

  // Test database connection
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Database connection successful. Server time:', res.rows[0].now);
  } catch (err) {
    console.error('Error connecting to the database:', err);
  }


  // Setup routes
  app.use('/webhooks/clerk', bodyParser.raw({ type: 'application/json' }), clerkWebhooks);
  app.use('/api/users', bodyParser.json(), userRoutes);
  app.use('/api/schedule', bodyParser.json(), scheduleRoutes);
  app.use('/api/employees', bodyParser.json(), employeeRoutes); // Employee routes

  // Setup routes for the Express server.
  app.use('/webhooks/clerk', bodyParser.raw({ type: 'application/json' }), clerkWebhooks);
  app.use('/api/users', bodyParser.json(), userRoutes); // Route for handling user-related API calls
  app.use('/api/schedule', bodyParser.json(), scheduleRoutes); // Route for handling schedule-related API calls


  // Handle all other routes using Next.js's request handler.
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
