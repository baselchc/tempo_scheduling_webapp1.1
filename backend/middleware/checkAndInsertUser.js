// backend/middleware/checkAndInsertUser.js

import { supabase } from '../database/supabaseClient';

const checkAndInsertUser = async (req, res, next) => {
  try {
    if (!req.auth || !req.auth.userId) {
      console.log('No authentication found in request');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Checking user in database for Clerk userId:', req.auth.userId);

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', req.auth.userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw fetchError;
    }

    if (!existingUser) {
      const { email_addresses, username, firstName, lastName } = req.auth;
      const email = email_addresses?.[0]?.email_address;

      if (!email) {
        console.warn('Email missing from Clerk auth data');
        return res.status(400).json({ error: 'Email is required' });
      }

      console.log('Creating new user:', {
        clerk_user_id: req.auth.userId,
        email,
        username,
        firstName,
        lastName
      });

      // Check if email already exists
      const { data: emailCheck } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (emailCheck) {
        return res.status(409).json({ error: 'Email already exists' });
      }

      // Insert new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          clerk_user_id: req.auth.userId,
          email: email,
          username: username || email.split('@')[0],
          first_name: firstName || '',
          last_name: lastName || '',
          role: 'employee',
          is_whitelisted: false
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      console.log('New user inserted:', newUser);
    } else {
      console.log('User already exists:', existingUser);
    }

    next();
  } catch (error) {
    console.error('Error in checkAndInsertUser middleware:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};

module.exports = checkAndInsertUser;