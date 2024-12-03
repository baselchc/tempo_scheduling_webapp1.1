// backend/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');
import { supabaseServer } from '../../lib/supabase-server';

// GET route to fetch user profile
router.get('/profile', ClerkExpressWithAuth(), async (req, res) => {
  const userId = req.auth.userId;
  
  try {
    const { data: user, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (error) throw error;

    if (!user) {
      // Get Clerk user data
      const clerkUser = await clerkClient.users.getUser(userId);
      const email = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress;
      
      // Check if user exists with this email
      const { data: existingUser } = await supabaseServer
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (existingUser) {
        // Update existing user with clerk_user_id
        const { data: updatedUser, error: updateError } = await supabaseServer
          .from('users')
          .update({
            clerk_user_id: userId,
            first_name: clerkUser.firstName,
            last_name: clerkUser.lastName
          })
          .eq('email', email)
          .select()
          .single();

        if (updateError) throw updateError;
        return res.json(updatedUser);
      }

      // Create new user
      const { data: newUser, error: insertError } = await supabaseServer
        .from('users')
        .insert({
          clerk_user_id: userId,
          email: email,
          first_name: clerkUser.firstName,
          last_name: clerkUser.lastName,
          role: 'employee'
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return res.json(newUser);
    }

    res.json(user);
  } catch (error) {
    console.error('Error in profile route:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT route to update user profile
router.put('/profile', ClerkExpressWithAuth(), async (req, res) => {
  const userId = req.auth.userId;
  const { firstName, lastName, email, phone, username } = req.body;

  try {
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        username: username,
        updated_at: new Date()
      })
      .eq('clerk_user_id', userId)
      .select()
      .single();

    if (userError) throw userError;
    
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET route to fetch user availability
router.get('/availability', ClerkExpressWithAuth(), async (req, res) => {
  const userId = req.auth.userId;

  try {
    const { data: userData } = await supabaseServer
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (!userData) throw new Error('User not found');

    const monday = new Date();
    monday.setDate(monday.getDate() - monday.getDay() + 1);
    monday.setHours(0, 0, 0, 0);

    const { data: availability, error } = await supabaseServer
      .from('availability')
      .select('*')
      .eq('user_id', userData.id)
      .eq('week_start', monday.toISOString())
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    const defaultAvailability = {
      Monday: { morning: false, afternoon: false },
      Tuesday: { morning: false, afternoon: false },
      Wednesday: { morning: false, afternoon: false },
      Thursday: { morning: false, afternoon: false },
      Friday: { morning: false, afternoon: false }
    };

    if (!availability) {
      return res.json({ availability: defaultAvailability });
    }

    const formattedAvailability = {
      Monday: { 
        morning: availability.monday_morning,
        afternoon: availability.monday_afternoon 
      },
      Tuesday: { 
        morning: availability.tuesday_morning,
        afternoon: availability.tuesday_afternoon 
      },
      Wednesday: { 
        morning: availability.wednesday_morning,
        afternoon: availability.wednesday_afternoon 
      },
      Thursday: { 
        morning: availability.thursday_morning,
        afternoon: availability.thursday_afternoon 
      },
      Friday: { 
        morning: availability.friday_morning,
        afternoon: availability.friday_afternoon 
      }
    };

    res.json({ availability: formattedAvailability });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT route to update user availability
router.put('/availability', ClerkExpressWithAuth(), async (req, res) => {
  const userId = req.auth.userId;
  const { availability } = req.body;

  try {
    const { data: userData } = await supabaseServer
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (!userData) throw new Error('User not found');

    const monday = new Date();
    monday.setDate(monday.getDate() - monday.getDay() + 1);
    monday.setHours(0, 0, 0, 0);

    const { data: updatedAvailability, error } = await supabaseServer
      .from('availability')
      .upsert({
        user_id: userData.id,
        week_start: monday.toISOString(),
        monday_morning: availability.Monday?.morning || false,
        monday_afternoon: availability.Monday?.afternoon || false,
        tuesday_morning: availability.Tuesday?.morning || false,
        tuesday_afternoon: availability.Tuesday?.afternoon || false,
        wednesday_morning: availability.Wednesday?.morning || false,
        wednesday_afternoon: availability.Wednesday?.afternoon || false,
        thursday_morning: availability.Thursday?.morning || false,
        thursday_afternoon: availability.Thursday?.afternoon || false,
        friday_morning: availability.Friday?.morning || false,
        friday_afternoon: availability.Friday?.afternoon || false,
        updated_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;

    // Create notification for managers
    const { data: managers } = await supabaseServer
      .from('users')
      .select('id')
      .eq('role', 'manager');

    if (managers) {
      await supabaseServer
        .from('notifications')
        .insert(managers.map(manager => ({
          to_user_id: manager.id,
          from_user_id: userData.id,
          message: `${userData.first_name} ${userData.last_name} has updated their availability`,
          type: 'availability_update'
        })));
    }

    res.json({ 
      message: 'Availability updated successfully',
      availability: updatedAvailability 
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;