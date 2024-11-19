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
const employeeRoutes = require('./routes/employeeRoutes'); // Add employee routes
const { pool } = require('./database/db');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
console.log('Environment:', process.env.NODE_ENV);
console.log('CLERK_WEBHOOK_SECRET:', process.env.CLERK_WEBHOOK_SECRET ? 'is set' : 'is NOT set');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev, dir: path.join(__dirname, '..') });
const handle = nextApp.getRequestHandler();

const setupServer = async () => {
  await nextApp.prepare();
  console.log('Next.js app prepared');

  const app = express();

  // Enhanced CORS configuration
  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : ['http://localhost:3000', 'http://localhost:5000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Middleware
  app.use('/webhooks/clerk', bodyParser.raw({ type: 'application/json' }), clerkWebhooks);
  app.use(bodyParser.json({ limit: '1mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

  // API Routes - make sure these are before the catch-all route
  app.use('/api/users', userRoutes);
  app.use('/api/schedule', scheduleRoutes);
  app.use('/api/employees', employeeRoutes); // Add employee routes

  // Test database connection
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Database connection successful. Current time:', res.rows[0].now);
  } catch (err) {
    console.error('Error connecting to the database:', err);
    // Don't exit here, but log the error
  }

  // Add request logging in development
  if (dev) {
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.url}`);
      next();
    });
  }

  // Handle Next.js requests - this should be after API routes
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  // Error handling middleware - must be last
  app.use(errorHandler);

  return app;
};

let server = null;

if (require.main === module) {
  setupServer().then((app) => {
    const port = process.env.PORT || 5000;
    server = app.listen(port, (err) => {
      if (err) throw err;
      console.log(`> Server ready on http://localhost:${port}`);
      console.log('> Database server and Clerk webhooks are active');
      console.log(`> Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });

    // Handle server errors
    server.on('error', (err) => {
      console.error('Server error:', err);
    });

  }).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

// Enhanced graceful shutdown
const cleanup = async (signal) => {
  console.log(`${signal} received, shutting down gracefully`);
  try {
    if (server) {
      console.log('Closing HTTP server...');
      await new Promise((resolve) => server.close(resolve));
      console.log('HTTP server closed');
    }

    console.log('Closing database pool...');
    await pool.end();
    console.log('Database pool closed');

    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => cleanup('SIGTERM'));
process.on('SIGINT', () => cleanup('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  cleanup('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = setupServer;