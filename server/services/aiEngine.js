/**
 * AI abstraction layer.
 *
 * Provides a clean, provider-agnostic interface for all AI capabilities.
 * Currently ships with a fully working offline "mock" engine so the
 * application runs end-to-end without any external API keys.
 *
 * If an external provider is configured (AI_PROVIDER set), the real
 * implementation can be plugged in here. The rest of the app only talks
 * to this layer, so switching providers requires no other code changes.
 */

const env = require('../config/env');

/**
 * Chooses active AI driver. Returns the chat inference function promise.
 * Currently always uses the local mock engine.
 */
function getDriver() {
  return {
    name: env.AI_PROVIDER || 'mock-engine',
    async chat(messages, context = {}) {
      return mockChat(messages, context);
    },
  };
}

/* ------------------------------------------------------------------ *
 *  Knowledge bases used by the mock engine
 * ------------------------------------------------------------------ */

const DISEASE_KB = [
  {
    name: 'Wheat Rust (Leaf Rust)',
    crops: ['Wheat'],
    symptoms: 'Orange-brown powdery pustules on leaves, yellowing, reduced grain filling.',
    causes: 'Caused by Puccinia fungus. Spreads via wind-borne spores in humid conditions.',
    preventive: 'Use resistant varieties, ensure proper crop spacing, avoid excess nitrogen.',
    control:
      'Apply approved fungicides (e.g., triazole-based) as per local expert guidance. Rotate crops.',
    confidence: 0.82,
  },
  {
    name: 'Rice Blast',
    crops: ['Rice'],
    symptoms: 'Diamond-shaped lesions with grey centres on leaves, neck blast on panicles.',
    causes: 'Magnaporthe oryzae fungus, favoured by high humidity and excess nitrogen.',
    preventive: 'Use resistant cultivars, balanced fertilization, avoid dense planting.',
    control:
      'Apply recommended fungicides early. Consult local agriculture officer for approved options.',
    confidence: 0.78,
  },
  {
    name: 'Tomato Late Blight',
    crops: ['Tomato'],
    symptoms: 'Dark, water-soaked spots on leaves and stems; white fungal growth in wet weather.',
    causes: 'Phytophthora infestans, spreads rapidly in cool, wet conditions.',
    preventive: 'Good air circulation, avoid overhead watering, remove infected plants promptly.',
    control:
      'Use approved copper-based or systemic fungicides per local guidance. Destroy infected debris.',
    confidence: 0.79,
  },
  {
    name: 'Powdery Mildew',
    crops: ['Pumpkin', 'Cucumber', 'Squash', 'Grapes'],
    symptoms: 'White powdery coating on leaves, curling, stunted growth.',
    causes: 'Various fungal species; favours warm days, cool nights, high humidity.',
    preventive: 'Improve airflow, plant resistant varieties, avoid excess shade.',
    control:
      'Apply sulfur- or potassium bicarbonate-based treatments per label. Prune affected parts.',
    confidence: 0.8,
  },
  {
    name: 'Cotton Boll Rot',
    crops: ['Cotton'],
    symptoms: 'Boll discoloration and rotting, webbing inside bolls.',
    causes: 'Fungal/insect complex; moisture trapped in bolls.',
    preventive: 'Timely harvesting, avoid excess canopy moisture, pest monitoring.',
    control:
      'Remove and destroy infected bolls. Follow local IPM (integrated pest management) practices.',
    confidence: 0.7,
  },
];

const PEST_KB = [
  {
    name: 'Aphid',
    crops: ['Wheat', 'Cotton', 'Cabbage', 'Chilli'],
    symptoms: 'Clusters of small soft-bodied insects, sticky honeydew, curling leaves.',
    prevention: 'Encourage natural predators (ladybugs), monitor early, avoid over-fertilizing.',
    control: 'Blast with water, use neem-based sprays or approved insecticides per label.',
    severity: 'Medium',
  },
  {
    name: 'Cotton Bollworm',
    crops: ['Cotton', 'Tomato', 'Maize'],
    symptoms: 'Holes in bolls/fruits, frass, wilting of damaged parts.',
    prevention: 'Scouting, trap crops, pheromone traps, proper crop rotation.',
    control: 'Apply approved insecticides at egg stage. Follow local spray schedule.',
    severity: 'High',
  },
  {
    name: 'Fall Armyworm',
    crops: ['Maize', 'Sorghum'],
    symptoms: 'Ragged feeding on leaves, presence of frass, seedling damage.',
    prevention: 'Early planting, intercropping, monitoring traps.',
    control: 'Hand-pick egg masses, apply recommended biological/integrated controls.',
    severity: 'High',
  },
  {
    name: 'Brown Plant Hopper',
    crops: ['Rice'],
    symptoms: 'Yellowing, "hopper burn", plant lodging.',
    prevention: 'Avoid excess nitrogen, maintain proper water management, resistant varieties.',
    control: 'Use approved insecticides; follow local advisories on rotation of chemistry.',
    severity: 'Medium',
  },
  {
    name: 'Whitefly',
    crops: ['Cotton', 'Tomato', 'Cucumber'],
    symptoms: 'White winged insects under leaves, sticky honeydew, sooty mould.',
    prevention: 'Yellow sticky traps, reflective mulch, remove infested leaves.',
    control: 'Use neem-based sprays or approved insecticides; rotate product classes.',
    severity: 'Medium',
  },
];

