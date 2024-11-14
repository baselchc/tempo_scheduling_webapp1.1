const express = require('express');
const next = require('next');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const errorHandler = require('./middleware/errorHandler');

// Import route handlers and database configuration
const userRoutes = require('./routes/userRoutes');
const clerkWebhooks = require('./routes/clerkWebhooks');
const scheduleRoutes = require('./routes/scheduleRoutes');
const { pool } = require('./database/db');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
console.log('CLERK_WEBHOOK_SECRET:', process.env.CLERK_WEBHOOK_SECRET ? 'is set' : 'is NOT set');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev, dir: path.join(__dirname, '..') });
const handle = nextApp.getRequestHandler();

const setupServer = async () => {
  await nextApp.prepare();
  console.log('Next.js app prepared');

  const app = express();

  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use('/webhooks/clerk', bodyParser.raw({ type: 'application/json' }), clerkWebhooks);
  
  // Increase payload size limit if needed
  app.use(bodyParser.json({ limit: '1mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

  app.use('/api/users', userRoutes);
  app.use('/api/schedule', scheduleRoutes);

  // Test database connection
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Database connection successful. Current time:', res.rows[0].now);
  } catch (err) {
    console.error('Error connecting to the database:', err);
  }

  // Handle Next.js requests
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  // Error handling middleware - this must be last!
  app.use(errorHandler);

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

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  try {
    await pool.end();
    console.log('Database pool closed');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});

module.exports = setupServer;