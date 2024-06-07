const express = require('express');
const router = express.Router();
const Client = require('../models/clientModel');
const { createClient, searchClients, updateClient, deleteClient, getClientByIdWithQuotes } = require('../controllers/clientController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const csrf = require('csurf');
const getClient = require('../middleware/getClient');

// CSRF Protection Middleware using csurf
const csrfProtection = csrf({ cookie: true });

// Middleware Sequence for Routes
const authAndCsrf = [isAuthenticated, csrfProtection];

// Get all clients and render the clients.ejs template
router.get('/', ...authAndCsrf, async (req, res) => {
  try {
    const clients = await Client.find();
    res.render('clients', { pageTitle: 'Clients', clients, csrfToken: req.csrfToken(), currentPath: req.originalUrl });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch clients. Please try again later.' });
  }
});

// Render the form to create a new client
router.get('/new', ...authAndCsrf, (req, res) => {
  res.render('createClient', { pageTitle: 'Create New Client', csrfToken: req.csrfToken(), currentPath: req.originalUrl });
});

router.get('/:id/profile', ...authAndCsrf, async (req, res) => {
  const { client, quotes, error } = await getClientByIdWithQuotes(req, res);
  if (error) {
    console.error(`Error fetching client or quotes: ${error.message}`);
    return res.status(500).render('error', { message: 'Failed to fetch client data. Please try again later.' });
  }
  res.render('clientProfile', {
    pageTitle: 'Client Profile',
    client: client,
    quotes: quotes || [],
    csrfToken: req.csrfToken(),
    currentPath: req.originalUrl
  });
});

// Render the form to edit a client
router.get('/:id/edit', ...authAndCsrf, getClient, (req, res) => {
  res.render('editClient', { pageTitle: 'Edit Client', client: req.client, csrfToken: req.csrfToken(), currentPath: req.originalUrl });
});

// Create new client
router.post('/', ...authAndCsrf, createClient);

// Update client
router.put('/:id', ...authAndCsrf, getClient, updateClient);

// Delete client
router.delete('/:id', ...authAndCsrf, getClient, deleteClient);

module.exports = router;
