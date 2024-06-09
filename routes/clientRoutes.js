const express = require('express');
const router = express.Router();
const {
  createClient,
  clientSearch,
  updateClient,
  deleteClient,
  getClientByIdWithQuotes,
  addNote,
  updateNote,
  deleteNote,
  getClient,
  getClientById // Ensure this is imported
} = require('../controllers/clientController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const csrf = require('csurf');
const Client = require('../models/clientModel'); // Add this line

// CSRF Protection Middleware using csurf
const csrfProtection = csrf({ cookie: true });

// Middleware Sequence for Routes
const authAndCsrf = [isAuthenticated, csrfProtection];

// Get all clients and render the clients.ejs template
router.get('/', authAndCsrf, async (req, res) => {
  try {
    const clients = await Client.find(); // Add await to fix the issue
    res.render('clients', { pageTitle: 'Clients', clients, csrfToken: req.csrfToken(), currentPath: req.originalUrl });
  } catch (err) {
    res.status(500).render('error', { message: 'Failed to fetch clients. Please try again later.' });
  }
});

// Render the form to create a new client
router.get('/new', authAndCsrf, (req, res) => {
  res.render('createClient', { pageTitle: 'Create New Client', csrfToken: req.csrfToken(), currentPath: req.originalUrl });
});

router.get('/:id/profile', authAndCsrf, async (req, res) => {
  const { client, quotes, error } = await getClientByIdWithQuotes(req, res);
  if (error) {
    console.error(`Error fetching client or quotes: ${error.message}`);
    return res.status(500).render('error', { message: 'Failed to fetch client data. Please try again later.' });
  }
  res.render('clientProfile', {
    pageTitle: 'Client Profile',
    client,
    quotes: quotes || [],
    csrfToken: req.csrfToken(),
    currentPath: req.originalUrl
  });
});

// Render the form to edit a client
router.get('/:id/edit', authAndCsrf, getClient, (req, res) => {
  res.render('editClient', { pageTitle: 'Edit Client', client: req.client, csrfToken: req.csrfToken(), currentPath: req.originalUrl });
});

// Create new client
router.post('/', authAndCsrf, createClient);

// Search clients using the controller function
router.get('/search', authAndCsrf, clientSearch);

// Update client
router.put('/:id', authAndCsrf, getClient, updateClient);

// Delete client
router.delete('/:id', authAndCsrf, getClient, deleteClient);

// Add Note
router.post('/:id/notes', authAndCsrf, getClient, addNote);

// Update Note
router.put('/:id/notes/:noteId', authAndCsrf, getClient, updateNote);

// Delete Note
router.delete('/:id/notes/:noteId', authAndCsrf, getClient, deleteNote);

// Get client by ID (used for fetching client details for edit)
router.get('/:id', authAndCsrf, getClientById);

module.exports = router;
