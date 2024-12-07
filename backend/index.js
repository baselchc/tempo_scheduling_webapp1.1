const express = require('express');
const next = require('next');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const errorHandler = require('./middleware/errorHandler');
import { supabaseServer } from '../../lib/supabase-server';

// Import route handlers
const userRoutes = require('./routes/userRoutes');
const clerkWebhooks = require('./routes/clerkWebhooks');
const scheduleRoutes = require('./routes/scheduleRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
console.log('Environment:', process.env.NODE_ENV);
console.log('CLERK_WEBHOOK_SECRET:', process.env.CLERK_WEBHOOK_SECRET ? 'is set' : 'is NOT set');
console.log("Loaded Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("Loaded Supabase ANON KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
console.log("API URL:", process.env.API_URL);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'is set' : 'is NOT set');

// Import route handlers
const userRoutes = require('./routes/userRoutes');
const clerkWebhooks = require('./routes/clerkWebhooks');
const scheduleRoutes = require('./routes/scheduleRoutes');

// Check if the environment is in development mode
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev, dir: path.join(__dirname, '..') });
const handle = nextApp.getRequestHandler();

// Create a new Express server instance
const app = express();

// CORS options
const corsOptions = {
  origin: [process.env.API_URL, 'https://tempo-scheduling-webapp1-1.vercel.app', 'http://localhost:5000'],
  optionsSuccessStatus: 200,
};

// Enable CORS
app.use(cors(corsOptions));

// Set up Clerk webhooks route before any body-parser middleware
app.use('/webhooks/clerk', clerkWebhooks);

// Setup middleware for body parsing (after Clerk webhook to avoid parsing raw body)
app.use(bodyParser.json());
app.use(bodyParser.raw({ type: 'application/json' }));

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
  app.get('/health', async (req, res) => {
    try {
      const { data, error } = await supabaseServer.from('users').select('count').single();
      if (error) throw error;
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: 'Connected'
      });
    } catch (error) {
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
    const { data, error } = await supabaseServer
      .from('users')
      .select('count')
      .single();
    
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

if (require.main === module) {
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


//Taken help of ChatGPT for connecting. Prompt: "Help me adapt this to the Supabase database"
