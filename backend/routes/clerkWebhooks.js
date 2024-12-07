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
      // Get raw body and verify signature
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
        const { id, email_addresses, first_name, last_name } = payload.data;
        const email = email_addresses[0]?.email_address;

        console.log('Creating new user:', {
          clerk_user_id: id,
          email,
          first_name,
          last_name
        });

        const { data: newUser, error: createError } = await supabaseServer
          .from('users')
          .upsert({
            clerk_user_id: id,
            email: email,
            first_name: first_name,
            last_name: last_name,
            role: 'employee'  // Default role as employee
          }, {
            onConflict: 'clerk_user_id',
            returning: 'minimal'
          });

        if (createError) {
          console.error('Error creating user in Supabase:', createError);
          throw createError;
        }

        console.log('User created successfully');
      }

      // Handle user deletion
      if (payload.type === 'user.deleted') {
        console.log('Attempting to delete user with clerk_user_id:', payload.data.id);

        // Get user info before deletion for logging
        const { data: userData, error: fetchError } = await supabaseServer
          .from('users')
          .select('id, first_name, last_name')
          .eq('clerk_user_id', payload.data.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching user before deletion:', fetchError);
          throw fetchError;
        }

        if (userData) {
          console.log(`Found user to delete: ${userData.first_name} ${userData.last_name} (ID: ${userData.id})`);

          // Delete user (Supabase cascade rules will handle related records)
          const { error: deleteError } = await supabaseServer
            .from('users')
            .delete()
            .eq('clerk_user_id', payload.data.id);

          if (deleteError) {
            console.error('Error deleting user:', deleteError);
            throw deleteError;
          }

          console.log('Successfully deleted user and related records');
        } else {
          console.log(`No user found in database for clerk_user_id: ${payload.data.id}`);
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