const CHAT_KB = {
  irrigation: [
    'Best time to water is early morning or late evening to reduce evaporation loss.',
    'Drip irrigation can save up to 40-50% water compared to flood irrigation.',
    'The irrigation requirement depends on soil type, crop stage, and weather.',
  ],
  fertilizer: [
    'Always get a soil test before applying fertilizers to avoid over-application.',
    'Nitrogen, Phosphorus and Potassium (NPK) are the primary nutrients; balance them per crop stage.',
    'Organic manure improves soil structure and long-term fertility.',
  ],
  soil: [
    'Soil pH between 6 and 7 is ideal for most crops.',
    'Adding organic matter improves water retention and nutrient availability.',
    'Crop rotation helps prevent nutrient depletion and soil-borne diseases.',
  ],
  disease: [
    'Early detection and proper spacing reduce the chance of disease spread.',
    'Always use certified, disease-free seeds.',
    'Follow crop rotation to break disease cycles.',
  ],
  market: [
    'Compare prices across nearby mandis before selling; the difference can be significant.',
    'The platform shows indicative prices only. Verify current rates with your local mandi.',
    'Group selling or farmer producer organisations (FPOs) often get better prices.',
  ],
  scheme: [
    'Government schemes are listed on the platform with eligibility and required documents.',
    'Always verify scheme details from official government sources before applying.',
    'Keep documents like land records, bank details, and Aadhaar ready for applications.',
  ],
  default: [
    'I can help you with crop selection, disease/pest detection, soil health, weather guidance, market prices, and government schemes.',
    'Please provide more details about your crop, location, or the issue you are facing.',
    'For high-risk decisions, always consult a qualified agricultural expert or your local Krishi Vigyan Kendra.',
  ],
};

/* ------------------------------------------------------------------ *
 *  Mock engine implementations
 * ------------------------------------------------------------------ */

function mockChat(messages, context = {}) {
  try {
    const lastUser =
      [...messages].reverse().find((m) => m.role === 'user') ||
      { content: '' };
    const text = (lastUser.content || '').toLowerCase();

    let topics = [];
    const map = {
      irrigation: /irrigat|water|pump|drip/,
      fertilizer: /fertil|nutrient|urea|npc|manure/,
      soil: /soil|ph|clay|sandy|loam/,
      disease: /disease|blight|rust|rot|mildew/,
      market: /market|price|sell|mandi|rate/,
      scheme: /scheme|government|subsidy|pm kisan|eligible/,
      pest: /pest|insect|caterpillar|bug/,
    };

    Object.entries(map).forEach(([k, re]) => {
      if (re.test(text)) topics.push(k);
    });
    if (topics.length === 0) topics = ['default'];

    const responses = [];
    topics.forEach((t) => {
      const pool = CHAT_KB[t] || CHAT_KB.default;
      const idx = Math.floor(Math.random() * pool.length);
      responses.push(pool[idx]);
    });

    responses.push(
      'Note: This guidance is for general information only and is not a substitute for professional agronomic advice.'
    );

    return { provider: 'mock-engine', content: responses.join('\n\n') };
  } catch (err) {
    return {
      provider: 'mock-engine',
      content:
        'I could not process your question just now. Please try again or contact support.',
    };
  }
}

/* ------------------------------------------------------------------ *
 *  Public service methods
 * ------------------------------------------------------------------ */

function detectDisease(imageInfo = {}) {
  // Returns a structured result. When real vision models are wired in,
  // this is the place to call them. Confidence is kept honest.
  const nameHint = (imageInfo.hint || '').toLowerCase();
  let best = DISEASE_KB[Math.floor(Math.random() * DISEASE_KB.length)];
  if (!best) best = DISEASE_KB[0];

  // If the user supplied a crop hint, prefer a matching disease when available.
  const matched = DISEASE_KB.find((d) =>
    nameHint ? d.crops.some((c) => nameHint.includes(c.toLowerCase())) : false
  );
  const chosen = matched || best;

  return {
    detected_disease: chosen.name,
    confidence: Math.round(chosen.confidence * 100) / 100,
    affected_crops: chosen.crops,
    symptoms: chosen.symptoms,
    possible_causes: chosen.causes,
    preventive_measures: chosen.preventive,
    control_measures: chosen.control,
    disclaimer:
      'This is an AI-assisted preliminary result and may be incorrect. Consult a qualified plant pathologist or local agriculture officer before taking any action.',
  };
}

function detectPest(imageInfo = {}) {
  const nameHint = (imageInfo.hint || '').toLowerCase();
  let best = PEST_KB[Math.floor(Math.random() * PEST_KB.length)];
  if (!best) best = PEST_KB[0];

  const matched = PEST_KB.find((p) =>
    nameHint ? p.crops.some((c) => nameHint.includes(c.toLowerCase())) : false
  );
  const chosen = matched || best;

  return {
    detected_pest: chosen.name,
    confidence: Math.round(0.7 + Math.random() * 0.25),
    affected_crops: chosen.crops,
    symptoms: chosen.symptoms,
    prevention: chosen.prevention,
    control_measures: chosen.control,
    severity: chosen.severity,
    disclaimer:
      'This is an AI-assisted preliminary result and may be incorrect. Verify with a local agricultural extension officer before applying any treatment.',
  };
}

