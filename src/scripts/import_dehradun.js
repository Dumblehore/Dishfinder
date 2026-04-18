require('dotenv').config();
const fs      = require('fs');
const path    = require('path');
const mongoose = require('mongoose');
const Dish    = require('../models/Dish');

// ── CSV parser (no external dep) ─────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  const headers = parseRow(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseRow(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h.trim()] = (values[i] || '').trim(); });
    return obj;
  });
}
function parseRow(line) {
  const result = []; let cur = ''; let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (inQuotes && line[i+1] === '"') { cur += '"'; i++; } else inQuotes = !inQuotes; }
    else if (c === ',' && !inQuotes) { result.push(cur); cur = ''; }
    else cur += c;
  }
  result.push(cur);
  return result;
}

// ── Synonym generator (uses word boundaries to avoid false matches) ───────────
function generateSynonyms(dishName) {
  const n = dishName.toLowerCase();
  const s = new Set([n]);
  const has = (word) => new RegExp(`\\b${word}\\b`).test(n);

  if (has('chicken'))                      { s.add('murgh'); s.add('poultry'); }
  if (has('paneer'))                       { s.add('cottage cheese'); }
  if (has('biryani'))                      { s.add('rice'); s.add('pulao'); s.add('dum biryani'); }
  if (has('noodle') || has('chowmein'))    { s.add('noodles'); s.add('hakka'); }
  if (has('pizza'))                        { s.add('flatbread'); }
  if (has('dosa'))                         { s.add('south indian'); s.add('crepe'); }
  if (has('kebab') || has('kabab') || has('tikka')) { s.add('grilled'); s.add('tandoori'); }
  if (has('momo') || has('dumpling') || has('dimsum')) { s.add('momo'); s.add('dumpling'); s.add('steamed'); }
  if (has('tea') || has('chai'))           { s.add('chai'); s.add('beverage'); }
  if (has('coffee'))                       { s.add('cappuccino'); s.add('latte'); }
  if (has('ice cream') || has('kulfi'))    { s.add('dessert'); s.add('frozen'); }
  if (has('halwa') || has('kheer') || has('gulab')) { s.add('dessert'); s.add('mithai'); s.add('sweet'); }
  if (has('samosa') || has('chaat') || has('puri')) { s.add('street food'); s.add('snack'); }
  return [...s];
}

// Maps Cuisine Types to realistic Dish Names
const CUISINE_TO_DISHES = {
  'North Indian': ['Butter Chicken', 'Dal Makhani', 'Kadai Paneer', 'Garlic Naan', 'Tandoori Chicken', 'Mushroom Masala', 'Malai Kofta'],
  'Mughlai': ['Mutton Rogan Josh', 'Chicken Korma', 'Awadhi Biryani', 'Galouti Kebab'],
  'Fast Food': ['Veg Burger', 'Chicken Burger', 'French Fries', 'Peri Peri Fries', 'Chicken Wrap', 'Veg Wrap'],
  'Chinese': ['Chilli Potato', 'Hakka Noodles', 'Manchow Soup', 'Veg Manchurian', 'Chowmein', 'Spring Roll'],
  'Pizza': ['Margherita Pizza', 'Farmhouse Pizza', 'Pepperoni Pizza', 'Paneer Tikka Pizza'],
  'South Indian': ['Masala Dosa', 'Idli Sambar', 'Medu Vada', 'Uttapam', 'Rava Dosa'],
  'Cafe': ['Cold Coffee', 'Cappuccino', 'Club Sandwich', 'Mocha', 'Hot Chocolate', 'Latte'],
  'Desserts': ['Chocolate Truffle Cake', 'Brownie', 'Red Velvet Pastry', 'Cheesecake'],
  'Bakery': ['Pineapple Pastry', 'Black Forest Cake', 'Choco Lava Cake', 'Butter Cookies'],
  'Rolls': ['Chicken Kathi Roll', 'Paneer Tikka Roll', 'Egg Roll', 'Mutton Roll'],
  'Momos': ['Steamed Veg Momos', 'Kurkure Momos', 'Chicken Momos', 'Pan Fried Momos', 'Paneer Momos'],
  'Street Food': ['Pani Puri', 'Aloo Tikki Chaat', 'Pav Bhaji', 'Gol Gappa', 'Dahi Bhalla'],
  'Biryani': ['Chicken Biryani', 'Mutton Biryani', 'Veg Biryani', 'Hyderabadi Biryani'],
  'Italian': ['White Sauce Pasta', 'Arrabbiata Pasta', 'Lasagna', 'Ravioli'],
  'Continental': ['Grilled Chicken Breast', 'Fish and Chips', 'Chicken Stroganoff'],
  'Beverages': ['Cold Coffee', 'Virgin Mojito', 'Lemon Iced Tea', 'Mango Shake'],
  'Mexican': ['Chicken Tacos', 'Veg Quesadilla', 'Nachos with Salsa'],
  'Tibetan': ['Veg Thukpa', 'Chicken Thukpa', 'Tingmo'],
  'Thai': ['Pad Thai Noodles', 'Som Tum Salad', 'Green Thai Curry', 'Red Thai Curry'],
  'Mithai': ['Gulab Jamun', 'Rasgulla', 'Kaju Katli', 'Jalebi'],
  'Ice Cream': ['Vanilla Ice Cream', 'Chocolate Ice Cream', 'Strawberry Ice Cream', 'Kulfi'],
  'Healthy Food': ['Quinoa Salad', 'Fruit Salad', 'Boiled Eggs', 'Oats Bowl'],
  'Sandwich': ['Veg Grilled Sandwich', 'Chicken Club Sandwich', 'Cheese Toast'],
  'Burger': ['Veg Burger', 'Chicken Burger', 'Paneer Burger', 'Cheese Burger'],
  'Juice': ['Fresh Orange Juice', 'Watermelon Juice', 'Mixed Fruit Juice'],
};

