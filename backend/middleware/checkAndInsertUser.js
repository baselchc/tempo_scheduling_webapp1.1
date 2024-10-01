const db = require('../database/db');

// Middleware to check if a user exists in the database and insert if not
const checkAndInsertUser = async (req, res, next) => {
  try {
    // Check if the request has authentication info
    // This assumes Clerk middleware has already run
    if (!req.auth || !req.auth.userId) {
      console.log('No authentication found in request');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Query the database to check if the user exists
    const { rows } = await db.query('SELECT * FROM users WHERE clerk_id = $1', [req.auth.userId]);

    if (rows.length === 0) {
      // User doesn't exist, so insert them into the database
      await db.query(
        'INSERT INTO users (clerk_id, email, username) VALUES ($1, $2, $3)',
        [req.auth.userId, req.auth.email, req.auth.username]
      );
      console.log('New user inserted:', req.auth.userId);
    } else {
      console.log('User already exists:', req.auth.userId);
      // TODO: Consider updating user info here 
    }

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    // Log the error for debugging
    console.error('Error in checkAndInsertUser middleware:', error);
    
    // Send an error response
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = checkAndInsertUser;

// TODO: More specific error handling here