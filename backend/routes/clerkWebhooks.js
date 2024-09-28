const express = require('express');
const { Webhook } = require('svix');
const bodyParser = require('body-parser');
const db = require('../database/db');

const router = express.Router();
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  throw new Error('Please add WEBHOOK_SECRET from Clerk Dashboard to .env');
}

router.use(bodyParser.json());

// Webhook routes to handle Clerk events
router.post('/clerk-webhooks', async (req, res) => {
  console.log('Received webhook request');
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);

  const svix = new Webhook(WEBHOOK_SECRET);
  
  try {
    const payload = JSON.stringify(req.body);
    const headers = {
      'svix-id': req.headers['svix-id'],
      'svix-timestamp': req.headers['svix-timestamp'],
      'svix-signature': req.headers['svix-signature'],
    };
    
    console.log('Payload:', payload);
    console.log('Headers:', headers);

    const event = svix.verify(payload, headers);
    console.log(`Received verified event of type: ${event.type}`);

    switch (event.type) {
      case 'user.created':
        await handleUserCreated(event.data);
        break;
      case 'user.updated':
        await handleUserUpdated(event.data);
        break;
      case 'user.deleted':
        await handleUserDeleted(event.data);
        break;
      case 'session.created':
        await handleSessionCreated(event.data);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (err) {
    console.error('Error processing webhook:', err.message);
    res.status(400).json({ error: 'Webhook processing failed', details: err.message });
  }
});

async function handleUserCreated(userData) {
  try {
    const { id, email_addresses, username, first_name, last_name } = userData;
    const email = email_addresses[0]?.email_address;

    await db.query(
      'INSERT INTO users (clerk_id, email, username, first_name, last_name) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (clerk_id) DO NOTHING',
      [id, email, username, first_name, last_name]
    );
    console.log('User created:', id);
  } catch (error) {
    console.error('Error handling user creation:', error);
  }
}

async function handleUserUpdated(userData) {
  try {
    const { id, email_addresses, username, first_name, last_name } = userData;
    const email = email_addresses[0]?.email_address;

    await db.query(
      'UPDATE users SET email = $2, username = $3, first_name = $4, last_name = $5 WHERE clerk_id = $1',
      [id, email, username, first_name, last_name]
    );
    console.log('User updated:', id);
  } catch (error) {
    console.error('Error handling user update:', error);
  }
}

async function handleUserDeleted(userData) {
  try {
    await db.query('DELETE FROM users WHERE clerk_id = $1', [userData.id]);
    console.log('User deleted:', userData.id);
  } catch (error) {
    console.error('Error handling user deletion:', error);
  }
}

async function handleSessionCreated(sessionData) {
  try {
    console.log('New session created:', sessionData.id);
    // Adds any specific logic you want to perform when a new session is created
  } catch (error) {
    console.error('Error handling session creation:', error);
  }
}

module.exports = router;