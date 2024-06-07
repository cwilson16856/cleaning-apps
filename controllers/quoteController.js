const Quote = require('../models/quoteModel');
const Client = require('../models/clientModel');
const ServiceItem = require('../models/serviceItem');
const { calculateQuotePrice } = require('../utils/pricingCalculator');
const { calculateDistance } = require('../utils/distanceCalculator');
const logger = require('../logger'); // Import the logger
const { isAuthenticated } = require('../middleware/authMiddleware');
const Joi = require('joi');

const DEFAULT_TAX_RATE = 7.5;

// Utility function for handling errors
const handleError = (res, error, message, statusCode = 500) => {
  logger.error(message, error);
  res.status(statusCode).json({
    success: false,
    message,
    error: error.message
  });
};

const calculateSubtotal = (serviceItems) => {
  return serviceItems.reduce((sum, item) => sum + (item.customPrice || item.rate) * item.quantity, 0);
};

// Joi schema for quote validation
const quoteSchema = Joi.object({
  clientId: Joi.string().required(),
  title: Joi.string().required(),
  scopeOfWork: Joi.string().optional(),
  serviceType: Joi.string().required(),
  frequency: Joi.string().optional(),
  initialCleaningOptions: Joi.array().optional(),
  serviceItems: Joi.array().items(
    Joi.object({
      serviceItemId: Joi.string().required(),
      quantity: Joi.number().required(),
      customPrice: Joi.number().optional()
    })
  ).required(),
  userAddress: Joi.string().required(),
  taxRate: Joi.number().optional()
});

exports.createQuote = async (req, res) => {
  try {
    const { error } = quoteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { clientId, title, scopeOfWork, serviceType, frequency, initialCleaningOptions, serviceItems, userAddress, taxRate } = req.body;

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
    const calculatedTaxRate = parseFloat(taxRate) || DEFAULT_TAX_RATE;
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
    handleError(res, error, 'Error creating new quote', 500);
  }
};

exports.getQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find().populate('clientId');
    logger.info(`Fetched ${quotes.length} quotes`);
    res.status(200).json({ success: true, data: quotes });
  } catch (error) {
    handleError(res, error, 'Error fetching quotes', 500);
  }
};

exports.calculateDistance = async (req, res) => {
  const { clientId, userAddress } = req.body;

  try {
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const clientAddress = `${client.streetAddress}, ${client.city}, ${client.state}, ${client.zip}`;
    const distance = await calculateDistance(clientAddress, userAddress);
    res.status(200).json({ success: true, data: { distance } });
  } catch (error) {
    handleError(res, error, 'Error calculating distance', 500);
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
    res.status(200).json({ success: true, data: quote });
  } catch (error) {
    handleError(res, error, `Error fetching quote with ID ${req.params.id}`, 500);
  }
};

exports.updateQuote = async (req, res) => {
  try {
    const { error } = quoteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

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
    const taxRate = parseFloat(req.body.taxRate) || DEFAULT_TAX_RATE;
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
    res.status(200).json({ success: true, message: 'Quote updated successfully', data: updatedQuote });
  } catch (error) {
    handleError(res, error, `Error updating quote with ID ${req.params.id}`, 500);
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
    res.status(200).json({ success: true, message: 'Quote deleted successfully' });
  } catch (error) {
    handleError(res, error, `Error deleting quote with ID ${req.params.id}`, 500);
  }
};
