const express = require('express');
const router = express.Router();
const db = require('./db');
const { Webhook } = require('@clerk/clerk-sdk-node');
require('dotenv').config();


// Sets the Clerk webhook secret key 
const CLERK_WEBHOOK_SECRET = 'clerk webhook will go here';

// Uses express.raw() middleware to parse the raw body for 'application/json' content type
router.post('/clerk-webhooks', express.raw({ type: 'application/json' }), async (req, res) => {
  // Accesses the raw request body payload
  const payload = req.body;
  // Retrieves the 'clerk-signature' header from the request for webhook verification
  const signature = req.headers['clerk-signature'];

  let event;

  try {
    // Verifys the webhook payload using Clerk's Webhook.verify method
    // This ensures the request is genuinely from Clerk and hasn't been tampered with
    event = Webhook.verify(payload, signature, CLERK_WEBHOOK_SECRET);

    // Destructures the 'type' of event and the associated 'data' from the verified event object
    const { type, data } = event;

    // Handles different types of webhook events
    if (type === 'user.updated') {
      // Event when a user's information is updated in Clerk

      // Extracts the Clerk user ID from the event data
      const clerkUserId = data.id;
      // Constructs the user's full name by combining first and last names, handling possible undefined values
      const name = `${data.first_name || ''} ${data.last_name || ''}`.trim();
      // Gets the user's primary email address from the event data
      const email = data.email_addresses[0]?.email_address;

      // Updates the user's name and email in the database based on their Clerk user ID
      await db.query(
        'UPDATE users SET name = $1, email = $2 WHERE clerk_user_id = $3',
        [name, email, clerkUserId]
      );

      // Logs a message indicating that the user was updated successfully
      console.log('User updated:', clerkUserId);
    } else if (type === 'user.deleted') {
      // Events when a user is deleted from Clerk

      // Extracts the Clerk user ID from the event data
      const clerkUserId = data.id;

      // Deletes the user from the database using their Clerk user ID
      await db.query('DELETE FROM users WHERE clerk_user_id = $1', [clerkUserId]);

      // Logs a message indicating that the user was deleted successfully
      console.log('User deleted:', clerkUserId);
    }

    // Responds with a 200 OK status to acknowledge receipt of the webhook
    res.status(200).send('Webhook received');
  } catch (error) {
    // If an error occurs, logs the error
    console.error('Error handling webhook:', error);
    // Responds with a 400 Bad Request status to indicate a problem with processing the webhook
    res.status(400).send('Webhook Error');
  }
});

// Export the router so it can be used in other parts of the application
module.exports = router;

