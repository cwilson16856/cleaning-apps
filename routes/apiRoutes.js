const express = require('express');
const router = express.Router();
const { getAllServiceItems } = require('../controllers/serviceItemController');
const { isAuthenticated } = require('../middleware/authMiddleware'); // Assuming this is your auth middleware

// Get all service items
router.get('/service-items', isAuthenticated, getAllServiceItems);

module.exports = router;