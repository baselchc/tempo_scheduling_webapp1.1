// backend/middleware/checkRole.js


import { supabase } from '../database/supabaseClient';

const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Get the user ID from Clerk auth
      const userId = req.auth.userId;

      // Query Supabase to get user's role
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('clerk_user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!userData) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user's role is in the allowed roles array
      if (allowedRoles.includes(userData.role)) {
        next();
      } else {
        res.status(403).json({ 
          error: 'Access denied',
          message: 'Insufficient permissions'
        });
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        details: error.message
      });
    }
  };
};

module.exports = checkRole;