// Extractor function for Cuisine strings
function getDishesForCuisines(cuisinesStr) {
  if (!cuisinesStr) return ['Veg Meal'];
  
  const selectedDishes = [];
  const cuisines = cuisinesStr.split(',').map(c => c.trim());
  
  for (const cuisine of cuisines) {
    const options = CUISINE_TO_DISHES[cuisine];
    if (options && options.length > 0) {
      // Pick 2 random dishes per cuisine
      const shuffled = [...options].sort(() => 0.5 - Math.random());
      selectedDishes.push(...shuffled.slice(0, 2));
    }
  }

  // Fallback if no matching cuisine found
  if (selectedDishes.length === 0) {
    if (cuisines[0]) selectedDishes.push(`Special ${cuisines[0]} Meal`);
    else selectedDishes.push('Veg Meal');
  }

  return selectedDishes;
}

// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!MONGO_URI) { console.error('❌  No MONGODB_URI in .env'); process.exit(1); }

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected.\n');

  const csvPath = path.join(__dirname, '../data/Dehradun_Zomatao_Dataset.csv');
  const raw = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCSV(raw);
  console.log(`📄 Parsed ${rows.length} Dehradun restaurant rows.\n`);

  const dishes = [];
  let skippedRestaurants = 0;

  for (const row of rows) {
    const lat  = parseFloat(row['latitude']);
    const lng  = parseFloat(row['longitude']);
    const name = (row['name'] || '').trim();
    const pricingFor2 = parseInt(row['average_cost_for_two']) || 0;
    const rating = Math.min(5, parseFloat(row['aggregate_rating']) || 3.5);

    if (!name || isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
      skippedRestaurants++; continue;
    }

    const cuisinesStr = row['cuisines'];
    const generatedDishes = getDishesForCuisines(cuisinesStr);

    // Estimate per-dish price  (total for 2 ÷ 4, clamped)
    const estPrice = Math.max(50, Math.min(1000, Math.round(pricingFor2 / 4)));

    for (const dishName of generatedDishes) {
      dishes.push({
        dish_name:       dishName,
        normalized_name: dishName.toLowerCase(),
        synonyms:        generateSynonyms(dishName),
        restaurant_name: name,
        price:           estPrice,
        rating,
        is_rare:         false,
        location: {
          type:        'Point',
          coordinates: [lng, lat],
        },
      });
    }
  }

  console.log(`🍽️  Built ${dishes.length} dish records for Dehradun (skipped ${skippedRestaurants} empty/invalid rows).\n`);
  console.log('⏳ Inserting into MongoDB (duplicates will be skipped silently)...\n');

  // Chunk into batches of 500
  const BATCH = 500;
  let inserted = 0;
  let dupes    = 0;

  for (let i = 0; i < dishes.length; i += BATCH) {
    const chunk = dishes.slice(i, i + BATCH);
    try {
      const res = await Dish.insertMany(chunk, { ordered: false });
      inserted += res.length;
    } catch (err) {
      if (err.insertedDocs) inserted += err.insertedDocs.length;
      const writeErrors = err.writeErrors || [];
      dupes += writeErrors.filter(e => e.code === 11000).length;
      const otherErrors = writeErrors.filter(e => e.code !== 11000);
      if (otherErrors.length) {
        console.error(`  ⚠️  ${otherErrors.length} non-dupe errors in batch ${Math.floor(i/BATCH)+1}`);
      }
    }

    if ((i / BATCH) % 2 === 0) {
      process.stdout.write(`  Progress: ${Math.min(i + BATCH, dishes.length)} / ${dishes.length}\r`);
    }
  }

  console.log('\n\n─────────────────────────────────');
  console.log(`✅ Inserted:   ${inserted} Dehradun dish records`);
  console.log(`♻️  Duplicates: ${dupes} already existed (skipped)`);
  console.log('─────────────────────────────────\n');

  await mongoose.disconnect();
  console.log('🔌 Disconnected. Done!');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
