const express = require('express');
const router = express.Router();
const checkRole = require('../middleware/checkRole');
const multer = require('multer');
const { clerkClient, ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');
const db = require('../database/db');

if (!process.env.CLERK_SECRET_KEY) {
  console.error('CLERK_SECRET_KEY is not set in environment variables');
  process.exit(1);
}

// Initialize multer
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});

// GET route to fetch user profile
router.get('/profile', ClerkExpressWithAuth(), async (req, res) => {
  const userId = req.auth.userId;
  console.log('Fetching profile for user:', userId);

  try {
    const userQuery = 'SELECT first_name, last_name, email, phone, username, profile_image, role FROM users WHERE clerk_user_id = $1';
    let { rows } = await db.query(userQuery, [userId]);

    if (rows.length === 0) {
      try {
        console.log('User not found, attempting to create from Clerk data');
        const clerkUser = await clerkClient.users.getUser(userId);
        
        const email = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress;
        
        // First check if user exists with this email
        const emailCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
          // Update existing user with clerk_user_id
          const updateQuery = `
            UPDATE users 
            SET clerk_user_id = $1
            WHERE email = $2
            RETURNING *
          `;
          const updateResult = await db.query(updateQuery, [userId, email]);
          rows = updateResult.rows;
        } else {
          // Create new user
          const insertQuery = `
            INSERT INTO users (clerk_user_id, email, first_name, last_name, role)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (clerk_user_id) DO UPDATE
            SET email = EXCLUDED.email,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name
            RETURNING *
          `;

          const result = await db.query(insertQuery, [
            userId,
            email,
            clerkUser.firstName,
            clerkUser.lastName,
            'employee'
          ]);
          rows = result.rows;
        }
      } catch (createError) {
        console.error('Error creating/updating user:', createError);
        return res.status(500).json({ error: 'Failed to create or update user' });
      }
    }

    const userData = {
      firstName: rows[0].first_name,
      lastName: rows[0].last_name,
      email: rows[0].email,
      phone: rows[0].phone,
      username: rows[0].username,
      role: rows[0].role
    };

    if (rows[0].profile_image) {
      userData.profileImageUrl = `data:image/jpeg;base64,${rows[0].profile_image.toString('base64')}`;
    }

    res.json(userData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// PUT route to update user profile
router.put('/profile', ClerkExpressWithAuth(), upload.single('profileImage'), async (req, res) => {
  const userId = req.auth.userId;
  console.log('Updating profile for user:', userId, 'Request body:', req.body);

  try {
    // Start transaction
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // First check if user exists
      const checkUserQuery = 'SELECT id FROM users WHERE clerk_user_id = $1';
      const userResult = await client.query(checkUserQuery, [userId]);
      
      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'User not found' });
      }

      // Update user profile
      const updateQuery = `
        UPDATE users 
        SET first_name = $1,
            last_name = $2,
            email = $3,
            phone = $4,
            username = $5
        WHERE clerk_user_id = $6
        RETURNING *
      `;

      const updateValues = [
        req.body.firstName || null,
        req.body.lastName || null,
        req.body.email || null,
        req.body.phone || null,
        req.body.username || null,
        userId
      ];

      const updateResult = await client.query(updateQuery, updateValues);

      // Handle profile image if present
      if (req.file) {
        const imageQuery = `
          UPDATE users 
          SET profile_image = $1
          WHERE clerk_user_id = $2
        `;
        await client.query(imageQuery, [req.file.buffer, userId]);
      }

      await client.query('COMMIT');

      // Prepare response
      const responseData = {
        firstName: updateResult.rows[0].first_name,
        lastName: updateResult.rows[0].last_name,
        email: updateResult.rows[0].email,
        phone: updateResult.rows[0].phone,
        username: updateResult.rows[0].username,
        role: updateResult.rows[0].role
      };

      // Add profile image URL if it exists
      if (req.file) {
        responseData.profileImageUrl = `data:image/jpeg;base64,${req.file.buffer.toString('base64')}`;
      }

      console.log('Profile updated successfully');
      res.json({
        message: 'Profile updated successfully',
        user: responseData
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      details: error.message
    });
  }
});

