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

// Controller to get client by ID with quotes
exports.getClientByIdWithQuotes = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    const quotes = await Quote.find({ clientId: client._id });
    return { client, quotes };
  } catch (error) {
    handleError(res, error, `Error fetching client with ID ${req.params.id} and related quotes`);
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
  _csrf: Joi.string().optional()  // Allow _csrf token
});

// Create new Client
exports.createClient = async (req, res) => {
  try {
    const { error } = clientSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const clientData = { ...req.body };

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

exports.clientSearch = async (req, res) => {
  try {
    const query = req.query.query;
    const clients = await Client.find({ name: { $regex: query, $options: 'i' } });
    logger.info(`Clients search results for query: ${query}`);
    res.status(200).json({ success: true, data: clients });
  } catch (error) {
    logger.error(`Error searching clients: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error searching clients', error: error.message });
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
    const data = req.body;
    delete data._csrf;  // Remove _csrf before validation

    const { error } = clientSchema.validate(data);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const updatedClient = await Client.findByIdAndUpdate(req.params.id, data, { new: true });
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
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    logger.info(`Client deleted successfully: ${client.name}`);
    res.status(200).json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    handleError(res, error, `Error deleting client with ID ${req.params.id}`);
  }
};

// Add Note to Client
exports.addNote = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    const note = { id: uuidv4(), text: req.body.note };
    if (!note.text) {
      return res.status(400).json({ success: false, message: 'Note text is required' });
    }
    client.notes.push(note);
    await client.save();
    res.status(200).json({ success: true, message: 'Note added successfully', note });
  } catch (error) {
    handleError(res, error, `Error adding note to client with ID ${req.params.id}`);
  }
};

// Update Note
exports.updateNote = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const note = client.notes.find(note => note.id === req.params.noteId);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    note.text = req.body.note;
    await client.save();

    res.status(200).json({ success: true, message: 'Note updated successfully', note });
  } catch (error) {
    handleError(res, error, `Error updating note for client with ID ${req.params.id}`);
  }
};

// Delete Note
exports.deleteNote = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    const noteIndex = client.notes.findIndex(note => note.id === req.params.noteId);
    if (noteIndex === -1) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    client.notes.splice(noteIndex, 1);
    await client.save();

    res.status(200).json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    handleError(res, error, `Error deleting note for client with ID ${req.params.id}`);
  }
};

// Middleware to fetch client by ID
exports.getClient = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).render('error', { message: 'Client not found.' });
    }
    req.client = client;
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).render('error', { message: 'Failed to fetch client. Please try again later.' });
  }
};
