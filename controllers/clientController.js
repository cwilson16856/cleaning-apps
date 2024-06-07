const Client = require('../models/clientModel');
const Quote = require('../models/quoteModel');
const { v4: uuidv4 } = require('uuid');
const logger = require('../logger');
const Joi = require('joi');

// Utility function for handling errors
const handleError = (res, error, message, statusCode = 500) => {
  logger.error(`${message}: ${error.message}`);
  res.status(statusCode).json({
    success: false,
    message,
    error: error.message,
  });
};

exports.getClientByIdWithQuotes = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    const quotes = await Quote.find({ clientId: client._id }) || [];
    return { client, quotes };
  } catch (error) {
    return { error };
  }
};

// Schema validation
const clientSchema = Joi.object({
  companyName: Joi.string().optional(),
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string().pattern(new RegExp('^[0-9]{10}$')).required(),
  streetAddress: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zip: Joi.string().pattern(new RegExp('^[0-9]{5}$')).required(),
});

// Create new Client
exports.createClient = async (req, res) => {
  try {
    const { error } = clientSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const clientData = {
      clientId: uuidv4(),
      ...req.body,
    };

    const newClient = await Client.create(clientData);
    logger.info(`New client created: ${newClient.name}`);
    res.status(201).json({
      success: true,
      data: newClient,
    });
  } catch (error) {
    handleError(res, error, 'Error creating new client');
  }
};

// Search Clients
exports.searchClients = async (req, res) => {
  try {
    const query = req.query.query;
    const clients = await Client.find({ name: { $regex: query, $options: 'i' } });
    logger.info(`Clients search results for query: ${query}`);
    res.status(200).json({ success: true, data: clients });
  } catch (error) {
    handleError(res, error, 'Error searching clients');
  }
};

// Get Client by ID
exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    res.status(200).json({ success: true, data: client });
  } catch (error) {
    handleError(res, error, `Error fetching client with ID ${req.params.id}`);
  }
};

// Update Client
exports.updateClient = async (req, res) => {
  try {
    const { error } = clientSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const clientId = req.params.id;
    const updatedClient = await Client.findByIdAndUpdate(clientId, req.body, { new: true });
    if (!updatedClient) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    logger.info(`Client updated successfully: ${updatedClient.name}`);
    res.status(200).json({ success: true, message: 'Client updated successfully', data: updatedClient });
  } catch (error) {
    handleError(res, error, `Error updating client with ID ${req.params.id}`);
  }
};

// Delete Client
exports.deleteClient = async (req, res) => {
  try {
    const clientId = req.params.id;
    const client = await Client.findByIdAndDelete(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    logger.info(`Client deleted successfully: ${client.name}`);
    res.status(200).json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    handleError(res, error, `Error deleting client with ID ${clientId}`);
  }
};

// Add Note to Client
exports.addNote = async (req, res) => {
  try {
    const clientId = req.params.id;
    const note = req.body.note;
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    client.notes.push(note);
    await client.save();
    res.status(200).json({ success: true, message: 'Note added successfully', data: client });
  } catch (error) {
    handleError(res, error, `Error adding note to client with ID ${req.params.id}`);
  }
};
