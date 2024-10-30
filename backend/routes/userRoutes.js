const express = require('express');
const router = express.Router();
const multer = require('multer');
const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');
const { supabase } = require('../database/supabaseClient');

// Configure multer for file upload
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
});

// GET route to fetch user profile
router.get('/profile', ClerkExpressWithAuth(), async (req, res) => {
  const userId = req.auth.userId;
  console.log('Fetching profile for user:', userId);

  try {
    // Fetch user profile from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('first_name, last_name, email, phone, username, profile_image, role')
      .eq('clerk_user_id', userId)
      .single();

    if (error || !user) {
      console.error('User not found or error fetching user:', error);
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate public URL for profile image if it exists
    let profileImageUrl = null;
    if (user.profile_image) {
      const { data: publicUrlData, error: urlError } = supabase.storage
        .from('avatars')
        .getPublicUrl(`public/${userId}.jpg`);

      if (urlError) {
        console.error("Error fetching public URL for image:", urlError);
      } else {
        profileImageUrl = publicUrlData.publicUrl;
      }
    }

    // Construct the user data response
    const userData = {
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone,
      username: user.username,
      role: user.role,
      profileImageUrl: profileImageUrl,
    };

    res.json(userData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// PUT route to update user profile
router.put('/profile', ClerkExpressWithAuth(), upload.single('profileImage'), async (req, res) => {
  const { firstName, lastName, email, phone, username } = req.body;
  const userId = req.auth.userId;

  console.log("Request to update profile for user:", userId);
  console.log("Received data:", { firstName, lastName, email, phone, username });

  if (!firstName || !lastName || !email) {
    console.error("Missing required fields in profile update.");
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    let profileImageUrl = null;

    // Upload the profile image to Supabase Storage if present
    if (req.file) {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`public/${userId}.jpg`, req.file.buffer, {
          cacheControl: '3600',
          upsert: true,
          contentType: req.file.mimetype,
        });

      if (uploadError) {
        console.error('Error uploading image to Supabase Storage:', uploadError);
        return res.status(500).json({ error: 'Failed to upload profile image' });
      }

      // Generate public URL for the uploaded profile image
      const { data: publicUrlData, error: urlError } = supabase.storage
        .from('avatars')
        .getPublicUrl(`public/${userId}.jpg`);

      if (urlError) {
        console.error("Error fetching public URL for image:", urlError);
      } else {
        profileImageUrl = publicUrlData.publicUrl;
      }
    }

    // Update the user's profile information in Supabase
    const { data, error } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        username,
        profile_image: profileImageUrl ? Buffer.from(profileImageUrl) : null,
      })
      .eq('clerk_user_id', userId)
      .select('*')
      .single();

    if (error || !data) {
      console.error("User not found or failed to update:", error);
      return res.status(404).json({ error: 'User not found or failed to update' });
    }

    const responseData = {
      message: 'Profile updated successfully',
      user: {
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone,
        username: data.username,
        profileImageUrl: profileImageUrl,
      },
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// PUT route to update user role
router.put('/role', ClerkExpressWithAuth(), async (req, res) => {
  const { userId, newRole } = req.body;

  try {
    // Update the user's role in Supabase
    const { data, error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('clerk_user_id', userId)
      .single();

    if (error || !data) {
      console.error('Error updating user role:', error);
      return res.status(404).json({ error: 'User not found or failed to update role' });
    }

    res.json({ message: 'Role updated successfully', user: data });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

module.exports = router;
