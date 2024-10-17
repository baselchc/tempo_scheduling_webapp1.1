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
    const { rows } = await db.query('SELECT * FROM users WHERE clerk_user_id = $1', [req.auth.userId]);

    if (rows.length === 0) {
      // If the user doesn't exist, inserts them into the database
      await db.query(
        'INSERT INTO users (clerk_user_id, email, username) VALUES ($1, $2, $3)',
        [req.auth.userId, req.auth.email, req.auth.username]
      );
      console.log('New user inserted:', req.auth.userId);
    } else {
      console.log('User already exists:', req.auth.userId);
    }

    next();
  } catch (error) {
    // Specific error handling
    if (error.code === '23505') {  // Unique violation error code
      console.error('Duplicate key violation:', error);
      return res.status(409).json({ error: 'User already exists' });
    } else if (error.code === '23502') {  // Not null violation error code
      console.error('Not null constraint violation:', error);
      return res.status(400).json({ error: 'Missing required user information' });
    } else if (error.code === '42P01') {  // Undefined table error code
      console.error('Undefined table:', error);
      return res.status(500).json({ error: 'Database schema error' });
    } else if (error.code === '28P01') {  // Invalid password error code
      console.error('Database authentication failed:', error);
      return res.status(500).json({ error: 'Database connection error' });
    } else {
      // Error for unforeseen issues
      console.error('Unexpected error in checkAndInsertUser middleware:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
};

module.exports = checkAndInsertUser;