const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const csv = require('csv-parser');
const Dish = require('../models/Dish');

// Connect to environment variables
dotenv.config({ path: __dirname + '/../../.env' });

const seedKaggleData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔗 Connected to MongoDB Atlas for Kaggle Injection...');

        // Wipe the old data so we don't have conflicting mock data
        await Dish.deleteMany({});
        console.log('🗑️ Wiped old mock data to make room for massive Kaggle payload...');

        const dishesToInsert = [];
        // Keep a global track of what we added to prevent duplicates across the entire dataset!
        const addedDishes = new Set();

        // Read the CSV Stream
        fs.createReadStream(__dirname + '/../data/dehradun.csv')
            .pipe(csv())
            .on('data', (row) => {
                // Skip rows with bad GPS coordinates
                if (!row.latitude || !row.longitude || row.latitude === '0.0' || row.longitude === '0.0') return;

                const cuisineToDishMap = {
                    'momos': ['Chicken Steamed Momos', 'Vegetable Fried Momos', 'Kurkure Momos'],
                    'pizza': ['Margherita Wood Fired Pizza', 'Pepperoni Pizza', 'Farmhouse Pizza'],
                    'chinese': ['Chilli Garlic Noodles', 'Veg Manchurian Gravy', 'Chicken Fried Rice'],
                    'tibetan': ['Chicken Thukpa', 'Pork Tingmo', 'Vegetable Khow Suey'],
                    'fast food': ['Aloo Tikki Burger', 'Cheesy Loaded Fries', 'Cold Coffee'],
                    'north indian': ['Butter Chicken', 'Dal Makhani', 'Paneer Tikka Masala'],
                    'desserts': ['Chocolate Lava Cake', 'Red Velvet Pastry', 'Hot Brownie with Ice Cream'],
                    'street food': ['Pani Puri', 'Aloo Chaat', 'Vada Pav']
                };

                const cuisines = row.cuisines ? row.cuisines.toLowerCase().split(',') : ['fast food'];

                cuisines.forEach(cuisine => {
                    const cleanName = cuisine.trim();
                    
                    const specificDishes = cuisineToDishMap[cleanName] || [cuisine.trim().charAt(0).toUpperCase() + cuisine.trim().slice(1)];

                    specificDishes.forEach((specificDish) => {
                        // Create a unique global key specifically for this restaurant and dish
                        const uniqueKey = `${row.name.trim()}-${specificDish}`;
                        if (addedDishes.has(uniqueKey)) return; 
                        addedDishes.add(uniqueKey);

                        // Give a realistic price variation (e.g. Kurkure momos cost more than Steamed)
                        const priceVariance = Math.floor(Math.random() * 50) + 10;
                        const approximatePrice = Math.max(80, Math.round((parseInt(row.average_cost_for_two) || 300) / 2)) + priceVariance;

                        dishesToInsert.push({
                            dish_name: specificDish,
                            normalized_name: specificDish.toLowerCase(),
                            synonyms: [cleanName, 'food', specificDish.split(' ')[0].toLowerCase()],
                            restaurant_name: row.name.trim(),
                            price: approximatePrice,
                            rating: parseFloat(row.aggregate_rating) || 0,
                            is_rare: Math.random() > 0.8, // 20% chance of being rare
                            location: {
                                type: 'Point',
                                coordinates: [parseFloat(row.longitude), parseFloat(row.latitude)] 
                            }
                        });
                    });
                });
            })
            .on('end', async () => {
                console.log(`📊 Processing complete. Found ${dishesToInsert.length} searchable items.`);
                try {
                    // Mongoose handles batch inserting very efficiently
                    await Dish.insertMany(dishesToInsert);
                    console.log(`✅ Success! Injected ${dishesToInsert.length} Real-World Dishes into Live Database!`);
                    process.exit();
                } catch (insertError) {
                    console.error('❌ Insertion Error:', insertError);
                    process.exit(1);
                }
            });

    } catch (error) {
        console.error('❌ Database connection error:', error);
        process.exit(1);
    }
};

seedKaggleData();
