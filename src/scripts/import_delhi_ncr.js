/**
 * import_delhi_ncr.js  (v2)
 * 
 * Imports DelhiNCR Restaurants.csv into MongoDB.
 * Fixes from v1:
 *   - Use insertMany (ordered:false) instead of findOneAndUpdate to avoid
 *     Mongoose validation issues with $set upserts.
 *   - Filter out junk "Known_For" values (review words like Staff, Ambience etc.)
 * 
 * Usage:
 *   cd C:\Projects\dishfinder-backend
 *   node src/scripts/import_delhi_ncr.js
 */

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

// ── Junk filter ── words that appear in Known_For but are NOT dish names ─────
const JUNK_WORDS = new Set([
  'staff','service','ambience','ambiance','decor','atmosphere','location',
  'cleanliness','hygiene','value','quality','quantity','pricing','price',
  'taste','food','experience','recommended','recommendation','recommendations',
  'cordial staff','great staff','friendly staff','polite staff','good staff',
  'courteous staff','nice staff','excellent staff','amazing staff','helpful staff',
  'great recommendations','mouth watering food','reasonable prices',
  'everything was very good','good for large groups','comfortable seating',
  'comfortable seating area','ample seating area','nothing to dislike',
  'seating arrangement','serving style','concept','owner','chef','host',
  'art','behavior','behaviour','parking','bathroom','vibe',
  'worth it','totally worth it','bank for the buck','bang for the buck',
  'highly recommended','best place','amazing place','great place','nice place',
  'good taste','amazing taste','good food','great food','excellent food',
]);

function isRealDish(name) {
  if (!name || name.length < 3) return false;
  const lower = name.toLowerCase().trim();
  // Reject if it's in the junk set
  if (JUNK_WORDS.has(lower)) return false;
  // Reject if it looks like a sentence (contains multiple words that are all generic)
  if (/^(the |a |an )/i.test(lower) && lower.split(' ').length > 4) return false;
  // Reject pure adjectives / short generic words
  if (/^(good|great|nice|best|amazing|excellent|perfect|awesome|fantastic|wonderful|lovely|beautiful|cozy|cosy|clean|fresh|hot|cold|spicy|sweet|sour)\s*$/i.test(lower)) return false;
  return true;
}

// ── Synonym generator ─────────────────────────────────────────────────────────
function generateSynonyms(dishName) {
  const n = dishName.toLowerCase();
  const s = new Set([n]);
  if (n.includes('chicken')) { s.add('murgh'); s.add('poultry'); }
  if (n.includes('paneer'))  { s.add('cottage cheese'); }
  if (n.includes('biryani')) { s.add('rice'); s.add('pulao'); s.add('dum biryani'); }
  if (n.includes('noodle') || n.includes('chowmein')) { s.add('noodles'); s.add('hakka'); }
  if (n.includes('pizza'))   { s.add('flatbread'); }
  if (n.includes('dosa'))    { s.add('south indian'); s.add('crepe'); }
  if (n.includes('kebab') || n.includes('kabab') || n.includes('tikka')) { s.add('grilled'); s.add('tandoori'); }
  if (n.includes('momo') || n.includes('dumpling') || n.includes('dimsum')) { s.add('momo'); s.add('dumpling'); s.add('steamed'); }
  if (n.includes('tea') || n.includes('chai'))    { s.add('chai'); s.add('beverage'); }
  if (n.includes('coffee'))  { s.add('cappuccino'); s.add('latte'); }
  if (n.includes('ice cream') || n.includes('kulfi')) { s.add('dessert'); s.add('frozen'); }
  if (n.includes('halwa') || n.includes('kheer') || n.includes('gulab')) { s.add('dessert'); s.add('mithai'); s.add('sweet'); }
  if (n.includes('samosa') || n.includes('chaat') || n.includes('puri')) { s.add('street food'); s.add('snack'); }
  return [...s];
}

// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!MONGO_URI) { console.error('❌  No MONGODB_URI in .env'); process.exit(1); }

  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected.\n');

  const csvPath = path.join(__dirname, '../data/DelhiNCR Restaurants.csv');
  const raw = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCSV(raw);
  console.log(`📄 Parsed ${rows.length} restaurant rows.\n`);

  const dishes = [];
  let skippedRestaurants = 0;

  for (const row of rows) {
    const lat  = parseFloat(row['Latitude']);
    const lng  = parseFloat(row['Longitude']);
    const name = (row['Restaurant_Name'] || '').trim();
    const pricingFor2 = parseInt(row['Pricing_for_2']) || 0;
    const rating = Math.min(5, parseFloat(row['Dining_Rating']) || 3.5);

    if (!name || isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
      skippedRestaurants++; continue;
    }

    // Collect dishes from BOTH Known_For columns
    const rawDishes = [
      ...(row['Known_For2']  || '').split(','),
      // Known_For22 is usually ambience/service descriptions — skip it
    ]
    .map(d => d.trim())
    .filter(isRealDish);

    if (rawDishes.length === 0) { skippedRestaurants++; continue; }

    // Estimate per-dish price  (total for 2 ÷ 4, clamped)
    const estPrice = Math.max(50, Math.min(1000, Math.round(pricingFor2 / 4)));

    for (const dishName of rawDishes) {
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

  console.log(`🍽️  Built ${dishes.length} dish records (skipped ${skippedRestaurants} restaurants).\n`);
  console.log('⏳ Inserting into MongoDB (duplicates will be skipped silently)...\n');

  // Chunk into batches of 500 for speed
  const BATCH = 500;
  let inserted = 0;
  let dupes    = 0;

  for (let i = 0; i < dishes.length; i += BATCH) {
    const chunk = dishes.slice(i, i + BATCH);
    try {
      const res = await Dish.insertMany(chunk, { ordered: false });
      inserted += res.length;
    } catch (err) {
      // BulkWriteError — count successes vs duplicates
      if (err.insertedDocs) inserted += err.insertedDocs.length;
      const writeErrors = err.writeErrors || [];
      dupes += writeErrors.filter(e => e.code === 11000).length;
      // Non-dupe errors
      const otherErrors = writeErrors.filter(e => e.code !== 11000);
      if (otherErrors.length) {
        console.error(`  ⚠️  ${otherErrors.length} non-dupe errors in batch ${Math.floor(i/BATCH)+1}`);
        console.error('  First error:', otherErrors[0]?.errmsg?.slice(0, 100));
      }
    }

    if ((i / BATCH) % 5 === 0) {
      process.stdout.write(`  Progress: ${Math.min(i + BATCH, dishes.length)} / ${dishes.length}\r`);
    }
  }

  console.log('\n\n─────────────────────────────────');
  console.log(`✅ Inserted:   ${inserted} new dish records`);
  console.log(`♻️  Duplicates: ${dupes} already existed (skipped)`);
  console.log('─────────────────────────────────\n');

  await mongoose.disconnect();
  console.log('🔌 Disconnected. Done!');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
