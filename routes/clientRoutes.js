const express = require('express');
const router = express.Router();
const Client = require('../models/clientModel');
const { sendClientDataToCRM } = require('../utils/crmIntegration');

// Get all clients and render the clients.ejs template
router.get('/', async (req, res) => {
    try {
        const clients = await Client.find();
        res.render('clients', { clients });
        console.log("Fetched all clients successfully.");
    } catch (err) {
        console.error(`Error fetching clients: ${err.message}`, err.stack);
        res.status(500).json({ message: err.message });
    }
});

// Middleware to get client by ID
async function getClient(req, res, next) {
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

router.get('/new', (req, res) => {
    // render the new client form
});

// Get one client
router.get('/:id', getClient, (req, res) => {
    res.render('clientDetails', { client: res.client });
    console.log(`Fetched client with ID: ${req.params.id}`);
});

// Create new client
router.post('/', async (req, res) => {
    const client = new Client({
        name: req.body.name,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        clientId: req.body.clientId
    });

    try {
        const newClient = await client.save();
        await sendClientDataToCRM(newClient.toObject()).catch(err => {
            console.error(`CRM Integration Error: ${err.message}`, err.stack);
        });
        res.status(201).json(newClient);
        console.log(`Created new client: ${newClient.name}`);
    } catch (err) {
        console.error(`Error creating client: ${err.message}`, err.stack);
        res.status(400).json({ message: err.message });
    }
});

// Update client
router.put('/:id', getClient, async (req, res) => {
    if (req.body.name != null) {
        res.client.name = req.body.name;
    }
    if (req.body.email != null) {
        res.client.email = req.body.email;
    }
    if (req.body.phoneNumber != null) {
        res.client.phoneNumber = req.body.phoneNumber;
    }
    if (req.body.clientId != null) {
        res.client.clientId = req.body.clientId;
    }

    try {
        const updatedClient = await res.client.save();
        await sendClientDataToCRM(updatedClient.toObject()).catch(err => {
            console.error(`CRM Integration Error: ${err.message}`, err.stack);
        });
        res.json(updatedClient);
        console.log(`Updated client with ID: ${req.params.id}`);
    } catch (err) {
        console.error(`Error updating client: ${err.message}`, err.stack);
        res.status(400).json({ message: err.message });
    }
});

// Delete client
router.delete('/:id', getClient, async (req, res) => {
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