const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const csrf = require('csurf');
const isAuthenticated = require('../middleware/authMiddleware').isAuthenticated;
const User = require('../models/User');
const logger = require('../logger');

// Setup CSRF protection middleware
const csrfProtection = csrf({ cookie: true });

// POST route to handle password change
router.post('/change-password', isAuthenticated, csrfProtection, async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  const userId = req.session.userId;

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ success: false, message: 'New passwords do not match.' });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    logger.info(`Password updated successfully for userId: ${userId}`, {
      method: "POST",
      path: "/settings/change-password",
      sessionId: req.sessionID,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    logger.error(`Error updating password: ${error.message}`, {
      error: error,
      method: "POST",
      path: "/settings/change-password",
      sessionId: req.sessionID,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ success: false, message: 'Error updating password.', error: error.message });
  }
});

module.exports = router;

// Setup multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB max file size
  },
  fileFilter: fileFilter
});

// GET settings page with authentication and CSRF protection
router.get('/', isAuthenticated, csrfProtection, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    res.render('settings', {
      title: 'Settings',
      csrfToken: req.csrfToken(),
      user: user // Pass the user object to the template
    });
  } catch (error) {
    logger.error(`Error fetching user information: ${error.message}`, {
      error: error,
      method: "GET",
      path: "/settings",
      sessionId: req.sessionID,
      timestamp: new Date().toISOString()
    });
    res.status(500).send('Error fetching user information.');
  }
});

// POST route to handle form submission from the 'User Information' tab with CSRF protection
router.post('/', isAuthenticated, csrfProtection, upload.single('businessLogo'), async (req, res) => {
  const { businessName, name, phoneNumber, email, streetAddress, city, state, zipCode, websiteURL, socialMediaLinks } = req.body;
  let hoursOfOperation = {};
  ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
    hoursOfOperation[day] = {
      from: req.body[`${day}From`],
      to: req.body[`${day}To`]
    };
  });
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    user.businessName = businessName;
    if (req.file) {
      user.businessLogo = req.file.path; // Save file path if file was uploaded
    }
    user.name = name;
    user.phoneNumber = phoneNumber;
    user.email = email;
    user.streetAddress = streetAddress;
    user.city = city;
    user.state = state;
    user.zipCode = zipCode;
    user.hoursOfOperation = hoursOfOperation;
    user.websiteURL = websiteURL;
    user.socialMediaLinks = socialMediaLinks;

    await user.save();

    logger.info(`User information updated successfully for userId: ${userId}`, {
      method: "POST",
      path: "/settings",
      sessionId: req.sessionID,
      timestamp: new Date().toISOString()
    });

    // Send a JSON response to indicate success
    res.json({ success: true, message: 'User information updated successfully.', csrfToken: req.csrfToken() });
  } catch (error) {
    logger.error(`Error saving user information: ${error}`, {
      error: error,
      method: "POST",
      path: "/settings",
      sessionId: req.sessionID,
      timestamp: new Date().toISOString()
    });

    // Send a JSON response to indicate failure
    res.status(500).json({ success: false, message: 'Error saving user information.', error: error.message });
  }
});

module.exports = router;
