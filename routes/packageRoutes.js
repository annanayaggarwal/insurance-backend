const express = require('express');
const router = express.Router();
const Package = require('../models/Package');
const auth = require('../middleware/authMiddleware');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: "ddokjc1cc",
  api_key: "185899729956947",
  api_secret: "NdloNDoEwmeVTqhuzwxHP9YsLmw"
});

// Configure multer for Cloudinary upload
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'itineraries',
    allowed_formats: ['pdf'],
    resource_type: 'raw', // Important for PDFs
    format: 'pdf', // Explicitly specify PDF format
    public_id: (req, file) => {
      // Create a unique filename without extension
      return `itinerary-${Date.now()}-${file.originalname.split('.')[0]}`
    }
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

// Get all packages
router.get('/', async (req, res) => {
  try {
    const packages = await Package.find();
    res.json(packages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get packages for header dropdown
router.get('/header', async (req, res) => {
  try {
    // Initially get all packages
    const allPackages = await Package.find().select('title _id type shortdescription image');
    
    // Separate packages into categories
    const response = {
      Insurance: allPackages.filter(pkg => pkg.type === 'Insurance'),
      Renewal: allPackages.filter(pkg => pkg.type === 'Renewal')
    };
    
    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new package
router.post('/', upload.single('itinerary'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Itinerary PDF is required' });
    }

    // Ensure the URL ends with .pdf
    const pdfUrl = req.file.path;

    const package = new Package({
      title: req.body.title,
      shortdescription: req.body.shortdescription,
      description: req.body.description,
      duration: req.body.duration,
      price: req.body.price,
      image: req.body.image,
      itinerary: pdfUrl,
      type: req.body.type
    });

    const newPackage = await package.save();
    res.status(201).json(newPackage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a package
router.put('/:id', auth, upload.single('itinerary'), async (req, res) => {
  try {
    const package = await Package.findById(req.params.id);
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }

    // If a new file is uploaded, delete the old one from Cloudinary
    if (req.file) {
      if (package.itinerary) {
        const publicId = package.itinerary.split('/').slice(-1)[0].split('.')[0];
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
      }
      // Ensure the URL ends with .pdf
      const pdfUrl = req.file.path.includes('.pdf') 
        ? req.file.path 
        : `${req.file.path}.pdf`;
      package.itinerary = pdfUrl;
    }

    // Update other fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'itinerary') { // Prevent overwriting the itinerary URL
        package[key] = req.body[key];
      }
    });

    const updatedPackage = await package.save();
    res.json(updatedPackage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a package
router.delete('/:id', auth, async (req, res) => {
  try {
    const package = await Package.findById(req.params.id);
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }

    // Delete the file from Cloudinary if it exists
    if (package.itinerary) {
      const publicId = package.itinerary.split('/').slice(-1)[0].split('.')[0];
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    }

    await Package.findByIdAndDelete(req.params.id);
    res.json({ message: 'Package deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single package
router.get('/:id', async (req, res) => {
  try {
    const package = await Package.findById(req.params.id);
    if (!package) {
      return res.status(404).json({ message: 'Package not found' });
    }
    res.json(package);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;