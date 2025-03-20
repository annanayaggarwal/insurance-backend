// models/Booking.js
const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true 
  },
  phone: { 
    type: String, 
    required: true 
  },
  numberOfPeople: { 
    type: Number,
    // min: 1
  },
  selectedPackage: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Package',
    required: true 
  },
  message: { 
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);