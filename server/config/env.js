/**
 * Environment configuration loader.
 * Centralises access to all environment variables with sensible defaults
 * so the application can run locally without a full environment setup.
 */
const dotenv = require('dotenv');
const path = require('path');

// Load .env from the project root (two levels up from this file)
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  API_URL: process.env.API_URL || 'http://localhost:5000/api',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  // Database
  DB_PATH: process.env.DB_PATH || './db/krishimitra.sqlite',

  // Authentication
  JWT_SECRET:
    process.env.JWT_SECRET ||
    'dev_only_secret_change_me_krishi_mitra_ai_2025_long_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // AI
  AI_PROVIDER: process.env.AI_PROVIDER || '',
  AI_API_KEY: process.env.AI_API_KEY || '',
  AI_BASE_URL: process.env.AI_BASE_URL || '',

  // Weather
  WEATHER_API_KEY: process.env.WEATHER_API_KEY || '',
  WEATHER_BASE_URL: process.env.WEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5',

  // Admin seed
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@krishimitra.ai',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin@123',
};

module.exports = env;

