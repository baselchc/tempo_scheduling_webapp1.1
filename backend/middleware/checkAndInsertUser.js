const { supabase } = require('../database/supabaseClient'); // Ensure path is correct

// Middleware to check if a user exists in the database and insert if not
const checkAndInsertUser = async (req, res, next) => {
  try {
    if (!req.auth || !req.auth.userId) {
      console.log('No authentication found in request');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('Checking user in database for Clerk userId:', req.auth.userId);

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', req.auth.userId)
      .single();

    if (fetchError) {
      console.error('Error fetching user from Supabase:', fetchError);
      return res.status(500).json({ error: 'Failed to check user existence' });
    }

    if (!user) {
      const { email, username } = req.auth; // Confirm fields are populated
      if (!email || !username) {
        console.warn('Email or username missing from Clerk auth data:', { email, username });
      }

      const { error: insertError } = await supabase
        .from('users')
        .insert({
          clerk_user_id: req.auth.userId,
          email,
          username,
        });

      if (insertError) {
        console.error('Error inserting new user in Supabase:', insertError);
        return res.status(500).json({ error: 'Failed to insert user' });
      }

      console.log('New user inserted:', req.auth.userId);
    } else {
      console.log('User already exists:', req.auth.userId);
    }

    next();
  } catch (error) {
    console.error('Unexpected error in checkAndInsertUser middleware:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = checkAndInsertUser;