// GET route to fetch user availability
router.get('/availability', ClerkExpressWithAuth(), async (req, res) => {
  const userId = req.auth.userId;
  console.log('Fetching availability for user:', userId);
  
  try {
    // Get the current week's start date (Monday)
    const currentDate = new Date();
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() - currentDate.getDay() + 1);
    monday.setHours(0, 0, 0, 0);

    // Get user database ID
    const userIdQuery = 'SELECT id FROM users WHERE clerk_user_id = $1';
    const userResult = await db.query(userIdQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      console.log('User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }
    
    const dbUserId = userResult.rows[0].id;

    console.log('Fetching availability for week starting:', monday);
    const availabilityQuery = `
      SELECT * FROM availability 
      WHERE user_id = $1
      AND week_start = $2
    `;
    const { rows } = await db.query(availabilityQuery, [dbUserId, monday]);
    console.log('Found availability records:', rows.length);
    
    // Transform the database record into the format expected by the frontend
    const availability = {};
    if (rows.length > 0) {
      const row = rows[0];
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
        availability[day.charAt(0).toUpperCase() + day.slice(1)] = {
          isAvailable: row[`${day}_start`] !== null,
          startTime: row[`${day}_start`] ? row[`${day}_start`].substring(0, 5) : "09:00",
          endTime: row[`${day}_end`] ? row[`${day}_end`].substring(0, 5) : "17:00"
        };
      });
    }
    
    console.log('Sending availability response:', availability);
    res.json({ availability });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// PUT route to update user availability
router.put('/availability', ClerkExpressWithAuth(), async (req, res) => {
  const userId = req.auth.userId;
  console.log('Received availability update request:', {
    userId,
    body: req.body
  });

  try {
    // Get the current week's start date (Monday)
    const currentDate = new Date();
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() - currentDate.getDay() + 1);
    monday.setHours(0, 0, 0, 0);

    console.log('Request body:', req.body);
    const { availability } = req.body;
    
    if (!availability) {
      console.error('No availability data in request');
      return res.status(400).json({ error: 'Missing availability data' });
    }

    await db.query('BEGIN');

    // Prepare the data for insertion/update
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const values = {};
    
    days.forEach(day => {
      if (availability[day]?.isAvailable) {
        values[`${day.toLowerCase()}_start`] = availability[day].startTime;
        values[`${day.toLowerCase()}_end`] = availability[day].endTime;
      } else {
        values[`${day.toLowerCase()}_start`] = null;
        values[`${day.toLowerCase()}_end`] = null;
      }
    });

    console.log('Processed availability values:', values);

    // Get user database ID
    const userIdQuery = 'SELECT id FROM users WHERE clerk_user_id = $1';
    const userResult = await db.query(userIdQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }
    
    const dbUserId = userResult.rows[0].id;

    // Upsert the availability record
    const query = `
      INSERT INTO availability (
        user_id,
        week_start,
        monday_start, monday_end,
        tuesday_start, tuesday_end,
        wednesday_start, wednesday_end,
        thursday_start, thursday_end,
        friday_start, friday_end
      )
      VALUES (
        $1, $2,
        $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      )
      ON CONFLICT (user_id, week_start) DO UPDATE
      SET
        monday_start = EXCLUDED.monday_start,
        monday_end = EXCLUDED.monday_end,
        tuesday_start = EXCLUDED.tuesday_start,
        tuesday_end = EXCLUDED.tuesday_end,
        wednesday_start = EXCLUDED.wednesday_start,
        wednesday_end = EXCLUDED.wednesday_end,
        thursday_start = EXCLUDED.thursday_start,
        thursday_end = EXCLUDED.thursday_end,
        friday_start = EXCLUDED.friday_start,
        friday_end = EXCLUDED.friday_end
      RETURNING *
    `;

    const params = [
      dbUserId,
      monday,
      values.monday_start, values.monday_end,
      values.tuesday_start, values.tuesday_end,
      values.wednesday_start, values.wednesday_end,
      values.thursday_start, values.thursday_end,
      values.friday_start, values.friday_end
    ];

    console.log('Executing query with params:', params);

    const result = await db.query(query, params);

    // Notify managers
    const userQuery = 'SELECT first_name, last_name FROM users WHERE clerk_user_id = $1';
    const { rows } = await db.query(userQuery, [userId]);
    const employeeName = `${rows[0].first_name} ${rows[0].last_name}`;

    const notificationQuery = `
      INSERT INTO notifications (user_id, message, type)
      SELECT id, $1, 'availability_update'
      FROM users
      WHERE role = 'manager'
    `;
    
    await db.query(notificationQuery, [
      `${employeeName} has updated their availability for the week of ${monday.toLocaleDateString()}`
    ]);

    await db.query('COMMIT');
    
    console.log('Successfully updated availability');
    res.json({ 
      message: 'Availability updated successfully',
      availability: result.rows[0]
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error updating availability:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// PUT route to update user role
router.put('/role', ClerkExpressWithAuth(), checkRole(['admin']), async (req, res) => {
  const { userId, newRole } = req.body;

  try {
    const updateResult = await db.query(
      'UPDATE users SET role = $1 WHERE clerk_user_id = $2 RETURNING *',
      [newRole, userId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Role updated successfully', user: updateResult.rows[0] });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

module.exports = router;