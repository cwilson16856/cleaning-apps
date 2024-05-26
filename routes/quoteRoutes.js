const express = require('express');
const router = express.Router();
const Quote = require('../models/quoteModel');
const Client = require('../models/clientModel'); // Ensure Client model is imported for client data fetching
const { sendQuoteDataToCRM } = require('../utils/crmIntegration');

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

// POST route for creating a new quote
router.post('/', async (req, res) => {
  try {
    const { serviceType, frequency, initialCleaningOptions, ...rest } = req.body;
    const newQuote = new Quote({
      serviceType,
      frequency,
      initialCleaningOptions,
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
    res.render('createQuote', { clients }); // Pass clients to the view for dropdown population
  } catch (error) {
    console.error(`Error fetching clients for quote creation: ${error.message}`, error.stack);
    res.status(500).json({ error: error.message });
  }
});

// GET route for retrieving a single quote by ID
router.get('/:id', async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).populate('clientId');
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

// PUT route for updating a quote by its ID
router.put('/:id', async (req, res) => {
  try {
    const { serviceType, frequency, initialCleaningOptions, ...updateData } = req.body;
    const updatedQuote = await Quote.findByIdAndUpdate(req.params.id, {
      serviceType,
      frequency,
      initialCleaningOptions,
      ...updateData
    }, { new: true, runValidators: true });

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

// DELETE route for removing a quote
router.delete('/:id', async (req, res) => {
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