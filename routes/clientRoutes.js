const express = require('express');
const router = express.Router();
const { createClient, searchClients } = require('../controllers/clientController');
const csrf = require('csurf');
const Client = require('../models/clientModel');

// CSRF Protection Middleware using csurf
const csrfProtection = csrf({ cookie: true });

// Middleware to get client by ID
async function getClient(req, res, next) {
    console.log(`Getting client with ID: ${req.params.id}`);
    let client;
    try {
        client = await Client.findById(req.params.id);
        if (client == null) {
            console.log(`Cannot find client with ID: ${req.params.id}`);
            return res.status(404).json({ message: 'Cannot find client' });
        }
    } catch (err) {
        console.error(`Error finding client: ${err.message}`, err.stack);
        return res.status(500).json({ message: err.message });
    }
    res.client = client;
    next();
}

// Get all clients and render the clients.ejs template
router.get('/', csrfProtection, async (req, res) => {
    try {
        const clients = await Client.find();
        res.render('clients', { clients, csrfToken: req.csrfToken() });
        console.log("Fetched all clients successfully.");
    } catch (err) {
        console.error(`Error fetching clients: ${err.message}`, err.stack);
        res.status(500).json({ message: err.message });
    }
});

router.get('/new', csrfProtection, (req, res) => {
    console.log("Rendering createClient.ejs");
    res.render('createClient', { csrfToken: req.csrfToken() });
});

// Search for clients
router.get('/search', searchClients);

// Get one client
router.get('/:id', getClient, csrfProtection, (req, res) => {
    console.log(`Rendering clientDetails.ejs for client ID: ${req.params.id}`);
    res.render('clientDetails', { client: res.client, csrfToken: req.csrfToken() });
});

// Route to render the form to edit a client
router.get('/:id/edit', getClient, csrfProtection, (req, res) => {
    console.log(`Rendering editClient.ejs for client ID: ${req.params.id}`);
    try {
        res.render('editClient', { client: res.client, csrfToken: req.csrfToken() });
        console.log(`Rendered editClient.ejs for client ID: ${req.params.id}`);
    } catch (err) {
        console.error(`Error rendering editClient: ${err.message}`, err.stack);
        res.status(500).send("Error rendering page for editing client.");
    }
});

// Create new client
router.post('/', csrfProtection, createClient);

// Update client
router.put('/:id', getClient, csrfProtection, async (req, res) => {
    if (req.body.clientId != null) {
        res.client.clientId = req.body.clientId;
    }
    if (req.body.name != null) {
        res.client.name = req.body.name;
    }
    if (req.body.email != null) {
        res.client.email = req.body.email;
    }
    if (req.body.phoneNumber != null) {
        res.client.phoneNumber = req.body.phoneNumber;
    }
    if (req.body.streetAddress != null) {
        res.client.streetAddress = req.body.streetAddress;
    }
    if (req.body.city != null) {
        res.client.city = req.body.city;
    }
    if (req.body.state != null) {
        res.client.state = req.body.state;
    }
    if (req.body.zip != null) {
        res.client.zip = req.body.zip;
    }

    try {
        const updatedClient = await res.client.save();
        await sendClientDataToCRM(updatedClient.toObject()).catch(err => {
            console.error(`CRM Integration Error: ${err.message}`, err.stack);
        });
        console.log(`Updated client with ID: ${req.params.id}`);
        res.redirect('/clients?updated=true'); // Redirect after successful update
    } catch (err) {
        console.error(`Error updating client: ${err.message}`, err.stack);
        res.status(400).json({ message: err.message });
    }
});

// Delete client
router.delete('/:id', getClient, csrfProtection, async (req, res) => {
    try {
        await res.client.remove();
        res.json({ message: 'Deleted Client' });
        console.log(`Deleted client with ID: ${req.params.id}`);
    } catch (err) {
        console.error(`Error deleting client: ${err.message}`, err.stack);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
