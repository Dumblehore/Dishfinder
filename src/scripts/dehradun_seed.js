const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Dish = require('../models/Dish');

// Pull environment variables from the root .env file
dotenv.config({ path: __dirname + '/../../.env' });

// We start with some iconic Dehradun spots, focusing heavily on Rajpur Road and Mussoorie Diversion (near DIT Univ)
const dehradunDishes = [
    {
        dish_name: 'Chicken Steamed Momos',
        normalized_name: 'chicken steamed momos',
        synonyms: ['momo', 'chicken momo', 'dimsum', 'dumplings'],
        restaurant_name: 'Kalsang', // Iconic Tibetan Place on Rajpur Road
        price: 180,
        rating: 4.8,
        latitude: 30.3424,
        longitude: 78.0671, // Rajpur Road coord approximation
        is_rare: false
    },
    {
        dish_name: 'Vegetable Khow Suey',
        normalized_name: 'vegetable khow suey',
        synonyms: ['khao suey', 'khao soi', 'burmese noodles', 'coconut noodle soup'],
        restaurant_name: 'The Orchard', // Famous for this on Rajpur Road
        price: 350,
        rating: 4.9,
        latitude: 30.3800,
        longitude: 78.0837,
        is_rare: true // Highly sought after inside Dehradun
    },
    {
        dish_name: 'Cheese Maggi',
        normalized_name: 'cheese maggi',
        synonyms: ['maggi noodles', 'cheese noodles'],
        restaurant_name: 'Mussoorie Diversion Maggi Point', // A classic hangout spot near DIT
        price: 80,
        rating: 4.5,
        latitude: 30.3951,
        longitude: 78.0831,
        is_rare: false
    },
    {
        dish_name: 'Stick Jaws (Toffee)',
        normalized_name: 'stick jaws toffee',
        synonyms: ['stick jaw', 'butter toffee', 'candy', 'elloras'],
        restaurant_name: 'Ellora\'s Melting Moments', // Most famous bakery in Dehradun
        price: 250,
        rating: 4.9,
        latitude: 30.3292,
        longitude: 78.0531,
        is_rare: true
    },
    {
        dish_name: 'Wood Fired Pepperoni Pizza',
        normalized_name: 'wood fired pepperoni pizza',
        synonyms: ['pizza', 'pepperoni', 'doshko'],
        restaurant_name: 'Dozkho',
        price: 450,
        rating: 4.6,
        latitude: 30.3644,
        longitude: 78.0772,
        is_rare: false
    },
    {
        dish_name: 'Cold Coffee with Ice Cream',
        normalized_name: 'cold coffee with ice cream',
        synonyms: ['cold coffee', 'frappe'],
        restaurant_name: 'First Gear Cafe', // Great view near Mussoorie road
        price: 150,
        rating: 4.7,
        latitude: 30.3920,
        longitude: 78.0844,
        is_rare: false
    },
    {
        dish_name: 'Chilli Garlic Noodles',
        normalized_name: 'chilli garlic noodles',
        synonyms: ['noodles', 'chowmein', 'spicy noodles'],
        restaurant_name: 'Bikanerwala (Rajpur Road)', // Reliable staple
        price: 220,
        rating: 4.2,
        latitude: 30.3421,
        longitude: 78.0678,
        is_rare: false
    },
    {
        dish_name: 'Cheese momos',
        normalized_name: 'Cheese momos',
        synonyms: ['momo', 'momos', 'dumplings'],
        restaurant_name: 'Tibet kitchen',
        price: 190,
        rating: 4.8,
        latitude: 30.397517078480487,    // Just grab coordinates from Google Maps!
        longitude: 78.07746282302152,
        is_rare: true
    },
];
const seedDehradun = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔗 Connected to MongoDB Atlas for Dehradun Injection...');

        // Convert the flat data to GeoJSON for MongoDB
        const geoJsonDishes = dehradunDishes.map(dish => ({
            dish_name: dish.dish_name,
            normalized_name: dish.normalized_name,
            synonyms: dish.synonyms,
            restaurant_name: dish.restaurant_name,
            price: dish.price,
            rating: dish.rating,
            is_rare: dish.is_rare,
            location: {
                type: 'Point',
                coordinates: [dish.longitude, dish.latitude] // Note: GeoJSON is [lng, lat]
            }
        }));

        // To prevent duplicates, we clear the database first before re-seeding!
        await Dish.deleteMany({});
        console.log('🗑️ Deleted old duplicate data.');

        await Dish.insertMany(geoJsonDishes);
        console.log(`✅ Success! Injected ${geoJsonDishes.length} authentic Dehradun dishes into the live database.`);

        process.exit();
    } catch (error) {
        console.error('❌ Error injecting Dehradun data:', error);
        process.exit(1);
    }
};

seedDehradun();
