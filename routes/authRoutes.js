const express = require('express');
const User = require('../models/User');
const csrf = require('csurf');
const { isAuthenticated } = require('../middleware/authMiddleware');
const router = express.Router();

// Setup CSRF protection middleware
const csrfProtection = csrf({ cookie: true });

router.get('/register', csrfProtection, (req, res) => {
  res.render('register', { csrfToken: req.csrfToken() });
});

router.post('/register', csrfProtection, async (req, res) => {
  try {
    const { username, password, businessName, name, phoneNumber, email, streetAddress, city, state, zipCode } = req.body;
    const newUser = new User({
      username,
      password,
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
});

router.get('/login', csrfProtection, (req, res) => {
  res.render('login', { csrfToken: req.csrfToken() });
});

router.post('/login', csrfProtection, async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      console.warn(`User not found: ${username}`);
      return res.status(401).send('Invalid username or password');
    }

    user.comparePassword(password, (err, isMatch) => {
      if (err) {
        console.error('Error comparing password:', err);
        return res.status(500).send('An error occurred during login');
      }

      if (!isMatch) {
        console.warn(`Invalid password for user: ${username}`);
        return res.status(401).send('Invalid username or password');
      }

      req.session.userId = user._id;
      res.redirect('/');
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send('An error occurred during login');
  }
});

router.get('/logout', isAuthenticated, (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error during session destruction:', err);
      return res.status(500).send('Error logging out');
    }
    res.redirect('/auth/login');
  });
});

module.exports = router;
