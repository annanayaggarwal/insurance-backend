const express = require('express');
const router = express.Router();
const Query = require('../models/Query');
const auth = require('../middleware/authMiddleware');

// Create a new query
router.post('/', async (req, res) => {
  try {
    const newQuery = new Query(req.body);
    await newQuery.save();
    res.status(201).json(newQuery);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all queries (protected route for admin)
router.get('/', auth, async (req, res) => {
  try {
    const queries = await Query.find().sort({ createdAt: -1 });
    res.json(queries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;