const mongoose = require('mongoose');
const Dish = require('../models/Dish');
const Fuse = require('fuse.js');

// Helper to calculate haversine distance if needed manually, 
// though MongoDB $geoNear provides it automatically.
const calculateScore = (dish, searchScore, maxDistance) => {
    // Relevance score (from Fuse.js) - Lower fuse score is better (0 is exact match, 1 is no match)
    // We convert it so higher is better
    const relevanceScore = searchScore !== null ? Math.max(0, (1 - searchScore) * 40) : 0;
    
    // Distance score: Max 30 points
    // dish.distance is in meters provided by $geoNear
    const distanceInKm = dish.distance / 1000;
    let distanceScore = 0;
    if (distanceInKm <= 2) distanceScore = 30;
    else if (distanceInKm <= 5) distanceScore = 20;
    else if (distanceInKm <= 10) distanceScore = 10;
    
    // Price score (simplified): Cheaper gets more points (max 15)
    // Ideally you'd compare to average, but here we do a simple inverse of price
    // Assuming 500 is very expensive, 50 is cheap
    const priceScore = Math.max(0, 15 - (dish.price / 100));
    
    // Rating score: Max 15
    const ratingScore = (dish.rating / 5) * 15;
    
    return relevanceScore + distanceScore + priceScore + ratingScore;
};

exports.searchDishes = async (req, res) => {
    try {
        const { q, lat, lng, radius = 10000, sortBy } = req.query; // default 10km radius
        
        if (!lat || !lng) {
            return res.status(400).json({ error: "Latitude (lat) and Longitude (lng) are required." });
        }

        const userLocation = [parseFloat(lng), parseFloat(lat)];

        // 1. Fetch nearby dishes using $geoNear
        // This is extremely fast due to the 2dsphere index
        const aggregatePipeline = [
            {
                $geoNear: {
                    near: {
                        type: "Point",
                        coordinates: userLocation
                    },
                    distanceField: "distance",
                    maxDistance: parseInt(radius),
                    spherical: true
                }
            }
        ];

        const nearbyDishes = await Dish.aggregate(aggregatePipeline);

        // If no dishes found nearby at all
        if (nearbyDishes.length === 0) {
            return res.json({ results: [], message: "No restaurants found in this area." });
        }

        let finalResults = nearbyDishes;

        // 2. Perform fuzzy search client-side (Node.js) if a query was provided
        // Since we installed fuse.js, we can do nice typo-tolerant matching in-memory 
        // on the already geo-filtered subset of data.
        if (q) {
            const fuseOptions = {
                keys: ['normalized_name', 'synonyms'],
                includeScore: true,
                threshold: 0.2, // Lowered from 0.4 to prevent "ice" matching "rice"
                ignoreLocation: true // Forces it to evaluate the whole word rather than arbitrary substrings
            };
            
            const fuse = new Fuse(nearbyDishes, fuseOptions);
            const searchResults = fuse.search(q.toLowerCase());
            
            // Map fuse results back to our dish objects with their search scores attached
            finalResults = searchResults.map(result => {
                const dishObj = result.item;
                dishObj.searchScore = result.score;
                return dishObj;
            });
            
            if (finalResults.length === 0) {
                // Empty state handling logic
                return res.json({ 
                    results: [], 
                    emptyState: true,
                    message: "No exact matches. Try searching for synonyms or increase radius."
                });
            }
        } else {
            // No query provided, return nearest dishes
            finalResults = finalResults.map(dish => ({ ...dish, searchScore: 0 }));
        }

        // 3. Apply Custom Ranking Formula
        finalResults = finalResults.map(dish => {
            dish.totalScore = calculateScore(dish, dish.searchScore, radius);
            return dish;
        });

        // 4. Sort based on param or custom formula
        if (sortBy === 'distance') {
            finalResults.sort((a, b) => a.distance - b.distance);
        } else if (sortBy === 'price') {
            finalResults.sort((a, b) => a.price - b.price);
        } else {
            // Default magic sorting
            finalResults.sort((a, b) => b.totalScore - a.totalScore);
        }

        // 5. Apply Smart Tags
        if (finalResults.length > 0) {
            // Find closest
            const closest = [...finalResults].sort((a, b) => a.distance - b.distance)[0];
            // Find cheapest
            const cheapest = [...finalResults].sort((a, b) => a.price - b.price)[0];
            // Find best value (highest rating/price ratio)
            const bestValue = [...finalResults].sort((a, b) => (b.rating/b.price) - (a.rating/a.price))[0];

            finalResults = finalResults.map(dish => {
                dish.tags = [];
                if (dish._id.toString() === closest._id.toString()) dish.tags.push("Closest");
                if (dish._id.toString() === cheapest._id.toString()) dish.tags.push("Cheapest");
                if (dish._id.toString() === bestValue._id.toString()) dish.tags.push("Best Value");
                if (dish.is_rare) dish.tags.push("Rare Dish");
                
                // Remove internal score values before sending to user for a cleaner payload
                delete dish.searchScore;
                return dish;
            });
        }

        res.json({ count: finalResults.length, results: finalResults });

    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ error: "Server error during search." });
    }
};
