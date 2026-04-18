require('dotenv').config();
const mongoose = require('mongoose');
const Dish = require('../models/Dish');

async function main() {
  const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!MONGO_URI) { console.error('❌  No MONGODB_URI in .env'); process.exit(1); }

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected.\n');

  // Deleting all dishes that were accidentally created with the name "NaN"
  const result = await Dish.deleteMany({ dish_name: "NaN" });
  console.log(`🗑️  Deleted ${result.deletedCount} dishes named "NaN".\n`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected. Done!');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