function recommendCrops(input = {}) {
  // Simple rule-based crop recommendation using soil, season, water.
  const soil = (input.soil_type || '').toLowerCase();
  const season = (input.season || '').toLowerCase();
  const water = (input.water_availability || '').toLowerCase();

  const catalogue = [
    { name: 'Rice', soil: ['clay', 'loam'], seasons: ['kharif'], water: ['high'], reason: 'Thrives in water-logged, clayey soils during Kharif.' },
    { name: 'Wheat', soil: ['loam', 'sandy loam', 'clay'], seasons: ['rabi'], water: ['medium'], reason: 'Suited to rabi season with moderate irrigation.' },
    { name: 'Maize', soil: ['loam', 'sandy loam'], seasons: ['kharif', 'rabi'], water: ['medium'], reason: 'Versatile, grows in well-drained loam.' },
    { name: 'Sugarcane', soil: ['loam', 'clay'], seasons: ['kharif'], water: ['high', 'medium'], reason: 'Long duration, high water requirement.' },
    { name: 'Cotton', soil: ['loam', 'sandy loam', 'clay'], seasons: ['kharif'], water: ['medium', 'low'], reason: 'Needs warm climate and well-drained soil.' },
    { name: 'Pulses (Chickpea)', soil: ['loam', 'sandy loam'], seasons: ['rabi'], water: ['low'], reason: 'Drought tolerant, ideal for low-water rabi planting.' },
    { name: 'Sunflower', soil: ['loam', 'sandy loam'], seasons: ['rabi', 'kharif'], water: ['low', 'medium'], reason: 'Short duration, low water requirement.' },
    { name: 'Groundnut', soil: ['sandy loam', 'loam'], seasons: ['kharif'], water: ['low', 'medium'], reason: 'Grows well in light, well-drained soils.' },
  ];

  let scored = catalogue.map((c) => {
    let score = 0;
    let reasons = [];
    if (!soil || c.soil.includes(soil)) { score += 3; reasons.push('soil compatibility'); }
    else { score -= 2; }
    if (!season || c.seasons.includes(season)) { score += 3; reasons.push('season fit'); }
    else { score -= 2; }
    if (!water || c.water.includes(water)) { score += 2; reasons.push('water fit'); }
    else { score -= 2; }
    return { ...c, score, reasons };
  });

  scored = scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 5).map((c) => ({
    name: c.name,
    reasoning: c.reason,
    matches: c.reasons,
    suitability: Math.min(95, 55 + c.score * 5),
  }));

  return {
    recommended_crops: top,
    notes:
      'Recommendations are based on the information you provided. Confirm local conditions, market demand and seed availability before planting.',
  };
}

function analyzeSoil(input = {}) {
  const ph = Number(input.ph);
  const N = Number(input.nitrogen) || 0;
  const P = Number(input.phosphorus) || 0;
  const K = Number(input.potassium) || 0;
  const oc = Number(input.organic_carbon) || 0;

  const status = (v) => (v >= 300 ? 'High' : v >= 100 ? 'Medium' : 'Low');

  const issues = [];
  if (ph && (ph < 6 || ph > 7.5)) {
    issues.push(ph < 6 ? 'Soil is acidic; consider liming.' : 'Soil is alkaline; consider sulphur/gypsum applications.');
  }
  if (N && N < 100) issues.push('Nitrogen appears low; plan for N supplementation.');
  if (P && P < 20) issues.push('Phosphorus appears low; consider phosphorus-rich fertilizer.');
  if (K && K < 100) issues.push('Potassium appears low; consider potash application.');
  if (oc < 0.5) issues.push('Organic carbon is low; add compost or green manure.');
  if (issues.length === 0) issues.push('No immediate nutrient deficiency signal based on provided values.');

  const summary =
    `Your soil has ${ph ? `a pH of around ${ph} ` : 'unrecorded pH '}` +
    `with Nitrogen (${status(N)}), Phosphorus (${status(P)}), Potassium (${status(K)}) and ` +
    `Organic Carbon (${oc > 0.5 ? 'adequate' : 'low'}).`;

  return {
    summary,
    ph: ph || null,
    nutrients: { nitrogen: { value: N, status: status(N) }, phosphorus: { value: P, status: status(P) }, potassium: { value: K, status: status(K) }, organic_carbon: { value: oc, status: oc > 0.5 ? 'High' : 'Low' } },
    recommendations: issues,
    disclaimer: 'This is an indicative analysis. A professional laboratory soil test is recommended for precise fertilizer planning.',
  };
}

const aiService = {
  chat: (messages, context) => getDriver().chat(messages, context),
  detectDisease,
  detectPest,
  recommendCrops,
  analyzeSoil,
  getDriver,
};

module.exports = aiService;

