const express = require('express');
const router = express.Router();
const Quote = require('../models/quoteModel');
const Client = require('../models/clientModel');
const ServiceItem = require('../models/serviceItem');
const User = require('../models/User');
const { sendQuoteDataToCRM } = require('../utils/crmIntegration');
const csrf = require('csurf');
const { isAuthenticated } = require('../middleware/authMiddleware');
const quoteController = require('../controllers/quoteController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const winston = require('winston');

// Set up logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Ensure the uploads directory exists
const uploadsDirectory = 'uploads/';
if (!fs.existsSync(uploadsDirectory)) {
  fs.mkdirSync(uploadsDirectory);
}

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDirectory);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Initialize multer with storage configuration
const upload = multer({ storage: storage });

// Correct path for client routes
const clientRoutes = require('../routes/clientRoutes');
router.use('/clients', clientRoutes);

// Function to calculate the subtotal
const calculateSubtotal = (serviceItems) => {
  return serviceItems.reduce((sum, item) => sum + (item.customPrice || item.rate) * item.quantity, 0);
};

// CSRF Protection Middleware using csurf
const csrfProtection = csrf({ cookie: true });

// Function to process quote creation and updating
const processQuote = async (req, res) => {
  const { clientId, clientName, title, scopeOfWork, serviceType, frequency, initialCleaningOptions, serviceItems, userAddress, distance, taxRate } = req.body;

  // Validate service items
  if (!serviceItems || !Array.isArray(serviceItems) || serviceItems.length === 0) {
    return res.status(400).json({ error: 'Service items are required.' });
  }

  const processedServiceItems = serviceItems.map(item => ({
    serviceItemId: item.serviceItemId,
    description: item.description,
    quantity: item.quantity,
    customPrice: item.customPrice ? item.customPrice : item.rate
  }));

  const subtotal = calculateSubtotal(processedServiceItems);
  const calculatedTaxRate = parseFloat(taxRate) || 7.5;
  const total = subtotal + (subtotal * (calculatedTaxRate / 100));

  // Check and handle attachments
  const attachments = req.files && req.files['attachments'] ? req.files['attachments'].map(file => ({
    savedFilename: file.filename,
    originalFilename: file.originalname
  })) : [];

  // Check and handle contracts
  const contracts = req.files && req.files['contracts'] ? req.files['contracts'].map(file => ({
    savedFilename: file.filename,
    originalFilename: file.originalname
  })) : [];

  return new Quote({
    clientId,
    clientName,
    title,
    scopeOfWork,
    serviceType,
    frequency,
    initialCleaningOptions,
    serviceItems: processedServiceItems,
    userAddress,
    distance,
    subtotal,
    taxRate: calculatedTaxRate,
    total,
    attachments,
    contracts,
  });
};

// GET route for retrieving and rendering all quotes
router.get('/', isAuthenticated, csrfProtection, async (req, res) => {
  try {
    const quotes = await Quote.find().populate('clientId');
    logger.info(`Rendering quotes.ejs with quotes data, count: ${quotes.length}`);
    res.render('quotes', { pageTitle: 'Quotes', quotes, csrfToken: req.csrfToken(), currentPath: req.path });
  } catch (error) {
    logger.error(`Error retrieving quotes: ${error.message}`, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Route to render the form to create a new quote
router.get('/new', isAuthenticated, csrfProtection, async (req, res) => {
  try {
    const clients = await Client.find();
    const serviceItems = await ServiceItem.find();
    const userId = req.session.userId;
    const user = await User.findById(userId);
    res.render('createQuote', { pageTitle: 'Create New Quote', clients, serviceItems, user, csrfToken: req.csrfToken(), currentPath: req.path });
  } catch (error) {
    logger.error(`Error fetching data for quote creation: ${error.message}`, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// GET route to render the form to edit an existing quote
router.get('/:id/edit', isAuthenticated, csrfProtection, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).populate('clientId').populate('serviceItems.serviceItemId');
    if (!quote) {
      logger.info(`Quote not found with ID: ${req.params.id}`);
      return res.status(404).json({ error: 'Quote not found' });
    }
    const clients = await Client.find();
    const serviceItems = await ServiceItem.find();
    const userId = req.session.userId;
    const user = await User.findById(userId);
    res.render('editQuote', { pageTitle: 'Edit Quote', quote, clients, serviceItems, user, csrfToken: req.csrfToken(), currentPath: req.path });
  } catch (error) {
    logger.error(`Error fetching data for quote editing: ${error.message}`, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// POST route for creating a new quote with CSRF protection
router.post('/', isAuthenticated, upload.fields([{ name: 'attachments' }, { name: 'contracts' }]), csrfProtection, async (req, res) => {
  logger.info('Request body:', req.body);
  logger.info('Uploaded files:', req.files);

  try {
    const newQuote = await processQuote(req, res);
    await newQuote.save();
    logger.info('Quote saved successfully:', newQuote);
    res.status(201).json(newQuote);
  } catch (error) {
    logger.error(`Error creating new quote: ${error.message}`, error.stack);
    res.status(400).json({ error: `Failed to create quote. ${error.message}` });
  }
});

// GET route for retrieving a single quote by ID
router.get('/:id', isAuthenticated, csrfProtection, async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
      .populate('clientId')
      .populate({ path: 'serviceItems.serviceItemId', model: 'ServiceItem' });
    if (!quote) {
      logger.info(`Quote not found with ID: ${req.params.id}`);
      return res.status(404).json({ error: 'Quote not found' });
    }
    logger.info(`Retrieved quote with ID: ${req.params.id}`);
    if (req.accepts('html')) {
      res.render('quoteDetails', { pageTitle: 'Quote Details', quote, csrfToken: req.csrfToken(), currentPath: req.path });
    } else {
      res.status(200).json({ quote, csrfToken: req.csrfToken() });
    }
  } catch (error) {
    logger.error(`Error retrieving quote with ID ${req.params.id}: ${error.message}`, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// PUT route for updating a quote by its ID with CSRF protection
router.put('/:id', isAuthenticated, upload.fields([{ name: 'attachments' }, { name: 'contracts' }]), csrfProtection, async (req, res) => {
  logger.info('Request body:', req.body);
  logger.info('Uploaded files:', req.files);

  try {
    const updatedQuote = await processQuote(req, res);
    updatedQuote._id = req.params.id; // Set the ID to match the existing quote

    await Quote.findByIdAndUpdate(req.params.id, updatedQuote);
    logger.info('Quote updated successfully:', updatedQuote);
    res.status(200).json(updatedQuote);
  } catch (error) {
    logger.error(`Error updating quote: ${error.message}`, error.stack);
    res.status(400).json({ error: `Failed to update quote. ${error.message}` });
  }
});

// DELETE route for removing a quote with CSRF protection
router.delete('/:id', isAuthenticated, csrfProtection, async (req, res) => {
  try {
    const deletedQuote = await Quote.findByIdAndDelete(req.params.id);
    if (!deletedQuote) {
      logger.info(`Quote not found for deletion with ID: ${req.params.id}`);
      return res.status(404).json({ error: 'Quote not found' });
    }
    logger.info(`Deleted quote with ID: ${req.params.id}`);
    res.status(204).send();
  } catch (error) {
    logger.error(`Error deleting quote with ID ${req.params.id}: ${error.message}`, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// POST route to calculate distance
router.post('/calculate-distance', isAuthenticated, csrfProtection, quoteController.calculateDistance);

module.exports = router;
