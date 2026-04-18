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

        // Dynamically find all CSVs in the data folder
        const csvFiles = fs.readdirSync(__dirname + '/../data/').filter(f => f.endsWith('.csv'));
        console.log(`📂 Found ${csvFiles.length} CSV datasets! Preparing Universal Multiplexer...`);

        // Keep a global track of what we added to prevent duplicates across the entire dataset!
        const addedDishes = new Set();
        let totalInserted = 0;

        for (const file of csvFiles) {
            console.log(`\n⏳ Processing Dataset: ${file}...`);
            const dishesToInsert = [];
            
            await new Promise((resolve, reject) => {
                fs.createReadStream(__dirname + '/../data/' + file)
                    .pipe(csv({
                        mapHeaders: ({ header }) => {
                            const h = header.trim();
                            const hl = h.toLowerCase();
                            if (h === 'Restaurant_Name' || hl === 'restaurant name' || hl === 'restaurant_name' || hl === 'name') return 'name';
                            if (h === 'Category' || hl === 'cuisines') return 'cuisines';
                            if (h === 'Pricing_for_2' || hl === 'average cost for two' || hl === 'average_cost_for_two') return 'average_cost_for_two';
                            if (h === 'Dining_Rating' || hl === 'aggregate rating' || hl === 'aggregate_rating') return 'aggregate_rating';
                            if (h === 'Known_For2' || hl === 'known_for2') return 'known_for2';
                            if (h === 'Locality' || hl === 'locality') return 'locality';
                            if (h === 'Country Code' || hl === 'country_code') return 'country_code';
                            return hl;
                        }
                    }))
                    .on('data', (row) => {
                        // Skip rows with bad GPS coordinates
                        if (!row.latitude || !row.longitude || row.latitude === '0.0' || row.longitude === '0.0') return;

                        // ── DIRECT INJECTION PATH FOR PRE-FORMATTED CSVs ──
                        // If the CSV is already broken down into literal dishes (like Pahadi House),
                        // bypass all generational algorithms and inject the pure unadulterated payload.
                        if (row.dish_name && row.price) {
                            const uniqueKey = `${row.name.trim()}-${row.dish_name.trim()}`;
                            if (addedDishes.has(uniqueKey)) return; 
                            addedDishes.add(uniqueKey);

                            const baseSynonyms = row.synonyms ? row.synonyms.split('|') : ['food', row.dish_name.split(' ')[0].toLowerCase()];
                            if (row.category) {
                                // Rip the category apart (e.g., "Pan - Asian Plates") and push each word into the search index
                                const catWords = row.category.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2);
                                baseSynonyms.push(...catWords);
                            }

                            dishesToInsert.push({
                                dish_name: row.dish_name.trim(),
                                normalized_name: row.dish_name.trim().toLowerCase(),
                                synonyms: [...new Set(baseSynonyms)],
                                restaurant_name: row.name.trim(),
                                price: parseInt(row.price) || 200,
                                rating: parseFloat(row.rating) || 4.5,
                                is_rare: row.is_rare === 'true',
                                location: {
                                    type: 'Point',
                                    coordinates: [parseFloat(row.longitude), parseFloat(row.latitude)] 
                                }
                            });
                            return; // Halt logic and move to next row
                        }
                        // ──────────────────────────────────────────────────

                        // Geofencing: If country code exists, strictly ensure it's computationally mapped to India (1)
                        if (row.country_code && row.country_code !== '1') return;

                        // Quality Filter: Strictly import restaurants with a decent rating
                        const rating = parseFloat(row.aggregate_rating) || 0;
                        if (rating !== 0 && rating < 3.5) return;

                        const cuisineToDishMap = {
                            'momos': ['Chicken Steamed Momos', 'Vegetable Fried Momos', 'Kurkure Momos'],
                            'pizza': ['Margherita Wood Fired Pizza', 'Pepperoni Pizza', 'Farmhouse Pizza'],
                            'chinese': ['Chilli Garlic Noodles', 'Veg Manchurian Gravy', 'Chicken Fried Rice'],
                            'tibetan': ['Chicken Thukpa', 'Pork Tingmo'],
                            'fast food': ['Aloo Tikki Burger', 'Cheesy Loaded Fries', 'Cold Coffee'],
                            'north indian': ['Butter Chicken', 'Dal Makhani', 'Paneer Tikka Masala', 'Garlic Naan', 'Tandoori Roti'],
                            'south indian': ['Masala Dosa', 'Idli Sambar', 'Medu Vada', 'Rava Dosa'],
                            'desserts': ['Chocolate Lava Cake', 'Red Velvet Pastry', 'Hot Brownie'],
                            'street food': ['Pani Puri', 'Aloo Chaat', 'Vada Pav', 'Pav Bhaji'],
                            'beverages': ['Cold Coffee', 'Masala Chai', 'Mango Shake', 'Lassi'],
                            'biryani': ['Chicken Dum Biryani', 'Mutton Biryani', 'Veg Biryani'],
                            'bakery': ['Black Forest Cake', 'Chocolate Truffle', 'Pineapple Pastry'],
                            'cafe': ['Cappuccino', 'Cafe Latte', 'Garlic Bread', 'White Sauce Pasta'],
                            'continental': ['Grilled Chicken Breast', 'Fish and Chips', 'Mushroom Risotto'],
                            'healthy food': ['Quinoa Salad', 'Oatmeal Bowl', 'Detox Juice']
                        };

                        let specificDishes = [];
                        // 1. Primary Generation: Extract real signature dishes documented in Known_For2
                        if (row.known_for2 && row.known_for2.trim() !== '') {
                            specificDishes = row.known_for2.split(',').map(d => d.trim()).filter(d => d.length > 0);
                        } 
                        
                        // 2. Fallback Generation: Reverse guess from tag if no signatures found
                        if (specificDishes.length === 0) {
                            const cuisines = row.cuisines ? row.cuisines.toLowerCase().split(',') : ['fast food'];
                            cuisines.forEach(cuisine => {
                                const cleanName = cuisine.trim();
                                const defaultDishes = cuisineToDishMap[cleanName] || [cuisine.trim().charAt(0).toUpperCase() + cuisine.trim().slice(1)];
                                specificDishes.push(...defaultDishes);
                            });
                        }

                        // De-duplicate
                        specificDishes = [...new Set(specificDishes)];
                        const locality = row.locality ? row.locality.trim() : '';

                        specificDishes.forEach((specificDish) => {
                            // Create a unique global key specifically for this restaurant and dish
                            const uniqueKey = `${row.name.trim()}-${specificDish}`;
                            if (addedDishes.has(uniqueKey)) return; 
                            addedDishes.add(uniqueKey);

                            // Dynamic Pricing calculation: A dish is roughly 30% to 50% of the "Cost For 2"
                            const basePrice = parseInt(row.average_cost_for_two) || 400;
                            const factor = (Math.random() * 0.2) + 0.3; 
                            const approximatePrice = Math.max(60, Math.round(basePrice * factor));

                            let synonyms = ['food', specificDish.split(' ')[0].toLowerCase()];
                            if (locality) synonyms.push(locality.toLowerCase());
                            row.cuisines && row.cuisines.split(',').forEach(c => synonyms.push(c.trim().toLowerCase()));

                            dishesToInsert.push({
                                dish_name: specificDish,
                                normalized_name: specificDish.toLowerCase(),
                                synonyms: synonyms,
                                restaurant_name: row.name.trim(),
                                price: approximatePrice,
                                rating: rating,
                                is_rare: Math.random() > 0.8,
                                location: {
                                    type: 'Point',
                                    coordinates: [parseFloat(row.longitude), parseFloat(row.latitude)] 
                                }
                            });
                        });
                    })
                    .on('end', async () => {
                        try {
                            if (dishesToInsert.length > 0) {
                                // Mongoose handles batch inserting very efficiently
                                await Dish.insertMany(dishesToInsert);
                                totalInserted += dishesToInsert.length;
                                console.log(`✅ Success! Injected ${dishesToInsert.length} dishes from ${file}`);
                            } else {
                                console.log(`⚠️ No valid dishes found in ${file}.`);
                            }
                            resolve();
                        } catch (insertError) {
                            console.error(`❌ Insertion Error on ${file}:`, insertError);
                            reject(insertError);
                        }
                    })
                    .on('error', (err) => {
                        console.error(`❌ File read error on ${file}:`, err);
                        reject(err);
                    });
            });
        }
        
        console.log(`\n🎉 UNIVERSAL MULTIPLEXER COMPLETE! Grand Total: ${totalInserted} Live Dishes Injected!`);
        process.exit();

    } catch (error) {
        console.error('❌ Database connection error:', error);
        process.exit(1);
    }
};

seedKaggleData();
