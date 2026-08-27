/**
 * Public landing-page API routes.
 * These endpoints are intentionally unauthenticated so the standalone
 * index.html landing page can call them without a JWT token.
 * They delegate to the same service/engine layer used by the main app.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const aiEngine = require('../services/aiEngine');
const weatherService = require('../services/weatherService');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/* ------------------------------------------------------------------
 * POST /api/public/recommend-crop
 * Body: { soil, season, location }
 * ------------------------------------------------------------------ */
router.post(
  '/recommend-crop',
  asyncHandler(async (req, res) => {
    const { soil = 'Alluvial', season = 'Kharif', location = 'India' } = req.body || {};

    // Normalise soil label (strip Hindi part after " · ")
    const soilKey = soil.split(' · ')[0].trim();
    // Normalise season label (strip date range after " (")
    const seasonKey = season.split(' (')[0].trim();

    const result = await aiEngine.recommendCrops({
      soil_type: soilKey,
      season: seasonKey,
      location,
    });

    return success(res, result, 'Crop recommendations generated.');
  })
);

/* ------------------------------------------------------------------
 * GET /api/public/weather?location=<city>
 * ------------------------------------------------------------------ */
router.get(
  '/weather',
  asyncHandler(async (req, res) => {
    const location = req.query.location || 'Delhi';
    const data = await weatherService.fetchWeather(location);
    return success(res, data, 'Weather information retrieved.');
  })
);

/* ------------------------------------------------------------------
 * GET /api/public/mandi-prices?crop=<name>
 * Returns sample prices (same mock data as the landing page JS, but now
 * from the server so the integration note is accurate).
 * ------------------------------------------------------------------ */
router.get(
  '/mandi-prices',
  asyncHandler(async (req, res) => {
    const cropRaw = req.query.crop || 'Wheat';
    const crop = cropRaw.split(' · ')[0].trim();

    const mandis = [
      'Azadpur Mandi, Delhi',
      'Vashi APMC, Mumbai',
      'Koyambedu Market, Chennai',
      'Gultekdi Market, Pune',
      'Ernakulam Market, Kerala',
    ];

    const seed = crop.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const prices = mandis.map((mandi, i) => {
      const base = 1800 + (seed * 7 + i * 113) % 2200;
      const up = (seed + i) % 3 !== 0;
      return {
        mandi,
        modal_price: base,
        trend: up ? 'up' : 'down',
      };
    });

    return success(res, { crop, prices }, `Mandi prices for ${crop}.`);
  })
);

/* ------------------------------------------------------------------
 * POST /api/public/diagnose   (multipart/form-data, field: image)
 * Returns a sample disease diagnosis.
 * ------------------------------------------------------------------ */
router.post(
  '/diagnose',
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded.' });
    }

    // Use the AI engine's disease detection (Gemini Vision or mock fallback)
    const result = await aiEngine.detectDisease({ buffer: req.file.buffer, mimetype: req.file.mimetype });
    return success(res, result, 'Disease diagnosis complete.');
  })
);

/* ------------------------------------------------------------------
 * POST /api/public/chat
 * Body: { message, lang }
 * ------------------------------------------------------------------ */
router.post(
  '/chat',
  asyncHandler(async (req, res) => {
    const { message = '', lang = 'en' } = req.body || {};
    if (!message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const result = await aiEngine.chat([{ role: 'user', content: message }], { lang });
    return success(res, { reply: result }, 'Chat response generated.');
  })
);

module.exports = router;
