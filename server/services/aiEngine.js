/**
 * KrishiMitra AI Engine & Gemini Integration
 *
 * Full multi-modal agricultural intelligence engine supporting:
 * 1. Conversational Advisory (Hindi & English) via Gemini 1.5 Flash / Mock Engine
 * 2. Visual Plant Disease Detection via Gemini Vision
 * 3. Visual Crop Pest Identification via Gemini Vision
 * 4. Agronomic Crop Recommendation Engine
 * 5. Soil Nutrient & pH Health Analyzer
 *
 * Gracefully falls back to localized offline knowledge bases if offline or API key is missing.
 */

const env = require('../config/env');

const GEMINI_MODEL = 'gemini-3.6-flash';

const GEMINI_SYSTEM_PROMPT = `You are KrishiMitra, an expert agricultural scientist and friendly digital companion for Indian farmers.
Your goal is to provide concise, scientifically accurate, and practical advice tailored to Indian agricultural conditions.
Key principles:
1. Language: Answer in the same language the farmer writes in (Hindi / English / Hinglish).
2. Style: Simple, respectful, clear, and actionable (3–5 sentences).
3. Core Areas: Crop advisory, soil management, pest & disease control (IPM), irrigation, mandi price strategies, and government schemes (e.g., PM-KISAN, PMFBY).
4. Safety: For high-risk chemical treatments, always advise wearing protection and consulting the local Krishi Vigyan Kendra (KVK).`;

/* ------------------------------------------------------------------ *
 *  Gemini API Core Helpers
 * ------------------------------------------------------------------ */

function isGeminiEnabled() {
  return (env.AI_PROVIDER || '').toLowerCase() === 'gemini' && !!env.AI_API_KEY;
}

