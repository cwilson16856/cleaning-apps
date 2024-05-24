const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceId: { type: String, required: true, unique: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  dateIssued: { type: Date, default: Date.now },
  dueDate: Date,
  items: [{
    description: String,
    quantity: Number,
    price: Number,
  }],
  total: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Overdue'],
    default: 'Pending',
  },
});

invoiceSchema.pre('save', async function(next) {
  console.log(`Attempting to save invoice with ID: ${this.invoiceId}`);
  next();
});

invoiceSchema.post('save', async function(doc, next) {
  console.log(`Invoice ${doc.invoiceId} successfully saved to database`);
  next();
});

invoiceSchema.pre('remove', async function(next) {
  console.log(`Attempting to remove invoice with ID: ${this.invoiceId}`);
  next();
});

invoiceSchema.post('remove', async function(doc, next) {
  console.log(`Invoice ${doc.invoiceId} successfully removed from database`);
  next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;