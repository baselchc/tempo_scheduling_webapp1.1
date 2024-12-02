// backend/routes/userRoutes.js

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

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const userQuery = 'SELECT first_name, last_name, email, phone, username, profile_image, role FROM users WHERE clerk_user_id = $1';
    let { rows } = await client.query(userQuery, [userId]);

    if (rows.length === 0) {
      console.log('User not found, attempting to create from Clerk data');
      const clerkUser = await clerkClient.users.getUser(userId);
      
      const email = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress;
      
      // First check if user exists with this email
      const emailCheck = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      if (emailCheck.rows.length > 0) {
        // Update existing user with clerk_user_id
        const updateQuery = `
          UPDATE users 
          SET clerk_user_id = $1,
              first_name = COALESCE($2, first_name),
              last_name = COALESCE($3, last_name)
          WHERE email = $4
          RETURNING *
        `;
        const updateResult = await client.query(updateQuery, [
          userId,
          clerkUser.firstName,
          clerkUser.lastName,
          email
        ]);
        rows = updateResult.rows;
      } else {
        // Create new user
        const insertQuery = `
          INSERT INTO users (clerk_user_id, email, first_name, last_name, role)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;
        const result = await client.query(insertQuery, [
          userId,
          email,
          clerkUser.firstName,
          clerkUser.lastName,
          'employee'
        ]);
        rows = result.rows;
      }
      await client.query('COMMIT');
    }

    const userData = {
      firstName: rows[0].first_name || '',
      lastName: rows[0].last_name || '',
      email: rows[0].email || '',
      phone: rows[0].phone || '',
      username: rows[0].username || '',
      role: rows[0].role || 'employee'
    };

    if (rows[0].profile_image) {
      userData.profileImageUrl = `data:image/jpeg;base64,${rows[0].profile_image.toString('base64')}`;
    }

    console.log('Successfully fetched/created user profile:', userData);
    res.json(userData);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fetching/creating user profile:', error);
    res.status(500).json({ error: 'Failed to fetch or create user profile' });
  } finally {
    client.release();
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
  
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Get current start of week
    const currentDate = new Date();
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() - currentDate.getDay() + 1);
    monday.setHours(0, 0, 0, 0);

    // Get user database ID
    const userIdQuery = 'SELECT id FROM users WHERE clerk_user_id = $1';
    const userResult = await client.query(userIdQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const dbUserId = userResult.rows[0].id;
    
    // Get most recent availability
    const availabilityQuery = `
      SELECT * FROM availability 
      WHERE user_id = $1
      ORDER BY week_start DESC
      LIMIT 1
    `;
    
    const { rows } = await client.query(availabilityQuery, [dbUserId]);
    
    const availability = {};
    if (rows.length > 0) {
      const row = rows[0];
      ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach(day => {
        const dayLower = day.toLowerCase();
        availability[day] = {
          morning: row[`${dayLower}_morning`] || false,
          afternoon: row[`${dayLower}_afternoon`] || false
        };
      });
    } else {
      // Initialize empty availability if none exists
      ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].forEach(day => {
        availability[day] = {
          morning: false,
          afternoon: false
        };
      });
    }

    await client.query('COMMIT');    
    res.json({ availability });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  } finally {
    client.release();
  }
});

// PUT route to update user availability
router.put('/availability', ClerkExpressWithAuth(), async (req, res) => {
  const userId = req.auth.userId;
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');

    const currentDate = new Date();
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() - currentDate.getDay() + 1);
    monday.setHours(0, 0, 0, 0);

    const { availability } = req.body;
    if (!availability) {
      throw new Error('Missing availability data');
    }

    // Get user database ID
    const userResult = await client.query(
      'SELECT id, first_name, last_name FROM users WHERE clerk_user_id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const dbUserId = userResult.rows[0].id;
    const employeeName = `${userResult.rows[0].first_name} ${userResult.rows[0].last_name}`;

    // Prepare the data for insertion/update
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const values = {};
    
    days.forEach(day => {
      const dayLower = day.toLowerCase();
      values[`${dayLower}_morning`] = availability[day]?.morning || false;
      values[`${dayLower}_afternoon`] = availability[day]?.afternoon || false;
    });

    // Upsert availability
    const insertQuery = `
      INSERT INTO availability (
        user_id, week_start,
        monday_morning, monday_afternoon,
        tuesday_morning, tuesday_afternoon,
        wednesday_morning, wednesday_afternoon,
        thursday_morning, thursday_afternoon,
        friday_morning, friday_afternoon
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (user_id, week_start) DO UPDATE SET
        monday_morning = EXCLUDED.monday_morning,
        monday_afternoon = EXCLUDED.monday_afternoon,
        tuesday_morning = EXCLUDED.tuesday_morning,
        tuesday_afternoon = EXCLUDED.tuesday_afternoon,
        wednesday_morning = EXCLUDED.wednesday_morning,
        wednesday_afternoon = EXCLUDED.wednesday_afternoon,
        thursday_morning = EXCLUDED.thursday_morning,
        thursday_afternoon = EXCLUDED.thursday_afternoon,
        friday_morning = EXCLUDED.friday_morning,
        friday_afternoon = EXCLUDED.friday_afternoon,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      dbUserId,
      monday,
      values.monday_morning, values.monday_afternoon,
      values.tuesday_morning, values.tuesday_afternoon,
      values.wednesday_morning, values.wednesday_afternoon,
      values.thursday_morning, values.thursday_afternoon,
      values.friday_morning, values.friday_afternoon
    ]);

    // Notify managers
    await client.query(
      `INSERT INTO notifications (user_id, message, type)
       SELECT id, $1, 'availability_update'
       FROM users WHERE role = 'manager'`,
      [`${employeeName} has updated their availability for the week of ${monday.toLocaleDateString()}`]
    );

    await client.query('COMMIT');
    
    res.json({ 
      message: 'Availability updated successfully',
      availability: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating availability:', error);
    res.status(500).json({ 
      error: 'Failed to update availability',
      details: error.message
    });
  } finally {
    client.release();
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