/**
 * Database schema initialisation.
 * Creates all tables with proper relationships, constraints and indexes.
 */
const db = require('../config/db');

function initDb() {
  db.exec(`
  -- Users & roles
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'farmer' CHECK (role IN ('farmer','admin')),
    phone TEXT,
    location TEXT,
    language TEXT DEFAULT 'en',
    avatar TEXT,
    farm_name TEXT,
    approved BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Farm records
  CREATE TABLE IF NOT EXISTS farms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    area_hectares REAL DEFAULT 0,
    soil_type TEXT,
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_farms_user ON farms(user_id);

  -- Crops catalogue (admin managed)
  CREATE TABLE IF NOT EXISTS crops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    season TEXT,
    soil_type TEXT,
    water_requirement TEXT,
    duration_days INTEGER,
    avg_yield TEXT,
    description TEXT,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Farm activities / crop lifecycle on a farm
  CREATE TABLE IF NOT EXISTS farm_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farm_id INTEGER REFERENCES farms(id) ON DELETE SET NULL,
    crop_id INTEGER REFERENCES crops(id) ON DELETE SET NULL,
    activity_type TEXT CHECK (activity_type IN ('planting','harvest','irrigation','fertilizer','pesticide','other')),
    description TEXT,
    activity_date DATE NOT NULL,
    quantity REAL,
    cost REAL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_activities_user ON farm_activities(user_id);
  CREATE INDEX IF NOT EXISTS idx_activities_farm ON farm_activities(farm_id);

  -- Farm records / crop production records (expense/income ledger)
  CREATE TABLE IF NOT EXISTS farm_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farm_id INTEGER REFERENCES farms(id) ON DELETE SET NULL,
    crop_id INTEGER REFERENCES crops(id) ON DELETE SET NULL,
    record_type TEXT CHECK (record_type IN ('income','expense')),
    category TEXT,
    title TEXT NOT NULL,
    amount REAL NOT NULL DEFAULT 0,
    quantity REAL,
    record_date DATE NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_records_user ON farm_records(user_id);

  -- Known diseases (knowledge base, admin managed)
  CREATE TABLE IF NOT EXISTS diseases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    affected_crops TEXT,
    symptoms TEXT,
    causes TEXT,
    preventive_measures TEXT,
    control_measures TEXT,
    severity TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Known pests (knowledge base, admin managed)
  CREATE TABLE IF NOT EXISTS pests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    affected_crops TEXT,
    symptoms TEXT,
    prevention TEXT,
    control TEXT,
    severity TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Marketplace listings
  CREATE TABLE IF NOT EXISTS marketplace_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    price REAL DEFAULT 0,
    quantity TEXT,
    unit TEXT,
    location TEXT,
    image TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active','sold','removed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_marketplace_seller ON marketplace_items(seller_id);
  CREATE INDEX IF NOT EXISTS idx_marketplace_status ON marketplace_items(status);

  -- Equipment rental
  CREATE TABLE IF NOT EXISTS equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    hourly_rate REAL DEFAULT 0,
    daily_rate REAL DEFAULT 0,
    availability TEXT DEFAULT 'available' CHECK (availability IN ('available','rented','maintenance')),
    location TEXT,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_equipment_owner ON equipment(owner_id);

  -- Rental requests / bookings
  CREATE TABLE IF NOT EXISTS rentals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    equipment_id INTEGER NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    renter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_cost REAL DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','completed','cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Community posts
  CREATE TABLE IF NOT EXISTS community_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    tags TEXT,
    likes INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active','hidden')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_posts_author ON community_posts(author_id);

  -- Comments on posts
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Government schemes (knowledge base; only seeded with verifiable data points)
  CREATE TABLE IF NOT EXISTS schemes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    ministry TEXT,
    description TEXT,
    eligibility TEXT,
    benefits TEXT,
    documents_required TEXT,
    how_to_apply TEXT,
    source TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Market price records
  CREATE TABLE IF NOT EXISTS market_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    commodity TEXT NOT NULL,
    market TEXT,
    state TEXT,
    min_price REAL,
    max_price REAL,
    modal_price REAL,
    unit TEXT DEFAULT 'quintal',
    price_date DATE DEFAULT CURRENT_DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_prices_commodity ON market_prices(commodity);

  -- Chat history
  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user','assistant')),
    content TEXT NOT NULL,
    context TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_messages(user_id);

  -- Detection history (disease & pest)
  CREATE TABLE IF NOT EXISTS detections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    type TEXT CHECK (type IN ('disease','pest')),
    detected_name TEXT,
    confidence REAL,
    symptoms TEXT,
    causes TEXT,
    measures TEXT,
    image_path TEXT,
    raw_result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Soil health records
  CREATE TABLE IF NOT EXISTS soil_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ph REAL,
    nitrogen INTEGER,
    phosphorus INTEGER,
    potassium INTEGER,
    organic_carbon REAL,
    moisture REAL,
    soil_type TEXT,
    location TEXT,
    summary TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  `);
}

module.exports = { initDb };

