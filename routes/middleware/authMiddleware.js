const isAuthenticated = (req, res, next) => {
  // Check if session exists and if it contains the userId
  if (req.session && req.session.userId) {
    console.log(`User authenticated: ${req.session.userId}`); // Logging for debug purposes
    return next(); // User is authenticated, proceed to the next middleware/route handler
  } else {
    console.warn('User not authenticated'); // Log a warning for unauthenticated access attempts
    return res.status(401).json({ error: 'You are not authenticated' }); // Send a JSON response with a meaningful error message
  }
};

module.exports = {
  isAuthenticated
};
