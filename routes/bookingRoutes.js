const express = require('express');
const router = express.Router();
const Booking = require('../models/BookNow');
const Package = require('../models/Package');
const auth = require('../middleware/authMiddleware');
const nodemailer = require('nodemailer');

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'aggarwalannanay@gmail.com',
    pass: process.env.EMAIL_PASS || 'uzfv bklt srbn zxpq'
  }
});

// Get all bookings (admin only)
router.get('/', auth, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('selectedPackage', 'title type')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new booking
router.post('/', async (req, res) => {
  try {
    // Validate package exists only if provided
    let package;
    if (req.body.selectedPackage) {
      package = await Package.findById(req.body.selectedPackage);
      if (!package) {
        return res.status(404).json({ message: 'Selected package not found' });
      }
    }

    // Create booking
    const booking = new Booking({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      numberOfPeople: req.body.numberOfPeople || 1, // Default to 1 if not provided
      selectedPackage: req.body.selectedPackage || null, // Allow null if not provided
      message: req.body.message
    });

    const newBooking = await booking.save();

    // Send confirmation email to customer
    const customerMailOptions = {
      from: process.env.EMAIL_USER,
      to: booking.email,
      subject: 'Enquiry Confirmation - Insurance Rivers',
      html: `
        <h2>Thank you for your Enquiry!</h2>
        <p>Dear ${booking.name},</p>
        <p>We have received your request${package ? ` for the following package: <strong>${package.title}</strong>` : '.'}</p>
        <p>We will contact you shortly to discuss your insurance query.</p>
        <p>Best regards,<br>Insurance Rivers Team</p>
      `
    };

    // Send notification email to admin
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || 'helpdesk@insurancerivers.in',
      subject: 'New Enquiry Received',
      html: `
        <h2>New Enquiry Request</h2>
        ${package ? `<p><strong>Package:</strong> ${package.title}</p>` : ''}
        <p><strong>Customer Name:</strong> ${booking.name}</p>
        <p><strong>Email:</strong> ${booking.email}</p>
        <p><strong>Phone:</strong> ${booking.phone}</p>
        <p><strong>Message:</strong> ${booking.message || 'No message provided'}</p>
      `
    };

    // Send emails
    try {
      await transporter.sendMail(customerMailOptions);
      await transporter.sendMail(adminMailOptions);
    } catch (emailErr) {
      console.error('Error sending emails:', emailErr);
    }

    res.status(201).json(newBooking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update booking status (admin only)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('selectedPackage', 'title');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = status;
    const updatedBooking = await booking.save();

    // Send status update email to customer
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: booking.email,
      subject: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)} - Chardham Travel`,
      html: `
        <h2>Booking Status Update</h2>
        <p>Dear ${booking.name},</p>
        <p>Your booking for ${booking.selectedPackage.title} has been ${status}.</p>
        <p><strong>Number of People:</strong> ${booking.numberOfPeople}</p>
        ${status === 'confirmed' ? '<p>We will contact you with further details soon.</p>' : ''}
        ${status === 'cancelled' ? '<p>If you have any questions, please contact us.</p>' : ''}
        <p>Best regards,<br>Chardham Travel Team</p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (emailErr) {
      console.error('Error sending status update email:', emailErr);
    }

    res.json(updatedBooking);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get booking by ID (admin only)
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('selectedPackage', 'title type');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete booking (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;