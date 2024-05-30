const Client = require('../models/clientModel');
const { v4: uuidv4 } = require('uuid');
const logger = require('../logger'); // Import the logger

// Create new Client
exports.createClient = async (req, res) => {
  try {
    const clientData = {
      clientId: uuidv4(),
      companyName: req.body.companyName,
      name: req.body.name,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      streetAddress: req.body.streetAddress,
      city: req.body.city,
      state: req.body.state,
      zip: req.body.zip
    };
    const newClient = await Client.create(clientData);
    logger.info(`New client created: ${newClient.name}`);
    res.status(201).json({
      success: true,
      data: newClient
    });
  } catch (error) {
    logger.error(`Error creating new client: ${error.message}`, error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Search Clients
exports.searchClients = async (req, res) => {
  try {
    const query = req.query.query;
    const clients = await Client.find({ name: { $regex: query, $options: 'i' } });
    logger.info(`Clients search results for query: ${query}`);
    res.status(200).json(clients);
  } catch (error) {
    logger.error(`Error searching clients: ${error.message}`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get Client by ID
exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      logger.error(`Client not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Client not found' });
    }
    res.status(200).json(client);
  } catch (error) {
    logger.error(`Error fetching client with ID ${req.params.id}: ${error.message}`, error);
    res.status(500).json({ message: 'Failed to fetch client', error: error.message });
  }
};

// Update Client
exports.updateClient = async (req, res) => {
  try {
    const clientId = req.params.id;
    const updateData = req.body;
    const updatedClient = await Client.findByIdAndUpdate(clientId, updateData, { new: true });
    if (!updatedClient) {
      logger.error(`Client not found with ID: ${clientId}`);
      return res.status(404).json({ message: 'Client not found' });
    }
    logger.info(`Client updated successfully: ${updatedClient.name}`);
    res.status(200).json({ message: 'Client updated successfully', data: updatedClient });
  } catch (error) {
    logger.error(`Error updating client with ID ${clientId}: ${error.message}`, error);
    res.status(400).json({ message: 'Failed to update client', error: error.message });
  }
};

// Delete Client
exports.deleteClient = async (req, res) => {
  try {
    const clientId = req.params.id;
    const client = await Client.findByIdAndDelete(clientId);
    if (!client) {
      logger.error(`Client not found with ID: ${clientId}`);
      return res.status(404).json({ message: 'Client not found' });
    }
    logger.info(`Client deleted successfully: ${client.name}`);
    res.status(200).json({ message: 'Client deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting client with ID ${clientId}: ${error.message}`, error);
    res.status(500).json({ message: 'Failed to delete client', error: error.message });
  }
};