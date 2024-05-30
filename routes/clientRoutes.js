const express = require('express');
const router = express.Router();
const Client = require('../models/clientModel'); // Import the Client model
const { createClient, searchClients, updateClient, deleteClient} = require('../controllers/clientController');
const { isAuthenticated } = require('../middleware/authMiddleware'); // Assuming this is your auth middleware
const csrf = require('csurf'); // Import csurf for CSRF protection
const getClient = require('../middleware/getClient'); // Import the middleware

// CSRF Protection Middleware using csurf
const csrfProtection = csrf({ cookie: true });

// Get all clients and render the clients.ejs template
router.get('/', isAuthenticated, csrfProtection, async (req, res) => {
  try {
    const clients = await Client.find();
    res.render('clients', { clients, csrfToken: req.csrfToken() }); // Use csrfToken from req
    console.log("Fetched all clients successfully.");
  } catch (err) {
    console.error(`Error fetching clients: ${err.message}`, err.stack);
    res.status(500).json({ message: err.message });
  }
});

// Render the form to create a new client
router.get('/new', isAuthenticated, csrfProtection, (req, res) => {
  console.log("Rendering createClient.ejs");
  res.render('createClient', { csrfToken: req.csrfToken() }); // Use csrfToken from req
});

// Search for clients
router.get('/search', isAuthenticated, csrfProtection, searchClients);

// Get one client
router.get('/:id', isAuthenticated, csrfProtection, getClient, (req, res) => {
  res.status(200).json(req.client);
});

// Render the form to edit a client
router.get('/:id/edit', isAuthenticated, csrfProtection, getClient, (req, res) => {
  res.render('editClient', { client: req.client, csrfToken: req.csrfToken() });
  console.log(`Rendered editClient.ejs for client ID: ${req.params.id}`);
});

// Create new client
router.post('/', isAuthenticated, csrfProtection, createClient);

// Update client
router.put('/:id', isAuthenticated, csrfProtection, getClient, updateClient);

// Delete client
router.delete('/:id', isAuthenticated, csrfProtection, getClient, deleteClient);

module.exports = router;
