const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const csrfProtection = require('../middleware/csrfProtection');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const logger = require('../logger'); // Assuming you have a logger.js setup
const router = express.Router();

// Setup rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: 'Too many login attempts, please try again later'
});

router.get('/register', csrfProtection, (req, res) => {
  res.render('register', { csrfToken: req.csrfToken() });
});

router.post('/register', csrfProtection, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    const schema = Joi.object({
      username: Joi.string().min(3).required(),
      password: Joi.string().min(8).required()
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).send(error.details[0].message);
    }

    await User.create({ username, password });
    res.redirect('/auth/login');
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).send('An error occurred during registration');
  }
});

router.get('/login', csrfProtection, (req, res) => {
  res.render('login', { csrfToken: req.csrfToken() });
});

router.post('/login', loginLimiter, csrfProtection, async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      logger.warn(`User not found: ${username}`);
      return res.status(401).send('Invalid username or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      logger.warn(`Invalid password for user: ${username}`);
      return res.status(401).send('Invalid username or password');
    }

    req.session.userId = user._id;
    res.redirect('/');
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).send('An error occurred during login');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      logger.error('Error during session destruction:', err);
      return res.status(500).send('Error logging out');
    }
    res.redirect('/auth/login');
  });
});

module.exports = router;
