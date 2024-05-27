const Quote = require('../models/quoteModel');
const Client = require('../models/clientModel');
const ServiceItem = require('../models/serviceItem');
const { calculateQuotePrice } = require('../utils/pricingCalculator');

exports.createQuote = async (req, res) => {
  try {
    const { clientId, title, scopeOfWork, serviceType, frequency, initialCleaningOptions, serviceItems, pricingOption } = req.body;
    const client = await Client.findById(clientId);
    if (!client) {
      console.error(`Client not found with ID: ${clientId}`);
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

    const quoteDetails = {
      clientName: client.name,
      clientId,
      title,
      scopeOfWork,
      serviceType,
      frequency,
      initialCleaningOptions,
      serviceItems: processedServiceItems
    };

    const { totalPrice, breakdown } = await calculateQuotePrice({ serviceItems: processedServiceItems }, pricingOption ? pricingOption : 'itemized');

    const newQuote = new Quote({
      ...quoteDetails,
      totalPrice,
      priceBreakdown: breakdown
    });

    await newQuote.save();
    console.log(`New quote created with ID: ${newQuote.quoteId}`);
    res.status(201).json(newQuote);
  } catch (error) {
    console.error(`Error creating new quote: ${error.message}`, error);
    res.status(500).json({ message: 'Failed to create quote', error: error.message });
  }
};

exports.getQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find().populate('clientId');
    console.log(`Fetched ${quotes.length} quotes`);
    res.status(200).json(quotes);
  } catch (error) {
    console.error(`Error fetching quotes: ${error.message}`, error);
    res.status(500).json({ message: 'Failed to fetch quotes', error: error.message });
  }
};

exports.getQuoteById = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).populate('clientId').populate('serviceItems.serviceItemId');
    if (!quote) {
      console.error(`Quote not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Quote not found' });
    }
    console.log(`Fetched quote with ID: ${req.params.id}`);
    res.status(200).json(quote);
  } catch (error) {
    console.error(`Error fetching quote with ID ${req.params.id}: ${error.message}`, error);
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

    const { totalPrice, breakdown } = await calculateQuotePrice({ serviceItems: processedServiceItems }, pricingOption);

    const updatedQuote = await Quote.findByIdAndUpdate(req.params.id, {
      serviceType,
      frequency,
      initialCleaningOptions,
      serviceItems: processedServiceItems,
      totalPrice,
      priceBreakdown: breakdown
    }, { new: true }).populate('clientId').populate('serviceItems.serviceItemId');

    if (!updatedQuote) {
      console.error(`Quote not found for updating with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Quote not found' });
    }
    console.log(`Updated quote with ID: ${req.params.id}`);
    res.status(200).json(updatedQuote);
  } catch (error) {
    console.error(`Error updating quote with ID ${req.params.id}: ${error.message}`, error);
    res.status(500).json({ message: 'Failed to update quote', error: error.message });
  }
};

// Delete a ServiceItem
exports.deleteServiceItem = async (req, res) => {
  try {
    const serviceItem = await ServiceItem.findByIdAndDelete(req.params.id);
    if (!serviceItem) {
      console.log(`Service item not found with id: ${req.params.id}`);
      return res.status(404).json({
        success: false,
        error: 'ServiceItem not found'
      });
    }
    console.log(`Service item deleted: ${serviceItem.name}`);
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(`Error deleting service item: ${error.message}`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};