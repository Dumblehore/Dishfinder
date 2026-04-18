const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Dish = require('../models/Dish');

// Pull environment variables from the root .env file
dotenv.config({ path: __dirname + '/../../.env' });

const RESTAURANT_LOCATIONS = require('../data/custom_restaurants');
const { loadDishMenuCsv } = require('./loadDishMenuCsv');

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

// Combine typed dishes + dish-level menu CSV (see src/data/pahadi_house_dishes.csv)
const allCustomDishes = [...dehradunDishes, ...loadDishMenuCsv('pahadi_house_dishes.csv')];

const seedDehradun = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔗 Connected to MongoDB Atlas for Custom Injection...');

        // Convert the flat easy-to-read data to the massive GeoJSON requirement for MongoDB
        const geoJsonDishes = allCustomDishes.map(dish => {
            let latitude;
            let longitude;
            let rating;
            if (dish.latitude != null && dish.longitude != null) {
                latitude = dish.latitude;
                longitude = dish.longitude;
                rating = dish.rating != null ? dish.rating : 4.5;
            } else {
                const locationData = RESTAURANT_LOCATIONS[dish.restaurant_name];
                if (!locationData) {
                    console.error(`❌ ERROR: Add "${dish.restaurant_name}" to custom_restaurants.js or put lat/lng on the CSV row.`);
                    process.exit(1);
                }
                latitude = locationData.latitude;
                longitude = locationData.longitude;
                rating = locationData.rating;
            }

            return {
                dish_name: dish.dish_name,
                normalized_name: dish.dish_name.toLowerCase(),
                synonyms: dish.synonyms,
                restaurant_name: dish.restaurant_name,
                price: dish.price,
                rating,
                is_rare: dish.is_rare,
                location: {
                    type: 'Point',
                    coordinates: [longitude, latitude],
                },
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
