const ServiceItem = require('../models/serviceItem');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');

// Utility function for handling errors
const handleError = (res, error, message, statusCode = 500) => {
  console.error(message, error);
  res.status(statusCode).json({
    success: false,
    message,
    error: error.message
  });
};

// Middleware to validate ObjectId
exports.validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, error: 'Invalid ID' });
  }
  next();
};

// Middleware to get ServiceItem by ID
exports.getServiceItemById = async (req, res, next) => {
  try {
    const serviceItem = await ServiceItem.findById(req.params.id);
    if (!serviceItem) {
      return res.status(404).json({ success: false, error: 'ServiceItem not found' });
    }
    req.serviceItem = serviceItem; // Save in request object for further use
    next(); // Pass to the next middleware/controller function
  } catch (error) {
    handleError(res, error, 'Error fetching service item by id');
  }
};

// Create new ServiceItem with validation
exports.createServiceItem = [
  body('name').not().isEmpty().withMessage('Name is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const newServiceItem = await ServiceItem.create(req.body);
      console.log(`Service item created: ${newServiceItem.name}`);
      res.status(201).json({ success: true, data: newServiceItem });
    } catch (error) {
      handleError(res, error, 'Error creating new service item', 400);
    }
  }
];

// Get all ServiceItems and return JSON
exports.getAllServiceItems = async (req, res) => {
  try {
    const serviceItems = await ServiceItem.find();
    console.log(`Fetched all items, count: ${serviceItems.length}`);
    res.status(200).json({ success: true, data: serviceItems });
  } catch (error) {
    handleError(res, error, 'Error fetching service items');
  }
};

// Get all ServiceItems and render the view
exports.renderServiceItemsPage = async (req, res) => {
  try {
    const serviceItems = await ServiceItem.find();
    console.log(`Fetched all items, count: ${serviceItems.length}`);
    res.render('items', { serviceItems, csrfToken: req.csrfToken() });
  } catch (error) {
    console.error(`Error fetching items: ${error.message}`, error);
    res.status(500).send('Error fetching service items');
  }
};

// Update a ServiceItem
exports.updateServiceItem = async (req, res) => {
  try {
    const serviceItem = await ServiceItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!serviceItem) {
      console.log(`Service item not found with id: ${req.params.id}`);
      return res.status(404).json({ success: false, error: 'ServiceItem not found' });
    }
    console.log(`Service item updated: ${serviceItem.name}`);
    res.status(200).json({ success: true, data: serviceItem });
  } catch (error) {
    handleError(res, error, 'Error updating service item', 400);
  }
};

// Delete a ServiceItem
exports.deleteServiceItem = async (req, res) => {
  try {
    const serviceItem = await ServiceItem.findByIdAndDelete(req.params.id);
    if (!serviceItem) {
      console.log(`Service item not found with id: ${req.params.id}`);
      return res.status(404).json({ success: false, error: 'ServiceItem not found' });
    }
    console.log(`Service item deleted: ${serviceItem.name}`);
    res.status(200).json({ success: true, message: 'Service item deleted successfully' });
  } catch (error) {
    handleError(res, error, 'Error deleting service item', 400);
  }
};
