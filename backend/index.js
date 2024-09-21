const express = require('express');
const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');
const checkAndInsertUser = require('./checkAndInsertUser');
const clerkWebhooks = require('./clerkWebhooks');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());

// Use Clerk middleware to authenticate requests
app.use(ClerkExpressWithAuth());

// Uses middleware to check and insert users
app.use(checkAndInsertUser);

// Registers the webhook endpoint
app.use('/webhooks', clerkWebhooks);

// Defines the protected routes here
app.get('/', (req, res) => {
  res.send('Schedule App Backend is running');
});

// Starts the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
