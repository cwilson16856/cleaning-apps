const express = require('express');
const router = express.Router();
const { createServiceItem, getServiceItemById, updateServiceItem, deleteServiceItem, renderServiceItemsPage } = require('../controllers/serviceItemController');
const csrf = require('csurf');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Setup CSRF protection middleware
const csrfProtection = csrf({ cookie: true });

// GET route to fetch all service items and render the manage service items page
router.get('/', isAuthenticated, csrfProtection, renderServiceItemsPage);

// GET route to render the create item page
router.get('/new', isAuthenticated, csrfProtection, (req, res) => {
  res.render('createItem', { pageTitle: 'Create New Item', csrfToken: req.csrfToken() }); // Combined object
});

// POST route to create a new service item
router.post('/', isAuthenticated, csrfProtection, async (req, res) => {
  try {
    await createServiceItem(req, res);
  } catch (error) {
    console.error(`Error creating service item: ${error.message}`, error);
    res.status(400).render('createItem', { error: 'Failed to create item', csrfToken: req.csrfToken() });
  }
});

// GET route to render the edit item page
router.get('/:id/edit', isAuthenticated, csrfProtection, async (req, res) => {
  try {
    const item = await getServiceItemById(req.params.id);
    res.render('editItem', { pageTitle: 'Edit Item', item, csrfToken: req.csrfToken() }); // Combined object
  } catch (error) {
    console.error(`Error fetching service item for editing: ${error.message}`, error);
    res.status(500).send('Error fetching service item for editing');
  }
});

// PUT route to update a service item by ID
router.put('/:id', isAuthenticated, csrfProtection, async (req, res) => {
  try {
    await updateServiceItem(req, res);
  } catch (error) {
    console.error(`Error updating service item: ${error.message}`, error);
    res.status(400).send('Error updating service item');
  }
});

// DELETE route to delete a service item by ID
router.delete('/:id', isAuthenticated, csrfProtection, async (req, res) => { // Added delete route
  try {
    const serviceItem = await deleteServiceItem(req, res);
    if (!serviceItem) {
      console.log(`Service item not found with id: ${req.params.id}`);
      return res.status(404).render('error', { message: 'ServiceItem not found' });
    }
    console.log(`Service item deleted: ${serviceItem.name}`);
    res.redirect('/items');
  } catch (error) {
    console.error(`Error deleting service item: ${error.message}`, error);
    res.status(400).render('error', { message: error.message });
  }
});

module.exports = router;