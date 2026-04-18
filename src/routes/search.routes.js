const express = require('express');
const router  = express.Router();
const searchController = require('../controllers/search.controller');

// GET /api/search?q=biryani&lat=28.7041&lng=77.1025
router.get('/', searchController.searchDishes);

// GET /api/restaurant?name=Bukhara&lat=28.7041&lng=77.1025
router.get('/restaurant', searchController.getRestaurantDishes);

module.exports = router;
