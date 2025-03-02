const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  shortdescription:{type: String, required: true },
  description: { type: String, required: true },
  duration: { type: String },
  price: { type: Number },
  image: { type: String, required: true },
  itinerary: { 
    type: String
  },
  type: {
    type: String,
    enum: ['Insurance', 'Renewal'],
    required: true,
    default: 'chardham'
  }
});

module.exports = mongoose.model('Package', PackageSchema);