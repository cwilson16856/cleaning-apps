const Client = require('../models/clientModel');

const getClient = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    req.client = client; // Attach client to the request object
    next();
  } catch (error) {
    console.error(`Error fetching client with ID ${req.params.id}: ${error.message}`, error);
    res.status(500).json({ message: 'Failed to fetch client', error: error.message });
  }
};

module.exports = getClient;
