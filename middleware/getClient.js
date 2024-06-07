const Client = require('../models/clientModel');

const getClient = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    req.client = client;
    next();
  } catch (error) {
    console.error(`Error fetching client: ${error.message}`);
    res.status(500).json({ success: false, message: 'Error fetching client', error: error.message });
  }
};

module.exports = getClient;
