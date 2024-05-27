const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  clientId: { type: String, required: true, unique: true },
  companyName: { type: String, required: false },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: false },
  streetAddress: { type: String, required: false },
  city: { type: String, required: false },
  state: { type: String, required: false },
  zip: { type: String, required: false }
});

clientSchema.pre('save', function(next) {
  if (!this.isNew) {
    console.log('Updating existing client');
  } else {
    console.log('Creating a new client');
  }
  next();
});

clientSchema.post('save', function(doc, next) {
  console.log(`Client ${doc.name} saved to database`);
  next();
});

clientSchema.post('remove', function(doc, next) {
  console.log(`Client ${doc.name} removed from database`);
  next();
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;