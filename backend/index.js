const express = require('express');
const next = require('next');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
console.log('CLERK_WEBHOOK_SECRET:', process.env.CLERK_WEBHOOK_SECRET ? 'is set' : 'is NOT set');
console.log("Loaded Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("Loaded Supabase ANON KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
console.log("API URL:", process.env.API_URL);

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

  // Setup routes for the Express server
  app.use('/api/users', userRoutes);
  app.use('/api/schedule', scheduleRoutes);

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


//Taken help of ChatGPT for connecting. Prompt: "Help me adapt this to the Supabase database"
