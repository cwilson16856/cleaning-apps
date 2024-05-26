const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const log = (message) => console.log(`[CRM Integration] ${message}`);
const logError = (error, message) => console.error(`[CRM Integration] ${message}`, error.message, error.stack);

const validateEnvVars = () => {
  const requiredVars = ['CRM_API_URL', 'CRM_API_KEY'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables for CRM integration: ${missingVars.join(', ')}`);
  }
};

const sendClientDataToCRM = async (clientData) => {
  try {
    validateEnvVars();
    const response = await axios.post(`${process.env.CRM_API_URL}/clients`, clientData, {
      headers: {
        'Authorization': `Bearer ${process.env.CRM_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    log(`Client data sent to CRM successfully. Client ID: ${response.data.id}`);
  } catch (error) {
    logError(error, 'Failed to send client data to CRM.');
    console.error(`Error details: ${error.message}\n${error.stack}`);
    throw error;
  }
};

const sendQuoteDataToCRM = async (quoteData) => {
  try {
    validateEnvVars();
    const response = await axios.post(`${process.env.CRM_API_URL}/quotes`, quoteData, {
      headers: {
        'Authorization': `Bearer ${process.env.CRM_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    log(`Quote data sent to CRM successfully. Quote ID: ${response.data.id}`);
  } catch (error) {
    logError(error, 'Failed to send quote data to CRM.');
    console.error(`Error details: ${error.message}\n${error.stack}`);
    throw error;
  }
};

module.exports = {
  sendClientDataToCRM,
  sendQuoteDataToCRM,
};