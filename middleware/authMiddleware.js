// middleware/authMiddleware.js
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  } else {
    res.redirect('/auth/login');
  }
};
