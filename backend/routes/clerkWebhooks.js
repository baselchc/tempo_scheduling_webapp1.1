const express = require('express');
const router = express.Router();
const { Webhook, WebhookVerificationError } = require('svix');
const { supabase } = require('../database/supabaseClient');

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log('Received webhook request');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));

  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const payload = req.body; // Should be a Buffer
  const headers = {
    "svix-id": req.header("svix-id"),
    "svix-timestamp": req.header("svix-timestamp"),
    "svix-signature": req.header("svix-signature"),
  };

  const wh = new Webhook(webhookSecret);

  try {
    const evt = wh.verify(payload, headers);
    console.log('Webhook verified successfully');
    console.log('Event type:', evt.type);
    console.log('Event data:', JSON.stringify(evt.data, null, 2));

    switch (evt.type) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;
      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;
      default:
        console.log(`Unhandled event type: ${evt.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      console.error('Webhook verification failed:', err.message);
      return res.status(400).json({ error: 'Webhook verification failed' });
    }
    console.error('Error processing webhook:', err);
    res.status(500).json({ error: 'Error processing webhook' });
  }
});

// Function to handle 'user.created' event.
async function handleUserCreated(data) {
  const { id, email_addresses, username, first_name, last_name } = data;
  const email = email_addresses.find(e => e.id === data.primary_email_address_id)?.email_address;

  console.log("Inserting user data into Supabase:", { id, email, username, first_name, last_name });

  try {
    const { error } = await supabase
      .from('users')
      .upsert({
        clerk_user_id: id,
        email,
        username,
        first_name,
        last_name,
      }, { onConflict: 'clerk_user_id' });

    if (error) {
      console.error("Error inserting/updating user in Supabase:", error);
    } else {
      console.log("User successfully inserted or updated in Supabase:", id);
    }
  } catch (error) {
    console.error("Error in handleUserCreated function:", error);
  }
}

// Function to handle 'user.updated' event.
async function handleUserUpdated(data) {
  await handleUserCreated(data); // Reuse the same logic for updates
}

// Function to handle 'user.deleted' event.
async function handleUserDeleted(data) {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('clerk_user_id', data.id);

    if (error) {
      console.error('Error deleting user from Supabase:', error);
      throw error;
    }

    console.log('User deleted:', data.id);
  } catch (error) {
    console.error('Error deleting user from Supabase:', error);
    throw error;
  }
}

module.exports = router;

 {/*Code enhanced by AI (ChatGPT 4o) Prompts were: Create a consistent look of the page with the login page, 
  add the blurred background and adjust they layout to match the same feel of the login page, this page should handle the open shifts
  tab and allow a view of Available Shifts and Open Shifts.*/}