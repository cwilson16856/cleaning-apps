const mongoose = require('mongoose');

const serviceItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: false },
  category: { type: String, required: false, enum: ['Standard', 'Extras', 'Package', 'Service'] },
  units: { type: String, required: true, enum: ['Per Item', 'Per Hour'] },
  price: { type: Number, required: true },
});

// Creating indexes for 'name' and 'category' for efficient querying
serviceItemSchema.index({ name: 1, category: 1 }, { unique: true });

serviceItemSchema.pre('save', async function(next) {
  console.log(`Saving item: ${this.name}`);
  next();
});

serviceItemSchema.post('save', function(doc, next) {
  console.log(`Item ${doc.name} saved to database`);
  next();
});

serviceItemSchema.post('remove', function(doc, next) {
  console.log(`Item ${doc.name} removed from database`);
  next();
});

const ServiceItem = mongoose.model('ServiceItem', serviceItemSchema);

module.exports = ServiceItem;