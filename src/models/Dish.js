const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema({
    dish_name: {
        type: String,
        required: true,
        trim: true
    },
    normalized_name: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    synonyms: {
        type: [String],
        default: []
    },
    restaurant_name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true
    },
    rating: {
        type: Number,
        default: 0
    },
    is_rare: {
        type: Boolean,
        default: false
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    }
}, { timestamps: true });

// Create a geospatial index for the location field
dishSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Dish', dishSchema);
