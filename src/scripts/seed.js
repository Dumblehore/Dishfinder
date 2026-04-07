require('dotenv').config();
const mongoose = require('mongoose');
const mongooseConnect = require('../config/db');
const Dish = require('../models/Dish');

const dummyDishes = [
    {
        dish_name: "Chicken Momos",
        normalized_name: "chicken momos",
        synonyms: ["momos", "dimsum", "chicken dumplings"],
        restaurant_name: "Himalayan Kitchen",
        price: 150,
        rating: 4.5,
        location: {
            type: "Point",
            coordinates: [77.2090, 28.6139] // New Delhi coordinates [lng, lat]
        }
    },
    {
        dish_name: "Rapokki",
        normalized_name: "rapokki",
        synonyms: ["rabokki", "tteokbokki", "korean rice cakes"],
        restaurant_name: "Seoul Restaurant",
        price: 450,
        rating: 4.8,
        location: {
            type: "Point",
            coordinates: [77.1988, 28.5456] // Hauz Khas approx
        }
    },
    {
        dish_name: "Veg Momos",
        normalized_name: "veg momos",
        synonyms: ["momos", "dimsum", "vegetable dumplings"],
        restaurant_name: "Momo King",
        price: 100,
        rating: 4.2,
        location: {
            type: "Point",
            coordinates: [77.2155, 28.6328] // Connaught Place approx
        }
    },
    {
        dish_name: "Chicken Tikka Masala",
        normalized_name: "chicken tikka masala",
        synonyms: ["murgh tikka masala", "butter chicken"],
        restaurant_name: "Punjabi Dhaba",
        price: 350,
        rating: 4.3,
        location: {
            type: "Point",
            coordinates: [77.2201, 28.6143] // India Gate area
        }
    }
];

const seedData = async () => {
    try {
        await mongooseConnect();
        
        // Clear existing data
        await Dish.deleteMany();
        console.log("Cleared existing dishes.");

        // Insert new dummy data
        await Dish.insertMany(dummyDishes);
        console.log("Dummy data inserted successfully!");

        process.exit();
    } catch (error) {
        console.error("Error seeding data:", error);
        process.exit(1);
    }
};

seedData();
