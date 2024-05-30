const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  businessName: { type: String },
  businessLogo: { type: String }, // Add this line to include the businessLogo field
  name: { type: String },
  phoneNumber: { type: String },
  email: { type: String },
  streetAddress: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  hoursOfOperation: {
    monday: {
      from: { type: String },
      to: { type: String }
    },
    tuesday: {
      from: { type: String },
      to: { type: String }
    },
    wednesday: {
      from: { type: String },
      to: { type: String }
    },
    thursday: {
      from: { type: String },
      to: { type: String }
    },
    friday: {
      from: { type: String },
      to: { type: String }
    },
    saturday: {
      from: { type: String },
      to: { type: String }
    },
    sunday: {
      from: { type: String },
      to: { type: String }
    }
  },
  websiteURL: { type: String },
  socialMediaLinks: { type: String }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = function(candidatePassword, callback) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    if (err) return callback(err);
    callback(null, isMatch);
  });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
