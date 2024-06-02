const Quote = require('../models/quoteModel');
const Client = require('../models/clientModel');
const ServiceItem = require('../models/serviceItem');
const { calculateQuotePrice } = require('../utils/pricingCalculator');
const { calculateDistance } = require('../utils/distanceCalculator');
const logger = require('../logger'); // Import the logger
const { isAuthenticated } = require('../middleware/authMiddleware');

const calculateSubtotal = (serviceItems) => {
  return serviceItems.reduce((sum, item) => sum + (item.customPrice || item.rate) * item.quantity, 0);
};

exports.createQuote = async (req, res) => {
  try {
    const { clientId, title, scopeOfWork, serviceType, frequency, initialCleaningOptions, serviceItems, userAddress, taxRate } = req.body;

    if (!Array.isArray(serviceItems) || serviceItems.length === 0) {
      throw new Error('Invalid serviceItems data provided.');
    }

    const client = await Client.findById(clientId);
    if (!client) {
      logger.error(`Client not found with ID: ${clientId}`);
      return res.status(404).json({ message: 'Client not found' });
    }

    const processedServiceItems = await Promise.all(serviceItems.map(async (item) => {
      const serviceItem = await ServiceItem.findById(item.serviceItemId);
      if (!serviceItem) {
        throw new Error(`Service item not found with ID: ${item.serviceItemId}`);
      }
      return {
        serviceItemId: item.serviceItemId,
        quantity: item.quantity,
        customPrice: item.customPrice ? item.customPrice : serviceItem.price
      };
    }));

    const subtotal = calculateSubtotal(processedServiceItems);
    const calculatedTaxRate = parseFloat(taxRate) || 7.5;
    const total = subtotal + (subtotal * (calculatedTaxRate / 100));

    const newQuote = new Quote({
      clientName: client.name,
      clientId,
      title,
      scopeOfWork,
      serviceType,
      frequency,
      initialCleaningOptions,
      serviceItems: processedServiceItems,
      userAddress,
      attachments: req.files && req.files['attachments'] ? req.files['attachments'].map(file => file.filename) : [],
      contracts: req.files && req.files['contracts'] ? req.files['contracts'].map(file => file.filename) : [],
      subtotal,
      taxRate: calculatedTaxRate,
      total
    });

    await newQuote.save();
    logger.info(`New quote created with ID: ${newQuote._id}`);
    res.status(201).json(newQuote);
  } catch (error) {
    logger.error(`Error creating new quote: ${error.message}`, error);
    res.status(500).json({ message: 'Failed to create quote', error: error.message });
  }
};

exports.getQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find().populate('clientId');
    logger.info(`Fetched ${quotes.length} quotes`);
    res.status(200).json(quotes);
  } catch (error) {
    logger.error(`Error fetching quotes: ${error.message}`, error);
    res.status(500).json({ message: 'Failed to fetch quotes', error: error.message });
  }
};

exports.calculateDistance = async (req, res) => {
  const { clientId, userAddress } = req.body;

  try {
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const clientAddress = `${client.streetAddress}, ${client.city}, ${client.state}, ${client.zip}`;
    const distance = await calculateDistance(clientAddress, userAddress);
    res.json({ distance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getQuoteById = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id)
      .populate('clientId')
      .populate('serviceItems.serviceItemId');

    if (!quote) {
      logger.error(`Quote not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Quote not found' });
    }

    logger.info(`Fetched quote with ID: ${req.params.id}`);
    res.render('quoteDetails', { quote });
  } catch (error) {
    logger.error(`Error fetching quote with ID ${req.params.id}: ${error.message}`, error);
    res.status(500).json({ message: 'Failed to fetch quote', error: error.message });
  }
};

exports.updateQuote = async (req, res) => {
  try {
    const { serviceType, frequency, initialCleaningOptions, serviceItems, pricingOption } = req.body;
    const processedServiceItems = await Promise.all(serviceItems.map(async (item) => {
      const serviceItem = await ServiceItem.findById(item.serviceItemId);
      if (!serviceItem) {
        throw new Error(`Service item not found with ID: ${item.serviceItemId}`);
      }
      return {
        serviceItemId: item.serviceItemId,
        quantity: item.quantity,
        customPrice: item.customPrice ? item.customPrice : serviceItem.price
      };
    }));

    const subtotal = calculateSubtotal(processedServiceItems);
    const taxRate = parseFloat(req.body.taxRate) || 7.5; // Parse tax rate
    const total = subtotal + (subtotal * (taxRate / 100));

    const { totalPrice, breakdown } = await calculateQuotePrice({ serviceItems: processedServiceItems }, pricingOption);

    const updatedQuote = await Quote.findByIdAndUpdate(req.params.id, {
      serviceType,
      frequency,
      initialCleaningOptions,
      serviceItems: processedServiceItems,
      subtotal,
      total,
      taxRate,
      totalPrice,
      priceBreakdown: breakdown
    }, { new: true }).populate('clientId').populate('serviceItems.serviceItemId');

    if (!updatedQuote) {
      logger.error(`Quote not found for updating with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Quote not found' });
    }
    logger.info(`Updated quote with ID: ${req.params.id}`);
    res.status(200).json(updatedQuote);
  } catch (error) {
    logger.error(`Error updating quote with ID ${req.params.id}: ${error.message}`, error);
    res.status(500).json({ message: 'Failed to update quote', error: error.message });
  }
};

exports.deleteQuote = async (req, res) => {
  try {
    const quote = await Quote.findByIdAndDelete(req.params.id);
    if (!quote) {
      logger.error(`Quote not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Quote not found' });
    }
    logger.info(`Deleted quote with ID: ${req.params.id}`);
    res.status(200).json({ message: 'Quote deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting quote with ID ${req.params.id}: ${error.message}`, error);
    res.status(500).json({ message: 'Failed to delete quote', error: error.message });
  }
};
