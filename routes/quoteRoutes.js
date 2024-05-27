const express = require('express');
const router = express.Router();
const Quote = require('../models/quoteModel');
const Client = require('../models/clientModel'); // Ensure Client model is imported for client data fetching
const ServiceItem = require('../models/serviceItem'); // Import ServiceItem model for fetching service items
const { sendQuoteDataToCRM } = require('../utils/crmIntegration');
const csrf = require('csurf'); // Import csurf for CSRF protection

// CSRF Protection Middleware using csurf
const csrfProtection = csrf({ cookie: false });

// GET route for retrieving and rendering all quotes
router.get('/', async (req, res) => {
  try {
    const quotes = await Quote.find().populate('clientId');
    console.log(`Rendering quotes.ejs with quotes data, count: ${quotes.length}`);
    res.render('quotes', { quotes });
  } catch (error) {
    console.error(`Error retrieving quotes: ${error.message}`, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// POST route for creating a new quote with CSRF protection
router.post('/', csrfProtection, async (req, res) => {
  try {
    const { serviceType, frequency, initialCleaningOptions, serviceItems, ...rest } = req.body;
    // Validate serviceItems
    if (!serviceItems || !Array.isArray(serviceItems)) {
      throw new Error("Invalid serviceItems data provided.");
    }
    const newQuote = new Quote({
      serviceType,
      frequency,
      initialCleaningOptions,
      serviceItems: serviceItems.map(item => ({
        serviceItemId: item.serviceItemId,
        quantity: item.quantity,
        customPrice: item.customPrice ? item.customPrice : undefined
      })),
      ...rest
    });

    await newQuote.save();

    console.log(`New quote created with ID: ${newQuote.quoteId}`);
    await sendQuoteDataToCRM(newQuote.toObject()).catch(err => {
      console.error(`CRM Integration Error: ${err.message}`, err.stack);
    });

    res.status(201).json(newQuote);
  } catch (error) {
    console.error(`Error creating new quote: ${error.message}`, error.stack);
    res.status(400).json({ error: "Failed to create quote. " + error.message });
  }
});

router.get('/new', async (req, res) => {
  try {
    const clients = await Client.find(); // Fetch all clients to populate the dropdown
    const serviceItems = await ServiceItem.find(); // Fetch all service items to populate the dropdown
    res.render('createQuote', { clients, serviceItems, csrfToken: req.csrfToken() }); // Pass clients and serviceItems to the view for dropdown population
  } catch (error) {
    console.error(`Error fetching data for quote creation: ${error.message}`, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// GET route for retrieving a single quote by ID
router.get('/:id', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).populate('clientId').populate({ path: 'serviceItems.serviceItemId', model: 'ServiceItem' });
    if (!quote) {
      console.log(`Quote not found with ID: ${req.params.id}`);
      return res.status(404).json({ error: 'Quote not found' });
    }
    console.log(`Retrieved quote with ID: ${req.params.id}`);
    if (req.accepts('html')) {
      res.render('quoteDetails', { quote });
    } else {
      res.status(200).json(quote);
    }
  } catch (error) {
    console.error(`Error retrieving quote with ID ${req.params.id}: ${error.message}`, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// PUT route for updating a quote by its ID with CSRF protection
router.put('/:id', csrfProtection, async (req, res) => {
  try {
    const { serviceType, frequency, initialCleaningOptions, serviceItems, ...updateData } = req.body;
    // Validate serviceItems
    if (!serviceItems || !Array.isArray(serviceItems)) {
      throw new Error("Invalid serviceItems data provided.");
    }
    const updatedQuote = await Quote.findByIdAndUpdate(req.params.id, {
      serviceType,
      frequency,
      initialCleaningOptions,
      serviceItems: serviceItems.map(item => ({
        serviceItemId: item.serviceItemId,
        quantity: item.quantity,
        customPrice: item.customPrice ? item.customPrice : undefined
      })),
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
router.delete('/:id', csrfProtection, async (req, res) => {
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

module.exports = router;