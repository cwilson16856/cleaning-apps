const ServiceItem = require('../models/serviceItem');

// Create new ServiceItem
exports.createServiceItem = async (req, res) => {
  try {
    console.log('Request body:', req.body);  // Log the request body for debugging
    const newServiceItem = await ServiceItem.create(req.body);
    console.log(`Service item created: ${newServiceItem.name}`);
    res.status(201).json({
      success: true,
      data: newServiceItem
    });
  } catch (error) {
    console.error(`Error creating new item: ${error.message}`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};


// Get all ServiceItems and render the view
exports.getAllServiceItems = async (req, res) => {
  try {
    const serviceItems = await ServiceItem.find();
    console.log(`Fetched all items, count: ${serviceItems.length}`);
    res.render('items', { serviceItems, csrfToken: req.csrfToken() });
  } catch (error) {
    console.error(`Error fetching items: ${error.message}`, error);
    res.status(500).send('Error fetching service items');
  }
};

// Utility function to get a single ServiceItem by id
exports.findServiceItemById = async (id) => {
  try {
    const serviceItem = await ServiceItem.findById(id);
    if (!serviceItem) {
      throw new Error(`Item not found with id: ${id}`);
    }
    return serviceItem;
  } catch (error) {
    throw new Error(`Error fetching service item by id: ${error.message}`);
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
      return res.status(404).json({
        success: false,
        error: 'ServiceItem not found'
      });
    }
    console.log(`Service item updated: ${serviceItem.name}`);
    res.status(200).json({
      success: true,
      data: serviceItem
    });
  } catch (error) {
    console.error(`Error updating service item: ${error.message}`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
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
    // Determine the redirect URL based on the current page or context
    let redirectUrl = '/items';
    if (req.headers.referer.includes('/clients')) {
      redirectUrl = '/clients';
    } else if (req.headers.referer.includes('/quotes')) {
      redirectUrl = '/quotes';
    }
    res.redirect(redirectUrl);  // Redirect based on context
  } catch (error) {
    console.error(`Error deleting service item: ${error.message}`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};