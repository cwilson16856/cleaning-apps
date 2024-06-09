const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const csrf = require('csurf');
const bcrypt = require('bcrypt');
const isAuthenticated = require('../middleware/authMiddleware').isAuthenticated;
const User = require('../models/User');
const logger = require('../logger');

// Setup CSRF protection middleware
const csrfProtection = csrf({ cookie: true });

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

// Fetch user helper function
async function fetchUserById(req, res, next) {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    logger.error(`Error fetching user information: ${error.message}`, {
      method: req.method,
      path: req.originalUrl,
      sessionId: req.sessionID,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ success: false, message: 'Error fetching user information.', error: error.message });
  }
}

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
      return res.status(404).json({ success: false, message: 'User not found' });
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

// GET user information route
router.get('/user-info', isAuthenticated, async (req, res) => {
  console.log('GET /settings/user-info route hit');
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);

    if (!user) {
      console.log('User not found');
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.log(`Error fetching user information: ${error.message}`);
    logger.error(`Error fetching user information: ${error.message}`, {
      error: error,
      method: "GET",
      path: "/settings/user-info",
      sessionId: req.sessionID,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ success: false, message: 'Error fetching user information.', error: error.message });
  }
});

// GET settings page with authentication and CSRF protection
router.get('/', isAuthenticated, csrfProtection, fetchUserById, (req, res) => {
  res.render('settings', {
    pageTitle: 'Settings',
    csrfToken: req.csrfToken(),
    user: req.user // Pass the user object to the template
  });
});

router.post('/', isAuthenticated, csrfProtection, (req, res, next) => {
  upload.single('businessLogo')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, async (req, res) => {
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
      return res.status(404).json({ success: false, message: 'User not found.' });
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

    res.json({ success: true, message: 'User information updated successfully.' });
  } catch (error) {
    logger.error(`Error saving user information: ${error}`, {
      error: error,
      method: "POST",
      path: "/settings",
      sessionId: req.sessionID,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      message: 'Error saving user information.',
      error: error.message
    });
  }
});

module.exports = router;