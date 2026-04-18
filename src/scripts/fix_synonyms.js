/**
 * fix_synonyms.js
 * 
 * One-time cleanup: removes incorrect synonyms from existing Dish records
 * where 'steak'.includes('tea') style false matches happened.
 * 
 * Usage:
 *   cd C:\Projects\dishfinder-backend
 *   node src/scripts/fix_synonyms.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Dish = require('../models/Dish');

const has = (str, word) => new RegExp(`\\b${word}\\b`).test(str);

function correctSynonyms(dishName) {
  const n = dishName.toLowerCase();
  const s = new Set([n]);

  if (has(n, 'chicken'))                       { s.add('murgh'); s.add('poultry'); }
  if (has(n, 'paneer'))                        { s.add('cottage cheese'); }
  if (has(n, 'biryani'))                       { s.add('rice'); s.add('pulao'); s.add('dum biryani'); }
  if (has(n, 'noodle') || has(n, 'chowmein')) { s.add('noodles'); s.add('hakka'); }
  if (has(n, 'pizza'))                         { s.add('flatbread'); }
  if (has(n, 'dosa'))                          { s.add('south indian'); s.add('crepe'); }
  if (has(n, 'kebab') || has(n, 'kabab') || has(n, 'tikka')) { s.add('grilled'); s.add('tandoori'); }
  if (has(n, 'momo') || has(n, 'dumpling') || has(n, 'dimsum')) { s.add('momo'); s.add('dumpling'); s.add('steamed'); }
  if (has(n, 'tea') || has(n, 'chai'))         { s.add('chai'); s.add('beverage'); }
  if (has(n, 'coffee'))                        { s.add('cappuccino'); s.add('latte'); }
  if (has(n, 'ice cream') || has(n, 'kulfi')) { s.add('dessert'); s.add('frozen'); }
  if (has(n, 'halwa') || has(n, 'kheer') || has(n, 'gulab')) { s.add('dessert'); s.add('mithai'); s.add('sweet'); }
  if (has(n, 'samosa') || has(n, 'chaat') || has(n, 'puri')) { s.add('street food'); s.add('snack'); }

  return [...s];
}

async function main() {
  const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!MONGO_URI) { console.error('❌  No MONGODB_URI in .env'); process.exit(1); }

  console.log('🔌 Connecting...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected.\n');

  // Find dishes that have 'chai' in synonyms but don't actually contain \btea\b or \bchai\b
  const badChai = await Dish.find({ synonyms: 'chai' });
  console.log(`Found ${badChai.length} dishes with 'chai' in synonyms.`);

  let fixed = 0;
  for (const dish of badChai) {
    const correct = correctSynonyms(dish.dish_name);
    const hadChai = dish.synonyms.includes('chai');
    const shouldHaveChai = correct.includes('chai');

    if (hadChai && !shouldHaveChai) {
      await Dish.updateOne({ _id: dish._id }, { $set: { synonyms: correct } });
      fixed++;
    }
  }

  console.log(`\n✅ Fixed ${fixed} dishes with bad 'chai' synonym (e.g. steak, grilled items).`);

  // Also fix 'murgh' on non-chicken dishes (edge case)
  const badMurgh = await Dish.find({ synonyms: 'murgh' });
  let fixedMurgh = 0;
  for (const dish of badMurgh) {
    const correct = correctSynonyms(dish.dish_name);
    if (!correct.includes('murgh')) {
      await Dish.updateOne({ _id: dish._id }, { $set: { synonyms: correct } });
      fixedMurgh++;
    }
  }
  if (fixedMurgh) console.log(`✅ Fixed ${fixedMurgh} dishes with bad 'murgh' synonym.`);

  await mongoose.disconnect();
  console.log('\n🔌 Done!');
}

main().catch(err => { console.error(err); process.exit(1); });
