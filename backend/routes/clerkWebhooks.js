const express = require('express');
const router = express.Router();
const { Webhook, WebhookVerificationError } = require('svix');
const db = require('../database/db');

// Handle POST requests to this route
router.post('/', express.raw({type: 'application/json'}), async (req, res) => {
  console.log('Received webhook request');
  console.log('Request headers:', req.headers);
 
  // Get the webhook secret from environment variables
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  // Log a masked version of the secret for debugging (never log the full secret)
  console.log('Webhook secret:', secret ? `${secret.substr(0, 3)}...${secret.substr(-3)}` : 'Secret is not set');
 
  // Ensure the webhook secret is set
  if (!secret) {
    console.error('CLERK_WEBHOOK_SECRET is not set in the environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Extract Svix headers
  const svix_id = req.headers['svix-id'];
  const svix_timestamp = req.headers['svix-timestamp'];
  const svix_signature = req.headers['svix-signature'];
  console.log('Svix headers:', { svix_id, svix_timestamp, svix_signature });

  // Verify all required headers are present
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Error: Missing required Svix headers');
    return res.status(400).json({ error: 'Missing required headers' });
  }

  // Get the raw body of the request
  const payload = req.body;
  console.log('Raw payload:', payload.toString());
  const body = payload; // Express.raw() already gives us a Buffer

  // Create a new Webhook instance for verification
  const webhook = new Webhook(secret);
 
  try {
    // Verify the webhook payload
    const verifiedPayload = webhook.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature
    });
   
    console.log('Verified webhook payload:', verifiedPayload);

    // Handle different event types
    switch (verifiedPayload.type) {
      case 'user.created':
        await handleUserCreated(verifiedPayload.data);
        break;
      case 'user.updated':
        await handleUserUpdated(verifiedPayload.data);
        break;
      case 'user.deleted':
        await handleUserDeleted(verifiedPayload.data);
        break;
      default:
        console.log(`Unhandled event type: ${verifiedPayload.type}`);
    }

    // Respond with success
    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (err) {
    // Handle webhook verification errors
    if (err instanceof WebhookVerificationError) {
      console.error('Webhook verification failed:', err.message);
      console.error('Error details:', err);
      return res.status(400).json({ error: 'Webhook verification failed' });
    }
    // Handle other errors
    console.error('Error processing webhook:', err);
    res.status(400).json({ message: 'Error processing webhook' });
  }
});

async function handleUserCreated(userData) {
  const { id, email_addresses, username, first_name, last_name } = userData;
  
  // Find the primary email address
  const primaryEmail = email_addresses.find(email => email.id === userData.primary_email_address_id).email_address;

  // SQL query to insert or update user data
  const query = `
    INSERT INTO users (clerk_user_id, email, username, first_name, last_name)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (clerk_user_id) DO UPDATE
    SET email = $2, username = $3, first_name = $4, last_name = $5
  `;
  const values = [id, primaryEmail, username, first_name, last_name];

  try {
    // Execute the database query
    await db.query(query, values);
    console.log('User inserted/updated in database:', id);
  } catch (dbError) {
    console.error('Error inserting/updating user in database:', dbError);
  }
}

async function handleUserUpdated(userData) {
  // Implement user update logic here
  console.log('User updated:', userData.id);
}

async function handleUserDeleted(userData) {
  try {
    await db.query('DELETE FROM users WHERE clerk_user_id = $1', [userData.id]);
    console.log('User deleted:', userData.id);
  } catch (error) {
    console.error('Error handling user deletion:', error);
  }
}

module.exports = router;