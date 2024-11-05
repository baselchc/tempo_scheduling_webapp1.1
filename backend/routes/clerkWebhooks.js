const express = require('express');
const router = express.Router();
const { Webhook } = require('svix');
const db = require('../database/db');

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    console.log('Received webhook request');
   
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('CLERK_WEBHOOK_SECRET is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    const payloadString = req.body.toString();
   
    // Get the Svix headers for verification
    const svixId = req.header("svix-id");
    const svixTimestamp = req.header("svix-timestamp");
    const svixSignature = req.header("svix-signature");
   
    if (!svixId || !svixTimestamp || !svixSignature) {
      console.log('Missing headers:', { svixId, svixTimestamp, svixSignature });
      return res.status(400).json({ error: 'Missing svix headers' });
    }
    // Create Webhook instance with your secret
    const wh = new Webhook(webhookSecret);
   
    let evt;
    try {
      // Verify the payload
      wh.verify(payloadString, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature
      });
     
      // Parse the payload after verification
      evt = JSON.parse(payloadString);
    } catch (err) {
      console.error('Webhook verification or parsing failed:', err);
      return res.status(400).json({ error: 'Webhook verification failed' });
    }
    const eventType = evt.type;
    const eventData = evt.data;
   
    console.log('Event type:', eventType);
    console.log('Event data:', JSON.stringify(eventData, null, 2));
    // Add more detailed logging for user deletion
    if (eventType === 'user.deleted') {
      console.log('Processing user deletion. User ID:', eventData.id);
    }
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(eventData);
        break;
      case 'user.updated':
        await handleUserUpdated(eventData);
        break;
      case 'user.deleted':
        await handleUserDeleted(eventData);
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    res.status(500).json({ error: 'Error processing webhook' });
  }
});

// Update the handleUserDeleted function for better error handling and logging
async function handleUserDeleted(data) {
  console.log('Starting user deletion process for:', data.id);
  const client = await db.pool.connect();
 
  try {
    await client.query('BEGIN');
   
    // First check if user exists
    const checkResult = await client.query(
      'SELECT id FROM users WHERE clerk_user_id = $1',
      [data.id]
    );
   
    if (checkResult.rows.length === 0) {
      console.log('User not found in database:', data.id);
      await client.query('COMMIT');
      return;
    }
    // Proceed with deletion
    const result = await client.query(
      'DELETE FROM users WHERE clerk_user_id = $1 RETURNING id',
      [data.id]
    );
    await client.query('COMMIT');
   
    console.log('User deletion successful:', {
      clerkUserId: data.id,
      dbUserId: result.rows[0]?.id,
      rowsAffected: result.rowCount
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting user:', {
      clerkUserId: data.id,
      error: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    client.release();
  }
}

module.exports = router;