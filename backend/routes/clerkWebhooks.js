const express = require('express');
const router = express.Router();
const { Webhook, WebhookVerificationError } = require('svix'); 
const db = require('../database/db'); 

// Define a POST route to handle incoming Clerk webhooks.
// Use raw body parsing for this route to ensure the payload is in the correct format.
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log('Received webhook request');
  console.log('Headers:', JSON.stringify(req.headers, null, 2)); // Log the headers for debugging.

  // Retrieve the Clerk Webhook secret from environment variables.
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  console.log('Webhook Secret:', webhookSecret ? `${webhookSecret.substring(0, 5)}...` : 'NOT SET');

  // If the webhook secret is not set, return a server error response.
  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Extract the raw payload and necessary headers for webhook verification.
  const payload = req.body;
  const headers = {
    "svix-id": req.header("svix-id"),
    "svix-timestamp": req.header("svix-timestamp"),
    "svix-signature": req.header("svix-signature"),
  };

  console.log('Payload:', payload.toString()); // Log the raw payload as a string.
  console.log('Svix Headers:', JSON.stringify(headers, null, 2)); // Log Svix-specific headers for debugging.

  // Create a new instance of the Svix Webhook class with the secret key.
  const wh = new Webhook(webhookSecret);

  try {
    // Verify the webhook payload and headers using the secret key.
    const evt = wh.verify(payload, headers);
    console.log('Webhook verified successfully');
    console.log('Event type:', evt.type); // Log the type of event received.
    console.log('Event data:', JSON.stringify(evt.data, null, 2)); // Log the event data for debugging.

    // Handle different event types based on the incoming webhook.
    switch (evt.type) {
      case 'user.created':
        await handleUserCreated(evt.data); // Call the function to handle user creation.
        break;
      case 'user.updated':
        await handleUserUpdated(evt.data); // Call the function to handle user updates.
        break;
      case 'user.deleted':
        await handleUserDeleted(evt.data); // Call the function to handle user deletion.
        break;
      default:
        console.log(`Unhandled event type: ${evt.type}`); // Log unhandled event types for future reference.
    }

    // Respond with a success message if the webhook was processed correctly.
    res.json({ received: true });
  } catch (err) {
    // If the error is due to webhook verification, return a 400 status code.
    if (err instanceof WebhookVerificationError) {
      console.error('Webhook verification failed:', err.message);
      return res.status(400).json({ error: 'Webhook verification failed' });
    }
    // For all other errors, log the error and return a 500 status code.
    console.error('Error processing webhook:', err);
    res.status(500).json({ error: 'Error processing webhook' });
  }
});

// Function to handle 'user.created' event.
// Inserts a new user into the database or updates the user's information if they already exist.
async function handleUserCreated(data) {
  const { id, email_addresses, username, first_name, last_name } = data; // Destructure the event data.
  const email = email_addresses.find(e => e.id === data.primary_email_address_id)?.email_address; // Extract the primary email address.

  const query = `
    INSERT INTO users (clerk_user_id, email, username, first_name, last_name)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (clerk_user_id) DO UPDATE
    SET email = $2, username = $3, first_name = $4, last_name = $5
  `;

  try {
    // Execute the query to insert or update the user based on the event data.
    await db.query(query, [id, email, username, first_name, last_name]);
    console.log('User created or updated:', id); // Log success message with user ID.
  } catch (error) {
    console.error('Error inserting/updating user in database:', error); // Log error if the query fails.
    throw error; // Throw the error to be caught by the calling function.
  }
}

// Function to handle 'user.updated' event.
// Calls handleUserCreated since the same logic is used for updating user data.
async function handleUserUpdated(data) {
  await handleUserCreated(data); // Delegate to handleUserCreated to avoid redundant code.
}

// Function to handle 'user.deleted' event.
// Deletes a user from the database based on the Clerk user ID.
async function handleUserDeleted(data) {
  try {
    // Execute the query to delete the user with the specified Clerk user ID.
    const result = await db.query('DELETE FROM users WHERE clerk_user_id = $1', [data.id]);
    console.log('User deleted:', data.id, 'Rows affected:', result.rowCount); // Log success message with affected rows.
  } catch (error) {
    console.error('Error deleting user from database:', error); // Log error if the query fails.
    throw error; // Throw the error to be caught by the calling function.
  }
}

// Export the router so it can be used in other parts of the application.
module.exports = router;
