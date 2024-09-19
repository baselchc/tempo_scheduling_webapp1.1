const { users } = require('@clerk/clerk-sdk-node'); // Imports the 'users' module from the Clerk SDK
const db = require('./db'); // Imports the database connection and query functions

const checkAndInsertUser = async (req, res, next) => {
  const { userId } = req.auth; // Extract the userId from the authenticated request object

  if (!userId) {
    // If there's no userId in the request (user is not authenticated), will return a 401 Unauthorized error
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Check if the user already exists in the database
    const result = await db.query('SELECT 1 FROM users WHERE clerk_user_id = $1', [userId]);

    if (result.rowCount === 0) {
      // If the user does not exist, fetch user details from Clerk
      const clerkUser = await users.getUser(userId);

      // Extract necessary fields from the Clerk user object
      const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(); // Combines first and last names
      const email = clerkUser.emailAddresses[0]?.emailAddress; // Gets the primary email address
      const role = 'employee'; // Assigns a default role or derive from Clerk metadata

      // Inserts the new user into the database
      await db.query(
        'INSERT INTO users (clerk_user_id, name, email, role) VALUES ($1, $2, $3, $4)',
        [userId, name, email, role]
      );

      console.log('New user inserted:', userId); // Logs the insertion of a new user
    }

    // Proceeds to the next middleware or route handler
    next();
  } catch (error) {
    // If an error occurs, log it and send a 500 Internal Server Error response
    console.error('Error in checkAndInsertUser middleware:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = checkAndInsertUser; // Export the middleware function for use in other parts of the application

