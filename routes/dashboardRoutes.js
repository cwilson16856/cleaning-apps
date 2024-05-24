const express = require('express');
const router = express.Router();
const Quote = require('../models/quoteModel');

// GET route for rendering the dashboard
router.get('/', async (req, res) => {
  try {
    const quotes = await Quote.find().populate('clientId');
    console.log('Fetched all quotes successfully.');
    res.render('dashboard', { quotes });
  } catch (error) {
    console.error(`Error rendering dashboard: ${error.message}`, error.stack);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
