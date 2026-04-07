const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');

// GET /api/search?q=rapokki&lat=28.7041&lng=77.1025
router.get('/', searchController.searchDishes);

module.exports = router;
