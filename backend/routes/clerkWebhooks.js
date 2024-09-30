const express = require('express');
const router = express.Router();
const { Webhook, WebhookVerificationError } = require('svix');
const db = require('../database/db');

router.post('/', express.raw({type: 'application/json'}), async (req, res) => {
  console.log('Received webhook request');
  console.log('Request headers:', req.headers);
 
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  console.log('Webhook secret:', secret ? `${secret.substr(0, 3)}...${secret.substr(-3)}` : 'Secret is not set');
 
  if (!secret) {
    console.error('CLERK_WEBHOOK_SECRET is not set in the environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Get the headers
  const svix_id = req.headers['svix-id'];
  const svix_timestamp = req.headers['svix-timestamp'];
  const svix_signature = req.headers['svix-signature'];

  console.log('Svix headers:', { svix_id, svix_timestamp, svix_signature });

  // If there are missing headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Error: Missing required Svix headers');
    return res.status(400).json({ error: 'Missing required headers' });
  }

  // Get the body
  const payload = req.body;
  console.log('Raw payload:', payload.toString());
  const body = payload; // Express.raw() already gives us a Buffer

  const webhook = new Webhook(secret);
 
  try {
    const verifiedPayload = webhook.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature
    });
   
    console.log('Verified webhook payload:', verifiedPayload);

    if (verifiedPayload.type === 'user.created') {
      const { id, email_addresses, username, first_name, last_name } = verifiedPayload.data;
     
      const primaryEmail = email_addresses.find(email => email.id === verifiedPayload.data.primary_email_address_id).email_address;
      const query = `
        INSERT INTO users (clerk_user_id, email, username, first_name, last_name)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (clerk_user_id) DO UPDATE
        SET email = $2, username = $3, first_name = $4, last_name = $5
      `;
      const values = [id, primaryEmail, username, first_name, last_name];
      try {
        await db.query(query, values);
        console.log('User inserted/updated in database:', id);
      } catch (dbError) {
        console.error('Error inserting/updating user in database:', dbError);
      }
    }
    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      console.error('Webhook verification failed:', err.message);
      console.error('Error details:', err);
      return res.status(400).json({ error: 'Webhook verification failed' });
    }
    console.error('Error processing webhook:', err);
    res.status(400).json({ message: 'Error processing webhook' });
  }
});

module.exports = router;