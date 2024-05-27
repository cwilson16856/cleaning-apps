const Client = require('../models/clientModel');
const { v4: uuidv4 } = require('uuid');


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
      res.status(201).json({
        success: true,
        data: newClient
      });
    } catch (error) {
      console.error(`Error creating new client: ${error.message}`, error);
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
      res.status(200).json(clients);
    } catch (error) {
      console.error(`Error searching clients: ${error.message}`, error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
