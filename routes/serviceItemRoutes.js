// routes/serviceItemRoutes.js
const express = require('express');
const router = express.Router();
const { createServiceItem, getServiceItemById, updateServiceItem, deleteServiceItem, getAllServiceItems } = require('../controllers/serviceItemController');

// GET route to fetch all service items and render the manage service items page
router.get('/', getAllServiceItems);

// GET route to render the create item page
router.get('/new', (req, res) => {
  res.render('createItem', { csrfToken: req.csrfToken() });
});

// POST route to create a new service item
router.post('/', createServiceItem);

// GET route to render the edit item page
router.get('/:id/edit', async (req, res) => {
  try {
    const item = await getServiceItemById(req.params.id);
    res.render('editItem', { item, csrfToken: req.csrfToken() });
  } catch (error) {
    console.error(`Error fetching service item for editing: ${error.message}`, error);
    res.status(500).send('Error fetching service item for editing');
  }
});

// PUT route to update a service item by ID
router.put('/:id', updateServiceItem);

// DELETE route to delete a service item by ID
router.delete('/:id', deleteServiceItem);

module.exports = router;
