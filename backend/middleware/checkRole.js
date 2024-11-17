const db = require('../database/db');

const checkRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Get the user ID from Clerk auth
      const userId = req.auth.userId;

      // Query database to get user's role
      const { rows } = await db.query(
        'SELECT role FROM users WHERE clerk_user_id = $1', 
        [userId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userRole = rows[0].role;
      
      // Check if user's role is in the allowed roles array
      if (allowedRoles.includes(userRole)) {
        next();
      } else {
        res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
      }

    } catch (error) {
      console.error('Error checking user role:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

module.exports = checkRole;