async function callGemini(contents, systemInstruction = GEMINI_SYSTEM_PROMPT, generationConfig = {}) {
  const apiKey = env.AI_API_KEY;
  const baseUrl = env.AI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
  const url = `${baseUrl}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    contents,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1024,
      ...generationConfig,
    },
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API returned status ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text.trim();
}

/**
 * Parses JSON output from Gemini, handling markdown code fences if present.
 */
function extractJSON(text) {
  try {
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch (_) {}
    }
    return null;
  }
}

/* ------------------------------------------------------------------ *
 *  1. Conversational Chat Engine
 * ------------------------------------------------------------------ */

function normalizeMessages(input) {
  if (Array.isArray(input)) {
    return input.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || '' }],
    }));
  }
  if (typeof input === 'object' && input !== null) {
    const history = input.history || [];
    const contents = history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || '' }],
    }));
    if (input.latest) {
      contents.push({ role: 'user', parts: [{ text: input.latest }] });
    }
    return contents;
  }
  if (typeof input === 'string') {
    return [{ role: 'user', parts: [{ text: input }] }];
  }
  return [{ role: 'user', parts: [{ text: 'Hello' }] }];
}

async function chat(messages, context = {}) {
  if (isGeminiEnabled()) {
    try {
      const contents = normalizeMessages(messages);
      const reply = await callGemini(contents, GEMINI_SYSTEM_PROMPT);
      if (reply) {
        return { provider: 'gemini', content: reply };
      }
    } catch (err) {
      console.warn('[AI Engine] Gemini chat call failed, falling back to mock:', err.message);
    }
  }
  return mockChat(messages, context);
}

/* ------------------------------------------------------------------ *
 *  2. Vision-Based Disease Detection (Gemini Vision + Fallback)
 * ------------------------------------------------------------------ */

async function detectDisease(imageInfo = {}) {
  const { buffer, mimetype = 'image/jpeg', hint = '' } = imageInfo;

  if (isGeminiEnabled() && buffer) {
    try {
      const base64Data = Buffer.isBuffer(buffer) ? buffer.toString('base64') : buffer;
      const prompt = `Analyze this crop leaf/plant image for agricultural diseases.
${hint ? `Farmer note / Crop type: "${hint}".` : ''}
Respond ONLY in valid JSON format with this exact structure:
{
  "detected_disease": "Name of the disease or 'Healthy Crop'",
  "confidence": 0.88,
  "affected_crops": ["Wheat", "Barley"],
  "symptoms": "Detailed visual symptoms observed on leaf",
  "possible_causes": "Fungal/bacterial/viral cause & weather triggers",
  "preventive_measures": "Cultural and preventive steps",
  "control_measures": "Safe organic & chemical treatments with dosages",
  "disclaimer": "This is an AI-assisted diagnosis. Verify with local Krishi Vigyan Kendra before chemical application."
}`;

      const contents = [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimetype,
                data: base64Data,
              },
            },
          ],
        },
      ];

      const raw = await callGemini(contents, 'You are an expert plant pathologist. Return ONLY JSON.');
      const parsed = extractJSON(raw);
      if (parsed && parsed.detected_disease) {
        return {
          provider: 'gemini-vision',
          detected_disease: parsed.detected_disease,
          confidence: Number(parsed.confidence) || 0.85,
          affected_crops: Array.isArray(parsed.affected_crops) ? parsed.affected_crops : [hint || 'General Crop'],
          symptoms: parsed.symptoms || 'Visual lesions and leaf discoloration observed.',
          possible_causes: parsed.possible_causes || 'Environmental stress or fungal pathogen.',
          preventive_measures: parsed.preventive_measures || 'Ensure good airflow, avoid waterlogging, and rotate crops.',
          control_measures: parsed.control_measures || 'Apply recommended organic fungicide (e.g. neem oil or copper oxychloride).',
          disclaimer: parsed.disclaimer || 'This is an AI-assisted preliminary diagnosis. Verify with an agricultural officer.',
        };
      }
    } catch (err) {
      console.warn('[AI Engine] Gemini vision disease detection failed, falling back to KB:', err.message);
    }
  }

  // Fallback to Knowledge Base
  return mockDetectDisease(imageInfo);
}

/* ------------------------------------------------------------------ *
 *  3. Vision-Based Pest Detection (Gemini Vision + Fallback)
 * ------------------------------------------------------------------ */

async function detectPest(imageInfo = {}) {
  const { buffer, mimetype = 'image/jpeg', hint = '' } = imageInfo;

  if (isGeminiEnabled() && buffer) {
    try {
      const base64Data = Buffer.isBuffer(buffer) ? buffer.toString('base64') : buffer;
      const prompt = `Analyze this crop/plant image for agricultural insects and pests.
${hint ? `Farmer note / Crop type: "${hint}".` : ''}
Respond ONLY in valid JSON format with this exact structure:
{
  "detected_pest": "Name of the pest",
  "confidence": 0.85,
  "severity": "High" | "Medium" | "Low",
  "affected_crops": ["Cotton", "Tomato"],
  "symptoms": "Description of pest damage seen",
  "prevention": "Preventive cultural practices & traps",
  "control_measures": "Integrated Pest Management (IPM) controls & safe bio-sprays",
  "disclaimer": "This is an AI-assisted preliminary result. Verify with a local agricultural extension officer."
}`;

      const contents = [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimetype,
                data: base64Data,
              },
            },
          ],
        },
      ];

      const raw = await callGemini(contents, 'You are an expert agricultural entomologist. Return ONLY JSON.');
      const parsed = extractJSON(raw);
      if (parsed && parsed.detected_pest) {
        return {
          provider: 'gemini-vision',
          detected_pest: parsed.detected_pest,
          confidence: Number(parsed.confidence) || 0.82,
          severity: parsed.severity || 'Medium',
          affected_crops: Array.isArray(parsed.affected_crops) ? parsed.affected_crops : [hint || 'General Crop'],
          symptoms: parsed.symptoms || 'Feeding marks on foliage or stems.',
          prevention: parsed.prevention || 'Install yellow/blue sticky traps and monitor weekly.',
          control_measures: parsed.control_measures || 'Use Neem oil (5ml/L) or recommended IPM biocontrol agent.',
          disclaimer: parsed.disclaimer || 'AI-assisted diagnosis. Verify with local agricultural extension officer.',
        };
      }
    } catch (err) {
      console.warn('[AI Engine] Gemini vision pest detection failed, falling back to KB:', err.message);
    }
  }

  return mockDetectPest(imageInfo);
}

/* ------------------------------------------------------------------ *
 *  4. Crop Recommendation Engine
 * ------------------------------------------------------------------ */

async function recommendCrops(input = {}) {
  const soil = input.soil_type || 'Alluvial';
  const season = input.season || 'Kharif';
  const water = input.water_availability || 'Medium';
  const location = input.location || 'India';

  if (isGeminiEnabled()) {
    try {
      const prompt = `Act as an agronomy expert for Indian agriculture.
Recommend the top 4 suitable crops for these field parameters:
- Soil Type: ${soil}
- Season: ${season}
- Water Availability: ${water}
- Location / Region: ${location}

Respond ONLY in JSON format:
{
  "recommended_crops": [
    {
      "name": "Crop Name",
      "reasoning": "Clear explanation of why this crop fits this soil, season, and water level",
      "matches": ["soil fit", "season fit", "high yield potential"],
      "suitability": 90
    }
  ],
  "notes": "General agronomic advice for this planting window."
}`;

      const contents = [{ role: 'user', parts: [{ text: prompt }] }];
      const raw = await callGemini(contents, 'You are an agronomy recommendation model. Output ONLY JSON.');
      const parsed = extractJSON(raw);
      if (parsed && Array.isArray(parsed.recommended_crops) && parsed.recommended_crops.length > 0) {
        return {
          provider: 'gemini',
          recommended_crops: parsed.recommended_crops,
          notes: parsed.notes || 'Recommendations based on agro-climatic conditions. Check seed availability and mandi demand.',
        };
      }
    } catch (err) {
      console.warn('[AI Engine] Gemini crop recommendation failed, falling back to rule engine:', err.message);
    }
  }

  return mockRecommendCrops(input);
}

/* ------------------------------------------------------------------ *
 *  5. Soil Health Analysis
 * ------------------------------------------------------------------ */

async function analyzeSoil(input = {}) {
  const ph = Number(input.ph);
  const N = Number(input.nitrogen) || 0;
  const P = Number(input.phosphorus) || 0;
  const K = Number(input.potassium) || 0;
  const oc = Number(input.organic_carbon) || 0;

  if (isGeminiEnabled() && (ph || N || P || K || oc)) {
    try {
      const prompt = `Analyze these soil test parameters for an Indian farm:
- pH: ${ph || 'Not tested'}
- Nitrogen (N): ${N} kg/ha
- Phosphorus (P): ${P} kg/ha
- Potassium (K): ${K} kg/ha
- Organic Carbon: ${oc}%

Provide a concise analysis in JSON format:
{
  "summary": "2-sentence summary of soil health and fertility status",
  "recommendations": ["Actionable soil amendment 1", "Actionable fertilizer advisory 2", "Organic carbon improvement tip 3"],
  "disclaimer": "This is an indicative analysis. A laboratory soil health card is recommended for precise dosage."
}`;

      const contents = [{ role: 'user', parts: [{ text: prompt }] }];
      const raw = await callGemini(contents, 'You are a soil fertility expert. Output ONLY JSON.');
      const parsed = extractJSON(raw);
      if (parsed && parsed.summary) {
        const status = (v) => (v >= 300 ? 'High' : v >= 100 ? 'Medium' : 'Low');
        return {
          provider: 'gemini',
          summary: parsed.summary,
          ph: ph || null,
          nutrients: {
            nitrogen: { value: N, status: status(N) },
            phosphorus: { value: P, status: status(P) },
            potassium: { value: K, status: status(K) },
            organic_carbon: { value: oc, status: oc > 0.5 ? 'High' : 'Low' },
          },
          recommendations: parsed.recommendations || ['Add farmyard manure to improve organic carbon.'],
          disclaimer: parsed.disclaimer || 'Indicative soil analysis.',
        };
      }
    } catch (err) {
      console.warn('[AI Engine] Gemini soil analysis failed, falling back to rule engine:', err.message);
    }
  }

  return mockAnalyzeSoil(input);
}

/* ------------------------------------------------------------------ *
 *  Knowledge Base Fallbacks (Offline Mock Engine)
 * ------------------------------------------------------------------ */

const DISEASE_KB = [
  {
    name: 'Wheat Rust (Leaf Rust)',
    crops: ['Wheat'],
    symptoms: 'Orange-brown powdery pustules on leaves, yellowing, reduced grain filling.',
    causes: 'Caused by Puccinia fungus. Spreads via wind-borne spores in humid conditions.',
    preventive: 'Use resistant varieties, ensure proper crop spacing, avoid excess nitrogen.',
    control: 'Apply approved fungicides (e.g., Propiconazole / Mancozeb) as per local expert guidance.',
    confidence: 0.88,
  },
  {
    name: 'Rice Blast',
    crops: ['Rice'],
    symptoms: 'Diamond-shaped lesions with grey centres on leaves, neck blast on panicles.',
    causes: 'Magnaporthe oryzae fungus, favoured by high humidity and excess nitrogen.',
    preventive: 'Use resistant cultivars, balanced fertilization, avoid dense planting.',
    control: 'Apply Tricyclazole or validamycin early. Consult local agriculture officer.',
    confidence: 0.85,
  },
  {
    name: 'Tomato Early & Late Blight',
    crops: ['Tomato', 'Potato'],
    symptoms: 'Dark concentric rings or water-soaked lesions on leaves, stems, and fruits.',
    causes: 'Alternaria solani / Phytophthora infestans in wet, humid conditions.',
    preventive: 'Good air circulation, drip irrigation, remove infected plant debris promptly.',
    control: 'Spray copper oxychloride (2.5g/L) or Mancozeb every 7–10 days.',
    confidence: 0.84,
  },
  {
    name: 'Powdery Mildew',
    crops: ['Pumpkin', 'Cucumber', 'Squash', 'Grapes', 'Peas'],
    symptoms: 'White talcum-like powdery coating on leaf surfaces, leaf curling.',
    causes: 'Erysiphe species; thrives in warm days and cool humid nights.',
    preventive: 'Ensure adequate sunlight and air circulation, avoid dense canopies.',
    control: 'Apply wettable sulfur (2g/L) or neem-based biofungicide in the evening.',
    confidence: 0.86,
  },
  {
    name: 'Cotton Leaf Curl Virus',
    crops: ['Cotton'],
    symptoms: 'Upward/downward leaf curling, thickened veins, enations under leaves.',
    causes: 'Begomovirus transmitted by the whitefly vector.',
    preventive: 'Grow CLCuD tolerant hybrids, remove weed hosts around field borders.',
    control: 'Control whiteflies using yellow sticky traps and neem seed kernel extract (NSKE 5%).',
    confidence: 0.82,
  },
];

const PEST_KB = [
  {
    name: 'Aphid (Green / Blackfly)',
    crops: ['Mustard', 'Wheat', 'Cotton', 'Chilli', 'Vegetables'],
    symptoms: 'Clusters of small soft insects under leaves, sticky honeydew, sooty mold.',
    prevention: 'Preserve natural predators like ladybird beetles; avoid excess urea.',
    control: 'Spray Neem oil (3-5ml/L) with soap solution or Dimethoate 30 EC.',
    severity: 'Medium',
  },
  {
    name: 'Cotton Bollworm (Helicoverpa)',
    crops: ['Cotton', 'Tomato', 'Chickpea', 'Maize'],
    symptoms: 'Bored holes in bolls and pods with fecal frass, premature drop.',
    prevention: 'Erect pheromone traps (5/acre) and grow marigold trap crops.',
    control: 'Spray NPV (nuclear polyhedrosis virus) or Emamectin benzoate per label.',
    severity: 'High',
  },
  {
    name: 'Fall Armyworm (FAW)',
    crops: ['Maize', 'Sorghum', 'Sugarcane'],
    symptoms: 'Shot holes on leaves, whorl feeding, large sawdust-like frass.',
    prevention: 'Early synchronized sowing, intercropping with pulses, bird perches.',
    control: 'Whorl application of neem formulation or Spinetoram / Chlorantraniliprole.',
    severity: 'High',
  },
  {
    name: 'Brown Plant Hopper (BPH)',
    crops: ['Rice (Paddy)'],
    symptoms: 'Circular patches of drying plants called "hopper burn", yellowing.',
    prevention: 'Alternate wetting and drying (AWD) water management; avoid dense planting.',
    control: 'Drain excess water; spray Pymetrozine or Triflumezopyrim directed at base.',
    severity: 'High',
  },
  {
    name: 'Whitefly',
    crops: ['Cotton', 'Tomato', 'Chilli', 'Brinjal'],
    symptoms: 'Chlorotic spots, leaf curling, vector for viral diseases.',
    prevention: 'Install yellow sticky traps (10-12/acre) early in the season.',
    control: 'Spray Neem-based formulations (10,000 ppm @ 1ml/L) or Diafenthiuron.',
    severity: 'Medium',
  },
];

function mockChat(messages) {
  const contents = normalizeMessages(messages);
  const lastUserMsg = [...contents].reverse().find((m) => m.role === 'user');
  const text = (lastUserMsg?.parts?.[0]?.text || '').toLowerCase();

  const isHindi = /[\u0900-\u097F]/.test(text) || /kheti|fasal|pani|khad|mandi|keet|rog/i.test(text);

  if (text.includes('soil') || text.includes('mitti') || text.includes('मिट्टी')) {
    return {
      provider: 'mock-engine',
      content: isHindi
        ? 'मिट्टी की उर्वरता बनाए रखने के लिए फसल चक्र अपनाएं और गोबर की सड़ी खाद (FYM) या कम्पोस्ट का प्रयोग करें। बुवाई से पहले मृदा परीक्षण (Soil Test) अवश्य कराएं।'
        : 'To maintain soil fertility, adopt crop rotation and incorporate organic manure (compost/FYM). Always conduct a soil test before applying chemical fertilizers.',
    };
  }
  if (text.includes('weather') || text.includes('rain') || text.includes('mausam') || text.includes('मौसम') || text.includes('बारिश')) {
    return {
      provider: 'mock-engine',
      content: isHindi
        ? 'मौसम के पूर्वानुमान के अनुसार यदि बारिश की संभावना हो तो सिंचाई और कीटनाशक छिड़काव 1-2 दिन टाल दें। खेत में जल निकासी की व्यवस्था सुनिश्चित करें।'
        : 'If rain is forecasted in your area, hold off on irrigation and chemical spraying for 1–2 days. Ensure proper drainage in low-lying fields.',
    };
  }
  if (text.includes('price') || text.includes('mandi') || text.includes('bhav') || text.includes('भाव') || text.includes('मंडी')) {
    return {
      provider: 'mock-engine',
      content: isHindi
        ? 'उपज बेचने से पहले निकटतम 2–3 मंडियों के दैनिक भावों की तुलना करें। कृषिमित्र के मंडी भाव अनुभाग में आज के लाइव भाव देख सकते हैं।'
        : 'Compare modal prices across nearby APMC mandis before loading your cart. Check our Market Prices section for live trends.',
    };
  }
  if (text.includes('disease') || text.includes('pest') || text.includes('keet') || text.includes('bimari') || text.includes('कीट') || text.includes('रोग')) {
    return {
      provider: 'mock-engine',
      content: isHindi
        ? 'कीट व रोग नियंत्रण के लिए नीम तेल (5ml प्रति लीटर) का छिड़काव प्राथमिक उपाय है। गंभीर संक्रमण पर कृषि विशेषज्ञ की सलाह अनुसार अनुशंसित दवा का प्रयोग करें।'
        : 'For early pest and disease control, a 5ml/L neem oil spray is an effective preventive measure. For severe outbreaks, use target-specific recommended treatments.',
    };
  }

  return {
    provider: 'mock-engine',
    content: isHindi
      ? 'नमस्ते! 🙏 मैं कृषिमित्र हूँ। आप मुझसे फसल चयन, खाद, सिंचाई, मौसम, कीट प्रबंधन व सरकारी योजनाओं के बारे में पूछ सकते हैं।'
      : 'Namaste! 🙏 I am KrishiMitra. Ask me anything about crop selection, fertilizer doses, weather, disease diagnosis, or mandi prices.',
  };
}

function mockDetectDisease(imageInfo = {}) {
  const nameHint = (imageInfo.hint || '').toLowerCase();
  let match = DISEASE_KB.find((d) => nameHint && d.crops.some((c) => nameHint.includes(c.toLowerCase())));
  const chosen = match || DISEASE_KB[Math.floor(Math.random() * DISEASE_KB.length)];

  return {
    provider: 'mock-engine',
    detected_disease: chosen.name,
    confidence: chosen.confidence,
    affected_crops: chosen.crops,
    symptoms: chosen.symptoms,
    possible_causes: chosen.causes,
    preventive_measures: chosen.preventive,
    control_measures: chosen.control,
    disclaimer: 'This is an offline AI-assisted preliminary result. Consult a local agriculture officer before taking action.',
  };
}

function mockDetectPest(imageInfo = {}) {
  const nameHint = (imageInfo.hint || '').toLowerCase();
  let match = PEST_KB.find((p) => nameHint && p.crops.some((c) => nameHint.includes(c.toLowerCase())));
  const chosen = match || PEST_KB[Math.floor(Math.random() * PEST_KB.length)];

  return {
    provider: 'mock-engine',
    detected_pest: chosen.name,
    confidence: 0.82,
    severity: chosen.severity,
    affected_crops: chosen.crops,
    symptoms: chosen.symptoms,
    prevention: chosen.prevention,
    control_measures: chosen.control,
    disclaimer: 'This is an offline AI-assisted preliminary result. Verify with an agricultural extension officer.',
  };
}

function mockRecommendCrops(input = {}) {
  const soil = (input.soil_type || '').toLowerCase();
  const season = (input.season || '').toLowerCase();
  const water = (input.water_availability || '').toLowerCase();

  const catalogue = [
    { name: 'Rice (Paddy)', soil: ['clay', 'alluvial', 'loam'], seasons: ['kharif'], water: ['high'], reason: 'Suited for high water retention soils during Kharif season.' },
    { name: 'Wheat', soil: ['alluvial', 'loam', 'clay'], seasons: ['rabi'], water: ['medium'], reason: 'Excellent for rabi season in fertile loam and alluvial plains.' },
    { name: 'Cotton', soil: ['black', 'regur', 'loam'], seasons: ['kharif'], water: ['medium', 'low'], reason: 'Deep black soil provides ideal moisture for boll development.' },
    { name: 'Soybean', soil: ['black', 'loam', 'alluvial'], seasons: ['kharif'], water: ['medium'], reason: 'High market demand and fixes atmospheric nitrogen in soil.' },
    { name: 'Chickpea (Gram)', soil: ['sandy loam', 'red', 'loam'], seasons: ['rabi'], water: ['low'], reason: 'Drought-hardy legume ideal for moisture-conserving rabi farming.' },
    { name: 'Groundnut', soil: ['sandy', 'red', 'loam'], seasons: ['kharif', 'zaid'], water: ['low', 'medium'], reason: 'Performs best in light, loose soils that allow easy pod pegging.' },
    { name: 'Maize', soil: ['loam', 'alluvial', 'sandy loam'], seasons: ['kharif', 'rabi'], water: ['medium'], reason: 'Versatile crop suitable for well-drained fertile soils.' },
    { name: 'Mustard', soil: ['alluvial', 'loam', 'sandy'], seasons: ['rabi'], water: ['low', 'medium'], reason: 'Low irrigation requirement with stable market support.' },
  ];

  let scored = catalogue.map((c) => {
    let score = 0;
    let reasons = [];
    if (!soil || c.soil.some((s) => soil.includes(s))) { score += 3; reasons.push('soil compatibility'); }
    if (!season || c.seasons.some((s) => season.includes(s))) { score += 3; reasons.push('season fit'); }
    if (!water || c.water.some((w) => water.includes(w))) { score += 2; reasons.push('water fit'); }
    return { ...c, score, reasons };
  });

  scored = scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 4).map((c) => ({
    name: c.name,
    reasoning: c.reason,
    matches: c.reasons,
    suitability: Math.min(96, 60 + c.score * 5),
  }));

  return {
    provider: 'mock-engine',
    recommended_crops: top,
    notes: 'Recommendations based on regional soil and season suitability. Confirm seed quality and local market demand before sowing.',
  };
}

function mockAnalyzeSoil(input = {}) {
  const ph = Number(input.ph);
  const N = Number(input.nitrogen) || 0;
  const P = Number(input.phosphorus) || 0;
  const K = Number(input.potassium) || 0;
  const oc = Number(input.organic_carbon) || 0;

  const status = (v) => (v >= 300 ? 'High' : v >= 100 ? 'Medium' : 'Low');

  const issues = [];
  if (ph && ph < 6.0) issues.push('Soil is acidic (pH < 6.0); consider applying agricultural lime.');
  if (ph && ph > 7.8) issues.push('Soil is alkaline (pH > 7.8); apply gypsum or organic compost.');
  if (N && N < 120) issues.push('Nitrogen is low; plan for green manuring or split urea application.');
  if (P && P < 25) issues.push('Phosphorus is low; apply DAP or Single Super Phosphate (SSP).');
  if (K && K < 120) issues.push('Potassium is low; consider MOP (Muriate of Potash) application.');
  if (oc && oc < 0.5) issues.push('Organic carbon is low; incorporate cow dung manure or vermicompost.');
  if (issues.length === 0) issues.push('Nutrient values appear in good balance for general field crops.');

  const summary =
    `Your soil pH is ${ph ? ph : 'unrecorded'}, with Nitrogen (${status(N)}), ` +
    `Phosphorus (${status(P)}), Potassium (${status(K)}), and Organic Carbon (${oc >= 0.5 ? 'adequate' : 'low'}).`;

  return {
    provider: 'mock-engine',
    summary,
    ph: ph || null,
    nutrients: {
      nitrogen: { value: N, status: status(N) },
      phosphorus: { value: P, status: status(P) },
      potassium: { value: K, status: status(K) },
      organic_carbon: { value: oc, status: oc >= 0.5 ? 'Adequate' : 'Low' },
    },
    recommendations: issues,
    disclaimer: 'This is an indicative analysis. A laboratory soil health card is recommended for precise dosage.',
  };
}

/* ------------------------------------------------------------------ *
 *  Public Engine Interface
 * ------------------------------------------------------------------ */

const aiService = {
  chat,
  detectDisease,
  detectPest,
  recommendCrops,
  analyzeSoil,
  isGeminiEnabled,
};

module.exports = aiService;
