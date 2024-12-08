import express from 'express';
import next from 'next';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { supabase } from './database/supabaseClient.js';

// Import route handlers
import userRoutes from './routes/userRoutes.js';
import clerkWebhooks from './routes/clerkWebhooks.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import errorHandler from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

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

  // Debug middleware
  app.use((req, res, next) => {
    console.log('Incoming request:', req.method, req.path);
    next();
  });

  // Health check endpoint
  app.get('/health', async (req, res) => {
    console.log('Health check endpoint hit');
    try {
      console.log('Attempting Supabase query...');
      const { data, error } = await supabase.from('users').select('count').single();
      console.log('Supabase response:', { data, error });
      if (error) throw error;
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: 'Connected'
      });
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({ 
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        database: 'Disconnected',
        error: error.message
      });
    }
  });

  // Middleware
  app.use('/webhooks/clerk', bodyParser.raw({ type: 'application/json' }), clerkWebhooks);
  app.use(bodyParser.json({ limit: '1mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));

  // API Routes
  app.use('/api/users', userRoutes);
  app.use('/api/schedule', scheduleRoutes);
  app.use('/api/employees', employeeRoutes);

  // Test database connection
  try {
    console.log('Testing database connection...');
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .single();
    
    console.log('Database test response:', { data, error });
    if (error) throw error;
    console.log('Supabase connection successful');
  } catch (err) {
    console.error('Error connecting to Supabase:', err);
  }

  // Development logging
  if (dev) {
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.url}`);
      next();
    });
  }

  // Next.js handler
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  // Error handling
  app.use(errorHandler);

  return app;
};

let server = null;

if (import.meta.url.endsWith('index.js')) {
  setupServer().then((app) => {
    const port = process.env.PORT || 5000;
    server = app.listen(port, (err) => {
      if (err) throw err;
      console.log(`> Server ready on http://localhost:${port}`);
      console.log('> Supabase and Clerk webhooks are active');
      console.log(`> Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
    });
  }).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

// Graceful shutdown
const cleanup = async (signal) => {
  console.log(`${signal} received, shutting down gracefully`);
  try {
    if (server) {
      console.log('Closing HTTP server...');
      await new Promise((resolve) => server.close(resolve));
      console.log('HTTP server closed');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => cleanup('SIGTERM'));
process.on('SIGINT', () => cleanup('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  cleanup('UNCAUGHT_EXCEPTION');
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default setupServer;