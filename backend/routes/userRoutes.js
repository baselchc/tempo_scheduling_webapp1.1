const express = require('express');
const router = express.Router();

// Import Clerk middleware for user authentication and database configuration.
const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');
const db = require('../database/db');

// Define a GET route to fetch the user's profile information.
// The Clerk middleware ensures the route is protected and only accessible to authenticated users.
router.get('/profile', ClerkExpressWithAuth(), async (req, res) => {
  const userId = req.auth.userId; // Retrieve the user ID from the Clerk authentication middleware.
  console.log('Fetching profile for user:', userId);
 
  try {
    // Query the 'users' table to get basic user profile information.
    const userQuery = 'SELECT first_name, last_name, email, phone, username FROM users WHERE clerk_user_id = $1';
    const { rows } = await db.query(userQuery, [userId]);

    // If no rows are returned, it means the user was not found in the database.
    if (rows.length === 0) {
      console.log('User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }

    // Query the 'availability' table to get the user's availability based on their user ID.
    const availabilityQuery = 'SELECT day_of_week, status FROM availability WHERE user_id = (SELECT id FROM users WHERE clerk_user_id = $1)';
    const availabilityResult = await db.query(availabilityQuery, [userId]);

    // Convert availability rows into a more structured format.
    const availability = {};
    availabilityResult.rows.forEach(row => {
      availability[row.day_of_week] = row.status; // Map each day of the week to its corresponding status.
    });

    // Combine basic user info and availability into a single user data object.
    const userData = {
      firstName: rows[0].first_name,
      lastName: rows[0].last_name,
      email: rows[0].email,
      phone: rows[0].phone,
      username: rows[0].username,
      availability // Add availability data to the user profile.
    };

    // Send the combined user data as a response in JSON format.
    res.json(userData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' }); // Return a 500 error if something goes wrong.
  }
});

// Define a PUT route to update the user's profile information.
router.put('/profile', ClerkExpressWithAuth(), async (req, res) => {
  // Extract profile fields and availability data from the request body.
  const { firstName, lastName, email, phone, username, availability } = req.body;
  const userId = req.auth.userId; // Retrieve the user ID from the Clerk authentication middleware.

  // Check if required fields are missing; if so, respond with a 400 status code.
  if (!firstName || !lastName || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Begin a database transaction to ensure all operations complete successfully or roll back if any fail.
    await db.query('BEGIN');

    // Update the user's profile information in the 'users' table.
    const updateQuery = `
      UPDATE users 
      SET first_name = $1, last_name = $2, email = $3, phone = $4, username = $5 
      WHERE clerk_user_id = $6
      RETURNING *
    `;
    const updateResult = await db.query(updateQuery, [firstName, lastName, email, phone, username, userId]);
    
    // If no rows are returned, it means the user was not found in the database.
    if (updateResult.rows.length === 0) {
      await db.query('ROLLBACK'); // Roll back the transaction if user is not found.
      return res.status(404).json({ error: 'User not found' });
    }

    // If availability data is provided, update or insert the availability records in the database.
    if (availability) {
      for (const [day, status] of Object.entries(availability)) {
        await db.query(
          'INSERT INTO availability (user_id, day_of_week, status) VALUES ((SELECT id FROM users WHERE clerk_user_id = $1), $2, $3) ON CONFLICT (user_id, day_of_week) DO UPDATE SET status = $3',
          [userId, day, status]
        );
      }
    }

    // Commit the transaction to finalize all changes.
    await db.query('COMMIT');
    res.json({ message: 'Profile updated successfully', user: updateResult.rows[0] }); // Return the updated user profile.
  } catch (error) {
    await db.query('ROLLBACK'); // Roll back the transaction if an error occurs.
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' }); // Return a 500 error if something goes wrong.
  }
});

// Export the router to use it in other parts of the application.
module.exports = router;
