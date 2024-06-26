const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // for generating unique quote IDs

const itemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  isService: { type: Boolean, required: true }, // true for service, false for product
}, { _id: false }); // Prevents Mongoose from creating an _id for sub-documents

// New Schema for Service Items in a Quote
const serviceItemSchema = new mongoose.Schema({
  serviceItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceItem', required: true },
  quantity: { type: Number, required: true, min: 1 },
  customPrice: { type: Number, min: 0 }, // optional, if the user wants to override the price
}, { _id: false }); // Prevents Mongoose from creating an _id for sub-documents

const attachmentSchema = new mongoose.Schema({
  savedFilename: { type: String, required: true },
  originalFilename: { type: String, required: true }
}, { _id: false }); // Prevents Mongoose from creating an _id for sub-documents

const quoteSchema = new mongoose.Schema({
  quoteId: { type: String, default: uuidv4 },
  clientName: { type: String, required: true },
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
    default: null
  },
  initialCleaningOptions: [{
    type: String,
    enum: ['Walls', 'Windows', 'Inside Fridge', 'Inside Stove', 'Underneath Furniture', 'Other']
  }],
  serviceItems: [serviceItemSchema],
  attachments: [attachmentSchema],
  contracts: [attachmentSchema],
  subtotal: { type: Number, default: 0 },
  taxRate: { type: Number, default: 7.5 },
  total: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0, min: 0 },
  priceBreakdown: mongoose.Schema.Types.Mixed
});

quoteSchema.pre('save', async function (next) {
  try {
    console.log(`Saving quote with ID: ${this.quoteId}`);
    next();
  } catch (error) {
    console.error(`Error saving quote: ${error.message}`, error);
    next(error);
  }
});

quoteSchema.post('save', async function (doc, next) {
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