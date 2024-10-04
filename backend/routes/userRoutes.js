const express = require('express');
const router = express.Router();
const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');
const db = require('../database/db');

// Middleware to check if user is an admin
const isAdmin = (req, res, next) => {
  // This is a placeholder. Implement your own admin check logic
  if (req.auth.sessionClaims.admin === true) {
    next();
  } else {
    res.status(403).json({ error: 'Unauthorized. Admin access required.' });
  }
};

// Delete user route (protected, admin only)
router.delete('/:userId', ClerkExpressWithAuth(), isAdmin, async (req, res) => {
  const { userId } = req.params;

  try {
    // Delete user from your database
    await db.query('DELETE FROM users WHERE clerk_id = $1', [userId]);

    // Delete user from Clerk
    await req.auth.users.deleteUser(userId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;