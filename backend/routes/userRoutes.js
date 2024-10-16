const express = require('express');
const router = express.Router();
const multer = require('multer');
const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');
const db = require('../database/db');
const checkRole = require('../middleware/checkRole');

const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
});

// GET route to fetch user profile
router.get('/profile', ClerkExpressWithAuth(), async (req, res) => {
  const userId = req.auth.userId;
  console.log('Fetching profile for user:', userId);
 
  try {
    const userQuery = 'SELECT first_name, last_name, email, phone, username, profile_image, role FROM users WHERE clerk_user_id = $1';
    const { rows } = await db.query(userQuery, [userId]);
    if (rows.length === 0) {
      console.log('User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }

    // const availabilityQuery = 'SELECT day_of_week, status FROM availability WHERE user_id = (SELECT id FROM users WHERE clerk_user_id = $1)';
    // const availabilityResult = await db.query(availabilityQuery, [userId]);

    // const availability = {};
    // availabilityResult.rows.forEach(row => {
    //   availability[row.day_of_week] = row.status;
    // });

    const userData = {
      firstName: rows[0].first_name,
      lastName: rows[0].last_name,
      email: rows[0].email,
      phone: rows[0].phone,
      username: rows[0].username,
      role: rows[0].role
      // availability
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
  const { firstName, lastName, email, phone, username } = req.body;
  const userId = req.auth.userId;

  // console.log('Received availability data:', req.body.availability);

  if (!firstName || !lastName || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await db.query('BEGIN');

    let imageData = null;
    if (req.file) {
      imageData = req.file.buffer;
    }

    const updateQuery = `
      UPDATE users
      SET first_name = $1, last_name = $2, email = $3, phone = $4, username = $5, profile_image = COALESCE($6, profile_image)
      WHERE clerk_user_id = $7
      RETURNING *
    `;
    const updateResult = await db.query(updateQuery, [firstName, lastName, email, phone, username, imageData, userId]);

    if (updateResult.rows.length === 0) {
      await db.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    // if (availability) {
    //   const parsedAvailability = typeof availability === 'string' ? JSON.parse(availability) : availability;

    //   for (const day of VALID_DAYS) {
    //     const status = parsedAvailability[day];
    //     if (!status || !VALID_STATUSES.includes(status)) {
    //       await db.query('ROLLBACK');
    //       return res.status(400).json({ error: `Invalid availability data for day: ${day}` });
    //     }

    //     await db.query(
    //       'INSERT INTO availability (user_id, day_of_week, status) VALUES ((SELECT id FROM users WHERE clerk_user_id = $1), $2, $3) ON CONFLICT (user_id, day_of_week) DO UPDATE SET status = $3',
    //       [userId, day, status]
    //     );
    //   }
    // }

    await db.query('COMMIT');

    const updatedUser = updateResult.rows[0];
    const responseData = {
      message: 'Profile updated successfully',
      user: {
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        username: updatedUser.username,
      }
    };

    if (updatedUser.profile_image) {
      responseData.user.profileImageUrl = `data:image/jpeg;base64,${updatedUser.profile_image.toString('base64')}`;
    }
    
    res.json({ message: 'Profile updated successfully', user: updateResult.rows[0] });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT route to update user role
router.put('/role', ClerkExpressWithAuth(), checkRole(['admin']),async (req, res) => {
  const { userId, newRole } = req.body;

  try {
    // Update the user's role
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