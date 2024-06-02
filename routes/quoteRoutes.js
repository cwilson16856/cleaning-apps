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

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Specify the directory to save files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Append extension
  }
});

// Initialize multer with storage configuration
const upload = multer({ storage: storage });

// Function to calculate the subtotal
const calculateSubtotal = (serviceItems) => {
  return serviceItems.reduce((sum, item) => sum + (item.customPrice || item.rate) * item.quantity, 0);
};

// CSRF Protection Middleware using csurf
const csrfProtection = csrf({ cookie: true });

// GET route for retrieving and rendering all quotes
router.get('/', isAuthenticated, csrfProtection, async (req, res) => {
  try {
    const quotes = await Quote.find().populate('clientId');
    console.log(`Rendering quotes.ejs with quotes data, count: ${quotes.length}`);
    res.render('quotes', { quotes, csrfToken: req.csrfToken() });
  } catch (error) {
    console.error(`Error retrieving quotes: ${error.message}`, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Route to render the form to create a new quote
router.get('/new', isAuthenticated, csrfProtection, async (req, res) => {
  try {
    const clients = await Client.find(); // Fetch all clients to populate the dropdown
    const serviceItems = await ServiceItem.find(); // Fetch all service items to populate the dropdown
    const userId = req.session.userId;
    const user = await User.findById(userId);
    res.render('createQuote', { clients, serviceItems, user, csrfToken: req.csrfToken() }); // Pass clients, serviceItems, and user to the view for dropdown population
  } catch (error) {
    console.error(`Error fetching data for quote creation: ${error.message}`, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// POST route for creating a new quote with CSRF protection
router.post('/', isAuthenticated, upload.fields([{ name: 'attachments' }, { name: 'contracts' }]), csrfProtection, async (req, res) => {
  console.log('Request body:', req.body);
  console.log('Uploaded files:', req.files); // Log uploaded files for debugging
  try {
    const { clientId, clientName, title, scopeOfWork, serviceType, frequency, initialCleaningOptions, serviceItems, userAddress, distance, taxRate } = req.body;

    // Validate service items
    if (!serviceItems || !Array.isArray(serviceItems) || serviceItems.length === 0) {
      return res.status(400).json({ error: 'Service items are required.' });
    }

    console.log('Processing service items:', serviceItems);

    const processedServiceItems = serviceItems.map(item => ({
      serviceItemId: item.serviceItemId,
      description: item.description,
      quantity: item.quantity,
      customPrice: item.customPrice ? item.customPrice : item.rate
    }));

    const subtotal = calculateSubtotal(processedServiceItems);
    const calculatedTaxRate = parseFloat(taxRate) || 7.5;
    const total = subtotal + (subtotal * (calculatedTaxRate / 100));

    const attachments = (req.files['attachments'] || []).map(file => ({
      savedFilename: file.filename,
      originalFilename: file.originalname
    }));

    const contracts = (req.files['contracts'] || []).map(file => ({
      savedFilename: file.filename,
      originalFilename: file.originalname
    }));

    const newQuote = new Quote({
      clientId,
      clientName, // Ensure clientName is included here
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

    console.log('New quote object:', newQuote);

    await newQuote.save();
    console.log('Quote saved successfully:', newQuote);
    res.status(201).json(newQuote);
  } catch (error) {
    console.error(`Error creating new quote: ${error.message}`, error.stack);
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
      console.log(`Quote not found with ID: ${req.params.id}`);
      return res.status(404).json({ error: 'Quote not found' });
    }
    console.log(`Retrieved quote with ID: ${req.params.id}`);
    if (req.accepts('html')) {
      res.render('quoteDetails', { quote, csrfToken: req.csrfToken() });
    } else {
      res.status(200).json(quote);
    }
  } catch (error) {
    console.error(`Error retrieving quote with ID ${req.params.id}: ${error.message}`, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// PUT route for updating a quote by its ID with CSRF protection
router.put('/:id', isAuthenticated, csrfProtection, async (req, res) => {
  try {
    const { serviceType, frequency, initialCleaningOptions, serviceItems, ...updateData } = req.body;
    // Validate serviceItems
    if (!serviceItems || !Array.isArray(serviceItems)) {
      throw new Error("Invalid serviceItems data provided.");
    }

    const processedServiceItems = serviceItems.map(item => ({
      serviceItemId: item.serviceItemId,
      quantity: item.quantity,
      customPrice: item.customPrice ? item.customPrice : undefined
    }));

    const subtotal = calculateSubtotal(processedServiceItems);
    const calculatedTaxRate = parseFloat(updateData.taxRate) || 7.5;
    const total = subtotal + (subtotal * (calculatedTaxRate / 100));

    const updatedQuote = await Quote.findByIdAndUpdate(req.params.id, {
      serviceType,
      frequency,
      initialCleaningOptions,
      serviceItems: processedServiceItems,
      subtotal,
      taxRate: calculatedTaxRate,
      total,
      ...updateData
    }, { new: true, runValidators: true }).populate({ path: 'serviceItems.serviceItemId', model: 'ServiceItem' });

    if (!updatedQuote) {
      console.log(`Quote not found for updating with ID: ${req.params.id}`);
      return res.status(404).json({ error: 'Quote not found' });
    }
    console.log(`Updated quote with ID: ${req.params.id}`);
    await sendQuoteDataToCRM(updatedQuote.toObject()).catch(err => {
      console.error(`CRM Integration Error: ${err.message}`, err.stack);
    });

    res.status(200).json(updatedQuote);
  } catch (error) {
    console.error(`Error updating quote with ID ${req.params.id}: ${error.message}`, error.stack);
    res.status(400).json({ error: "Failed to update quote. " + error.message });
  }
});

// DELETE route for removing a quote with CSRF protection
router.delete('/:id', isAuthenticated, csrfProtection, async (req, res) => {
  try {
    const deletedQuote = await Quote.findByIdAndDelete(req.params.id);
    if (!deletedQuote) {
      console.log(`Quote not found for deletion with ID: ${req.params.id}`);
      return res.status(404).json({ error: 'Quote not found' });
    }
    console.log(`Deleted quote with ID: ${req.params.id}`);
    res.status(204).send(); // No content to send back
  } catch (error) {
    console.error(`Error deleting quote with ID ${req.params.id}: ${error.message}`, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// POST route to calculate distance
router.post('/calculate-distance', isAuthenticated, csrfProtection, quoteController.calculateDistance);

module.exports = router;
