/**
 * Seed data loader. Populates the database with:
 *  - Admin account
 *  - Sample farmer account
 *  - Crop catalogue
 *  - Known diseases & pests (small verifiable knowledge base)
 *  - Sample market prices (indicative, clearly from seed)
 *  - Government schemes (only well-known, verifiable public programs)
 *  - Sample community posts, marketplace items, equipment, farm records
 *
 * Runs only when the database is empty (no users).
 */
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const env = require('../config/env');

async function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (count > 0) {
    console.log('Database already has data. Skipping seed.');
    return;
  }

  console.log('Seeding database with sample data...');

  const adminHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
  const farmerHash = await bcrypt.hash('Farmer@123', 10);

  const adminId = db.prepare(
    "INSERT INTO users (name, email, password, role, phone, location, farm_name) VALUES (?,?,?,'admin',?,?,?)"
  ).run('KrishiMitra Admin', env.ADMIN_EMAIL, adminHash, '+91-0000000000', 'Head Office', 'KrishiMitra HQ').lastInsertRowid;

  const farmerId = db.prepare(
    "INSERT INTO users (name, email, password, role, phone, location, farm_name) VALUES (?,?,?,'farmer',?,?,?)"
  ).run('Ramesh Kumar', 'farmer@krishimitra.ai', farmerHash, '+91-9876543210', 'Punjab', 'Green Valley Farm').lastInsertRowid;

  // ---- Crops ----
  const crops = [
    ['Rice', 'Kharif', 'Clay', 'High', 120, '25-30 q/ha', 'Staple grain crop requiring standing water.'],
    ['Wheat', 'Rabi', 'Loam', 'Medium', 130, '35-40 q/ha', 'Major rabi cereal, cool-season crop.'],
    ['Maize', 'Kharif/Rabi', 'Loam', 'Medium', 95, '45-50 q/ha', 'Versatile cereal, good for rotation.'],
    ['Sugarcane', 'Kharif', 'Loam', 'High', 300, '700-800 q/ha', 'Long-duration cash crop.'],
    ['Cotton', 'Kharif', 'Sandy Loam', 'Low-Med', 180, '25-30 q/ha', 'Important fibre cash crop.'],
    ['Chickpea', 'Rabi', 'Loam', 'Low', 110, '10-12 q/ha', 'Pulse crop, improves soil nitrogen.'],
    ['Sunflower', 'Rabi/Kharif', 'Loam', 'Low', 90, '8-12 q/ha', 'Oilseed crop, short duration.'],
    ['Groundnut', 'Kharif', 'Sandy Loam', 'Low', 110, '15-20 q/ha', 'Oilseed, drought tolerant.'],
    ['Potato', 'Rabi', 'Sandy Loam', 'Medium', 90, '150-200 q/ha', 'High-value tuber crop.'],
    ['Tomato', 'Kharif/Rabi', 'Loam', 'Medium', 80, '150-250 q/ha', 'High-value vegetable crop.'],
  ];
  const cropInsert = db.prepare('INSERT INTO crops (name, season, soil_type, water_requirement, duration_days, avg_yield, description) VALUES (?,?,?,?,?,?,?)');
  crops.forEach((c) => cropInsert.run(...c));

  // ---- Diseases ----
  const diseases = [
    ['Wheat Rust (Leaf Rust)', 'Wheat', 'Orange-brown pustules on leaves, yellowing, reduced grain fill.', 'Puccinia fungus spread by wind-borne spores in humid, warm conditions.', 'Use resistant varieties, proper spacing, avoid excess nitrogen.', 'Apply approved fungicides per local expert guidance; rotate crops.', 'Medium'],
    ['Rice Blast', 'Rice', 'Diamond-shaped lesions with grey centres on leaves; neck blast on panicles.', 'Magnaporthe oryzae fungus; high humidity and excess nitrogen encourage it.', 'Resistant cultivars, balanced fertilization, avoid dense planting.', 'Apply recommended fungicides early; consult local officer.', 'High'],
    ['Tomato Late Blight', 'Tomato', 'Dark water-soaked spots on leaves/stems; white fungal growth in wet weather.', 'Phytophthora infestans; spreads rapidly in cool, wet conditions.', 'Good air circulation, avoid overhead watering, remove infected plants.', 'Approved copper-based/systemic fungicides; destroy infected debris.', 'High'],
    ['Powdery Mildew', 'Pumpkin, Cucumber, Squash, Grapes', 'White powdery coating on leaves, curling, stunted growth.', 'Various fungi; warm days, cool nights, high humidity.', 'Improve airflow, resistant varieties, avoid excess shade.', 'Sulfur or potassium bicarbonate treatments; prune affected parts.', 'Medium'],
    ['Cotton Boll Rot', 'Cotton', 'Boll discoloration/rotting, webbing inside bolls.', 'Fungal/insect complex; trapped moisture in bolls.', 'Timely harvest, avoid canopy moisture, pest monitoring.', 'Remove infected bolls; follow local IPM practices.', 'Medium'],
  ];
  const diseaseInsert = db.prepare('INSERT INTO diseases (name, affected_crops, symptoms, causes, preventive_measures, control_measures, severity) VALUES (?,?,?,?,?,?,?)');
  diseases.forEach((d) => diseaseInsert.run(...d));

  // ---- Pests ----
  const pests = [
    ['Aphid', 'Wheat, Cotton, Cabbage, Chilli', 'Clusters of small soft-bodied insects, sticky honeydew, curling leaves.', 'Encourage natural predators, early monitoring, avoid over-fertilizing.', 'Blast with water, neem-based sprays or approved insecticides per label.', 'Medium'],
    ['Cotton Bollworm', 'Cotton, Tomato, Maize', 'Holes in bolls/fruits, frass, wilting of damaged parts.', 'Scouting, trap crops, pheromone traps, crop rotation.', 'Approved insecticides at egg stage; follow local spray schedule.', 'High'],
    ['Fall Armyworm', 'Maize, Sorghum', 'Ragged feeding on leaves, frass, seedling damage.', 'Early planting, intercropping, monitoring traps.', 'Hand-pick egg masses, recommended biological/integrated controls.', 'High'],
    ['Brown Plant Hopper', 'Rice', 'Yellowing, hopper burn, plant lodging.', 'Avoid excess nitrogen, proper water management, resistant varieties.', 'Approved insecticides; follow rotation-of-chemistry advisories.', 'Medium'],
    ['Whitefly', 'Cotton, Tomato, Cucumber', 'White winged insects under leaves, honeydew, sooty mould.', 'Yellow sticky traps, reflective mulch, remove infested leaves.', 'Neem-based sprays or approved insecticides; rotate product classes.', 'Medium'],
  ];
  const pestInsert = db.prepare('INSERT INTO pests (name, affected_crops, symptoms, prevention, control, severity) VALUES (?,?,?,?,?,?)');
  pests.forEach((p) => pestInsert.run(...p));

  // ---- Market prices (indicative seed data) ----
  const prices = [
    ['Wheat', 'Agra', 'Uttar Pradesh', 2100, 2350, 2250, 'quintal'],
    ['Wheat', 'Ludhiana', 'Punjab', 2150, 2400, 2300, 'quintal'],
    ['Rice', 'Karnal', 'Haryana', 2200, 2450, 2350, 'quintal'],
    ['Rice', 'Raipur', 'Chhattisgarh', 2050, 2300, 2200, 'quintal'],
    ['Maize', 'Nizamabad', 'Telangana', 1800, 2000, 1900, 'quintal'],
    ['Cotton', 'Nagpur', 'Maharashtra', 7000, 7500, 7250, 'quintal'],
    ['Sugarcane', 'Lucknow', 'Uttar Pradesh', 3200, 3500, 3350, 'tonne'],
    ['Potato', 'Agra', 'Uttar Pradesh', 1100, 1350, 1250, 'quintal'],
    ['Tomato', 'Kolar', 'Karnataka', 1200, 1600, 1400, 'quintal'],
    ['Chickpea', 'Indore', 'Madhya Pradesh', 4800, 5200, 5000, 'quintal'],
  ];
  const priceInsert = db.prepare('INSERT INTO market_prices (commodity, market, state, min_price, max_price, modal_price, unit) VALUES (?,?,?,?,?,?,?)');
  prices.forEach((p) => priceInsert.run(...p));

  // ---- Schemes (only commonly known public programs; sourced) ----
  const schemes = [
    ['Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)', 'Ministry of Agriculture & Farmers Welfare', 'Income support of Rs. 6000/year to eligible landholding farmer families.', 'Small & marginal farmer families with cultivable landholding as per scheme criteria.', 'Direct transfer of Rs. 6000 per year in three instalments.', 'Land records, bank account details, Aadhaar.', 'Apply online through the PM-KISAN portal; details verified by state.', 'https://pmkisan.gov.in'],
    ['Pradhan Mantri Fasal Bima Yojana (PMFBY)', 'Ministry of Agriculture & Farmers Welfare', 'Crop insurance against unforeseen crop loss due to natural calamities/pests.', 'All farmers growing notified crops in notified areas.', 'Insurance coverage at low premium; subsidy on premium.', 'Land records, bank details, sowing details.', 'Apply through banks/insurance companies before the cut-off date.', 'https://pmfby.gov.in'],
    ['Kisan Credit Card (KCC)', 'Ministry of Agriculture & Farmers Welfare / RBI', 'Short-term credit for farmers for cultivation and other farm needs.', 'Farmers, sharecroppers, tenant farmers.', 'Affordable working capital credit with interest subvention.', 'Identity proof, land/tenancy records, bank details.', 'Apply at any bank branch; issuance subject to bank eligibility.', 'Bank branch / RBI'],
    ['Soil Health Card Scheme', 'Ministry of Agriculture & Farmers Welfare', 'Provides soil nutrient status and fertilizer recommendations.', 'All farmers.', 'Soil testing and recommendations to improve productivity.', 'Land records, farmer identity.', 'Sample collection by department; card issued periodically.', 'https://soilhealth.dac.gov.in'],
    ['Pradhan Mantri Krishi Sinchayee Yojana (PMKSY)', 'Ministry of Agriculture & Farmers Welfare', 'Enhances irrigation efficiency and water conservation.', 'Farmers and farm groups in project areas.', 'Support for micro-irrigation and assured irrigation.', 'Land records, project eligibility.', 'Via state implementing agencies.', 'https://pmksy.gov.in'],
  ];
  const schemeInsert = db.prepare('INSERT INTO schemes (name, ministry, description, eligibility, benefits, documents_required, how_to_apply, source) VALUES (?,?,?,?,?,?,?,?)');
  schemes.forEach((s) => schemeInsert.run(...s));

  // ---- Community posts ----
  const postInsert = db.prepare('INSERT INTO community_posts (author_id, title, content, category, tags, likes) VALUES (?,?,?,?,?,?)');
  postInsert.run(farmerId, 'Best time to sow wheat in Punjab?', 'I want to know the ideal sowing window for wheat this rabi season. Any advice?', 'Question', JSON.stringify(['wheat', 'rabi']), 4);
  postInsert.run(farmerId, 'My tomato leaves are turning yellow', 'Noticing yellowing on lower leaves. Could it be a nutrient issue?', 'Disease Help', JSON.stringify(['tomato', 'nutrient']), 2);

  // ---- Marketplace ----
  const mpInsert = db.prepare('INSERT INTO marketplace_items (seller_id, title, description, category, price, quantity, unit, location) VALUES (?,?,?,?,?,?,?,?)');
  mpInsert.run(farmerId, 'Organic Compost (Vermicompost)', 'High-quality vermicompost for soil conditioning.', 'Fertilizer', 12, '50 kg', 'kg', 'Punjab');
  mpInsert.run(farmerId, 'Fresh Wheat Grain', 'Freshly harvested wheat, good quality.', 'Grain', 2200, '10', 'quintal', 'Punjab');

  // ---- Equipment ----
  const equipInsert = db.prepare('INSERT INTO equipment (owner_id, name, category, description, hourly_rate, daily_rate, location) VALUES (?,?,?,?,?,?,?)');
  equipInsert.run(farmerId, 'Tractor (Mahindra)', 'Tractor', 'Well-maintained tractor for plowing and haulage.', 800, 6000, 'Punjab');
  equipInsert.run(farmerId, 'Water Pump (5HP)', 'Irrigation', 'Reliable diesel water pump.', 150, 1200, 'Punjab');

  // ---- Farm + records for analytics demo ----
  const farmId = db.prepare('INSERT INTO farms (user_id, name, area_hectares, soil_type, location) VALUES (?,?,?,?,?)')
    .run(farmerId, 'Green Valley Farm', 2.5, 'Loam', 'Punjab').lastInsertRowid;

  const cropRice = db.prepare('SELECT id FROM crops WHERE name = ?').get('Maize').id;
  const cropWheat = db.prepare('SELECT id FROM crops WHERE name = ?').get('Wheat').id;

  const recInsert = db.prepare('INSERT INTO farm_records (user_id, farm_id, crop_id, record_type, category, title, amount, quantity, record_date, notes) VALUES (?,?,?,?,?,?,?,?,?,?)');
  // Income
  recInsert.run(farmerId, farmId, cropRice, 'income', 'crop_sale', 'Maize sale', 45000, 20, '2025-03-15', 'Sold at mandi');
  recInsert.run(farmerId, farmId, cropWheat, 'income', 'crop_sale', 'Wheat sale', 68000, 30, '2025-04-10', 'Sold to trader');
  // Expenses
  recInsert.run(farmerId, farmId, cropRice, 'expense', 'seeds', 'Maize seeds', 8000, null, '2025-01-10', 'Certified seeds');
  recInsert.run(farmerId, farmId, cropWheat, 'expense', 'fertilizer', 'DAP & Urea', 12000, null, '2025-02-05', 'Fertilizers');
  recInsert.run(farmerId, farmId, null, 'expense', 'labour', 'Harvest labour', 9000, null, '2025-04-08', 'Labour wages');

  const actInsert = db.prepare('INSERT INTO farm_activities (user_id, farm_id, crop_id, activity_type, description, activity_date, cost) VALUES (?,?,?,?,?,?,?)');
  actInsert.run(farmerId, farmId, cropRice, 'planting', 'Sowed maize', '2025-01-12', 3000);
  actInsert.run(farmerId, farmId, cropRice, 'irrigation', 'First irrigation', '2025-02-01', 1500);
  actInsert.run(farmerId, farmId, cropWheat, 'fertilizer', 'Applied DAP', '2025-02-05', 8000);
  actInsert.run(farmerId, farmId, cropWheat, 'harvest', 'Harvested wheat', '2025-04-08', 5000);

  console.log('Seed complete.');
  return { adminId, farmerId };
}

module.exports = { seedIfEmpty };
