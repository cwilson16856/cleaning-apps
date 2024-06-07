const express = require('express');
const User = require('../models/User');
const csrf = require('csurf');
const bcrypt = require('bcryptjs');
const { isAuthenticated } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Setup CSRF protection middleware
const csrfProtection = csrf({ cookie: true });

// Registration Route - GET
router.get('/register', csrfProtection, (req, res) => {
  res.render('register', { pageTitle: 'Register', csrfToken: req.csrfToken() });
});

// Registration Route - POST
router.post('/register', 
  csrfProtection,
  // Validate and sanitize input fields
  [
    body('username').isLength({ min: 3 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).trim().escape(),
    body('businessName').optional().trim().escape(),
    body('name').optional().trim().escape(),
    body('phoneNumber').optional().trim().escape(),
    body('streetAddress').optional().trim().escape(),
    body('city').optional().trim().escape(),
    body('state').optional().trim().escape(),
    body('zipCode').optional().trim().escape()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('register', { 
        pageTitle: 'Register', 
        csrfToken: req.csrfToken(),
        errors: errors.array()
      });
    }

    try {
      const { username, password, businessName, name, phoneNumber, email, streetAddress, city, state, zipCode } = req.body;

      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const newUser = new User({
        username,
        password: hashedPassword,
        businessName,
        name,
        phoneNumber,
        email,
        streetAddress,
        city,
        state,
        zipCode
      });
      
      await newUser.save();
      res.redirect('/auth/login');
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).send('Error registering new user.');
    }
  }
);

// Login Route - GET
router.get('/login', csrfProtection, (req, res) => {
  res.render('login', { pageTitle: 'Login', csrfToken: req.csrfToken() });
});

// Login Route - POST
router.post('/login', 
  csrfProtection,
  [
    body('username').trim().escape(),
    body('password').trim().escape()
  ],
  async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await User.findOne({ username });

      if (!user) {
        console.warn(`User not found: ${username}`);
        return res.status(401).send('Invalid username or password');
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.warn(`Invalid password for user: ${username}`);
        return res.status(401).send('Invalid username or password');
      }

      req.session.userId = user._id;
      res.redirect('/');
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).send('An error occurred during login');
    }
  }
);

// Logout Route - GET
router.get('/logout', isAuthenticated, (req, res) => {
  if (!req.session) {
    return res.redirect('/auth/login');
  }

  req.session.destroy(err => {
    if (err) {
      console.error('Error during session destruction:', err);
      return res.status(500).send('Error logging out');
    }
    res.clearCookie('connect.sid');
    res.redirect('/auth/login');
  });
});

module.exports = router;
