require('dotenv').config();
const mongoose = require('mongoose');
const Dish = require('../models/Dish');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const dishes = await Dish.find({ restaurant_name: /Chaudhary Dhaba/i }).limit(5);
  console.log("Dishes from Chaudhary Dhaba:", dishes.map(d => d.dish_name));
  
  const nanDishes = await Dish.find({ dish_name: /NaN/i }).limit(5);
  console.log("Dishes containing NaN:", nanDishes.map(d => ({ name: d.dish_name, rest: d.restaurant_name })));

  mongoose.disconnect();
}
main().catch(console.error);
