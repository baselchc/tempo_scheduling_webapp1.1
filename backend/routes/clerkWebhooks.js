// backend/routes/clerkWebhooks.js
const express = require('express');
const router = express.Router();
const { Webhook } = require('svix');
const db = require('../database/db');

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('CLERK_WEBHOOK_SECRET is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Get headers
    const svixId = req.header("svix-id");
    const svixTimestamp = req.header("svix-timestamp");
    const svixSignature = req.header("svix-signature");

    console.log('Webhook Headers:', {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature
    });

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('Missing required Svix headers');
      return res.status(400).json({ error: 'Missing required headers' });
    }

    // Initialize Webhook instance with secret
    const wh = new Webhook(webhookSecret);

    try {
      // Get raw body
      const rawBody = req.body;
      const payloadString = rawBody.toString('utf8');
      console.log('Raw Webhook Payload:', payloadString);

      // Verify the webhook signature
      const evt = wh.verify(payloadString, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature
      });

      // Parse the payload after verification
      const payload = JSON.parse(payloadString);
      console.log('Parsed Event:', payload);

      // Handle user creation
      if (payload.type === 'user.created') {
        const client = await db.pool.connect();
        try {
          await client.query('BEGIN');
          
          const { id, email_addresses, first_name, last_name } = payload.data;
          const email = email_addresses[0]?.email_address;

          console.log('Creating new user:', {
            clerk_user_id: id,
            email,
            first_name,
            last_name
          });

          const result = await client.query(
            `INSERT INTO users (clerk_user_id, email, first_name, last_name, role)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (clerk_user_id) DO NOTHING
             RETURNING id`,
            [id, email, first_name, last_name, 'employee']  // Default role as employee
          );

          if (result.rows.length > 0) {
            console.log(`User created successfully with ID: ${result.rows[0].id}`);
          } else {
            console.log('User already exists, skipping creation');
          }

          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          console.error('Error creating user in database:', error);
          throw error;
        } finally {
          client.release();
        }
      }

      // Handle user deletion
      if (payload.type === 'user.deleted') {
        const client = await db.pool.connect();
        try {
          await client.query('BEGIN');

          console.log('Attempting to delete user with clerk_user_id:', payload.data.id);

          // Get user info before deletion for logging
          const userQuery = await client.query(
            'SELECT id, first_name, last_name FROM users WHERE clerk_user_id = $1',
            [payload.data.id]
          );

          if (userQuery.rows.length > 0) {
            const userData = userQuery.rows[0];
            console.log(`Found user to delete: ${userData.first_name} ${userData.last_name} (ID: ${userData.id})`);

            // Delete user (CASCADE will handle related records)
            const deleteResult = await client.query(
              'DELETE FROM users WHERE clerk_user_id = $1 RETURNING id',
              [payload.data.id]
            );

            console.log(`Successfully deleted user and related records. Rows affected:`, deleteResult.rowCount);
            await client.query('COMMIT');
          } else {
            console.log(`No user found in database for clerk_user_id: ${payload.data.id}`);
            await client.query('ROLLBACK');
          }
        } catch (error) {
          await client.query('ROLLBACK');
          console.error('Database error during user deletion:', error);
          throw error;
        } finally {
          client.release();
        }
      }

      res.json({ 
        success: true, 
        event: payload.type,
        message: `Successfully processed ${payload.type} event`
      });
    } catch (err) {
      console.error('Webhook verification or parsing failed:', err);
      return res.status(400).json({
        error: 'Webhook verification failed',
        details: err.message,
        stack: err.stack
      });
    }
  } catch (err) {
    console.error('Error processing webhook:', err);
    res.status(500).json({ 
      error: 'Internal server error',
      details: err.message,
      stack: err.stack
    });
  }
});

module.exports = router;