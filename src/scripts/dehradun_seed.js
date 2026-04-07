const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Dish = require('../models/Dish');

// Pull environment variables from the root .env file
dotenv.config({ path: __dirname + '/../../.env' });

const RESTAURANT_LOCATIONS = require('../data/custom_restaurants');
const pahadiHouseDishes = require('../data/pahadi_house');

// 🍔 ADD DISHES EXTREMELY QUICKLY HERE
// Just type the dish, and type the matching exact restaurant name!
const dehradunDishes = [
    {
        dish_name: 'Cheese momos',
        normalized_name: 'cheese momos',
        synonyms: ['momo', 'momos', 'dumplings'],
        restaurant_name: 'Tibet Kitchen', 
        price: 190,
        is_rare: true
    }
];

// Combine your typed array with the AI generated arrays!
const allCustomDishes = [...dehradunDishes, ...pahadiHouseDishes];

const seedDehradun = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔗 Connected to MongoDB Atlas for Custom Injection...');

        // Convert the flat easy-to-read data to the massive GeoJSON requirement for MongoDB
        const geoJsonDishes = allCustomDishes.map(dish => {
            // Find the location data intelligently
            const locationData = RESTAURANT_LOCATIONS[dish.restaurant_name];
            
            if (!locationData) {
                console.error(`❌ ERROR: You forgot to add "${dish.restaurant_name}" to your custom_restaurants.js file!`);
                process.exit(1);
            }

            return {
                dish_name: dish.dish_name,
                normalized_name: dish.dish_name.toLowerCase(),
                synonyms: dish.synonyms,
                restaurant_name: dish.restaurant_name,
                price: dish.price,
                rating: locationData.rating,
                is_rare: dish.is_rare,
                location: {
                    type: 'Point',
                    coordinates: [locationData.longitude, locationData.latitude] // Note: GeoJSON is [lng, lat]
                }
            };
        });

        // To append instead of completely wiping the massive Kaggle dataset:
        // (We removed the deleteMany line here)
        console.log('➕ Appending custom favorites to the database...');

        await Dish.insertMany(geoJsonDishes);
        console.log(`✅ Success! Injected ${geoJsonDishes.length} authentic Dehradun dishes into the live database.`);

        process.exit();
    } catch (error) {
        console.error('❌ Error injecting Dehradun data:', error);
        process.exit(1);
    }
};

seedDehradun();
