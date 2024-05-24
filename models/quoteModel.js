const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // for generating unique quote IDs

const itemSchema = new mongoose.Schema({
  description: String,
  quantity: Number,
  price: Number,
  isService: Boolean, // true for service, false for product
}, { _id: false }); // Prevents Mongoose from creating an _id for sub-documents

const quoteSchema = new mongoose.Schema({
  quoteId: { type: String, default: uuidv4 },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  title: String,
  scopeOfWork: String,
  status: {
    type: String,
    enum: ['sent', 'opened', 'clicked'],
    default: 'sent'
  },
  serviceType: {
    type: String,
    required: true,
    enum: ['Recurring', 'One-Time Deep Clean', 'Move In/Move Out']
  },
  frequency: {
    type: String,
    enum: ['Weekly', 'Bi-Weekly', 'Monthly'],
    default: null // Set to null as it's optional and dependent on serviceType being 'Recurring'
  },
  initialCleaningOptions: [{
    type: String,
    enum: ['Walls', 'Windows', 'Inside Fridge', 'Inside Stove', 'Underneath Furniture', 'Other']
  }],
  items: [itemSchema]
});

quoteSchema.pre('save', async function(next) {
  try {
    console.log(`Saving quote with ID: ${this.quoteId}`);
    next();
  } catch (error) {
    console.error(`Error saving quote: ${error.message}`, error);
    next(error);
  }
});

quoteSchema.post('save', async function(doc, next) {
  try {
    console.log(`Quote ${doc.quoteId} saved to database`);
    next();
  } catch (error) {
    console.error(`Error after saving quote: ${error.message}`, error);
    next(error);
  }
});

const Quote = mongoose.model('Quote', quoteSchema);

module.exports = Quote;
