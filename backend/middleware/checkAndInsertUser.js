// backend/middleware/checkAndInsertUser.js

const { pool } = require('../database/db');

const checkAndInsertUser = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    if (!req.auth || !req.auth.userId) {
      console.log('No authentication found in request');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Checking user in database for Clerk userId:', req.auth.userId);

    await client.query('BEGIN');

    // Check if user exists
    const { rows } = await client.query(
      'SELECT * FROM users WHERE clerk_user_id = $1',
      [req.auth.userId]
    );

    if (rows.length === 0) {
      const { email_addresses, username, firstName, lastName } = req.auth;
      const email = email_addresses?.[0]?.email_address;

      if (!email) {
        console.warn('Email missing from Clerk auth data');
        return res.status(400).json({ error: 'Email is required' });
      }

      console.log('Creating new user:', {
        clerk_user_id: req.auth.userId,
        email,
        username,
        firstName,
        lastName
      });

      // Insert new user with all available fields
      const result = await client.query(
        `INSERT INTO users (
          clerk_user_id,
          email,
          username,
          first_name,
          last_name,
          role,
          is_whitelisted
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, email, role`,
        [
          req.auth.userId,
          email,
          username || email.split('@')[0], // Fallback username if not provided
          firstName || '',
          lastName || '',
          'employee', // Default role
          false // Default whitelist status
        ]
      );

      console.log('New user inserted:', result.rows[0]);
      await client.query('COMMIT');
    } else {
      console.log('User already exists:', rows[0]);
    }

    next();
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in checkAndInsertUser middleware:', error);
    
    if (error.constraint === 'users_email_unique') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

module.exports = checkAndInsertUser;