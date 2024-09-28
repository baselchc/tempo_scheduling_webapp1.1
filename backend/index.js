const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });
const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');
const checkAndInsertUser = require('./middleware/checkAndInsertUser');
const clerkWebhooks = require('./routes/clerkWebhooks');
const db = require('./database/db');

const app = express();
app.use(express.json());

// Tests the database connection
db.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error executing query', err);
    } else {
        console.log('Database connection successful. Current time:', res.rows[0].now);
    }
});

// Public route for Clerk webhooks (no authentication required)
app.use('/webhooks', clerkWebhooks);

// Protected routes for authenticated users only
app.use('/protected-route', ClerkExpressWithAuth(), checkAndInsertUser);

// Example protected route to verify database connection
app.get('/users', ClerkExpressWithAuth(), checkAndInsertUser, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM users');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Error fetching users');
    }
});

// Serves static files from the React app
app.use(express.static(path.join(__dirname, '..', 'app', 'employee')));


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'app', 'employee', 'page.js'));
});

// Starts the server on port 5000
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

module.exports = app;