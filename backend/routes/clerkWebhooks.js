// backend / routes / clerkWebhooks.js

import express  from 'express';
import { Router } from 'express';
import { Webhook } from 'svix';
import { supabase} from '../database/supabaseClient.js';

const router = Router();

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

        const { data: newUser, error: createError } = await supabase
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
        const { data: userData, error: fetchError } = await supabase
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
          const { error: deleteError } = await supabase
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
    console.error('Error processing webhook:', err);
    res.status(500).json({ 
      error: 'Internal server error',
      details: err.message,
      stack: err.stack
    });
  }
});

export default router;
