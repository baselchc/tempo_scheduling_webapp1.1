const db = require('../database/db');

const checkAndInsertUser = async (req, res, next) => {
  try {
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Checks if the user exists in the database
    const { rows } = await db.query('SELECT * FROM users WHERE clerk_id = $1', [req.auth.userId]);

    if (rows.length === 0) {
      // If the User doesn't exists, then inserts them
      await db.query(
        'INSERT INTO users (clerk_id, email, username) VALUES ($1, $2, $3)',
        [req.auth.userId, req.auth.email, req.auth.username]
      );
      console.log('New user inserted');
    } else {
      console.log('User already exists');
    }

    next();
  } catch (error) {
    console.error('Error in checkAndInsertUser middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = checkAndInsertUser;