const fs = require('fs');
const path = require('path');

function parseRow(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else cur += c;
  }
  result.push(cur);
  return result;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];
  const headers = parseRow(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseRow(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = (values[i] || '').trim();
    });
    return obj;
  });
}

/**
 * Dish-level menu CSV (one row per dish).
 * Columns: restaurant_name, dish_name, price, is_rare, synonyms, latitude, longitude, rating
 * - synonyms: pipe | separated (avoids comma issues)
 * - is_rare: true / false / 1 / 0
 */
function loadDishMenuCsv(filename) {
  const csvPath = path.join(__dirname, '../data', filename);
  if (!fs.existsSync(csvPath)) {
    console.warn(`⚠️  Dish menu CSV not found (skip): ${csvPath}`);
    return [];
  }
  const rows = parseCSV(fs.readFileSync(csvPath, 'utf8'));
  const out = [];
  for (const row of rows) {
    const dish_name = (row.dish_name || '').trim();
    const restaurant_name = (row.restaurant_name || '').trim();
    if (!dish_name || !restaurant_name) continue;
    const price = parseInt(row.price, 10);
    if (Number.isNaN(price)) continue;
    const isRare = ['true', '1', 'yes'].includes(String(row.is_rare || '').toLowerCase());
    const synonyms = (row.synonyms || '')
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);
    const lat = parseFloat(row.latitude);
    const lng = parseFloat(row.longitude);
    const rating = parseFloat(row.rating);
    const o = { dish_name, restaurant_name, price, is_rare: isRare, synonyms };
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      o.latitude = lat;
      o.longitude = lng;
      if (!Number.isNaN(rating)) o.rating = rating;
    }
    out.push(o);
  }
  return out;
}

module.exports = { loadDishMenuCsv };
