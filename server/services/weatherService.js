/**
 * Weather service with a local simulation fallback.
 * If a WEATHER_API_KEY is set, it attempts a real OpenWeatherMap call;
 * otherwise it returns a safe, clearly-flagged simulated forecast.
 */
const env = require('../config/env');

async function fetchWeather(city = 'Delhi', lat, lon) {
  // 1. Attempt real API if configured
  if (env.WEATHER_API_KEY) {
    try {
      const q = lat && lon ? `lat=${lat}&lon=${lon}` : `q=${encodeURIComponent(city)}`;
      const units = 'metric';
      const url = `${env.WEATHER_BASE_URL}/weather?${q}&appid=${env.WEATHER_API_KEY}&units=${units}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        return mapReal(data);
      }
    } catch (e) {
      // fall through to simulation
    }
  }

  // 2. Simulation (explicitly flagged as simulated)
  return simulate(city);
}

function mapReal(data) {
  const now = new Date();
  return {
    source: 'openweathermap',
    simulated: false,
    city: data.name,
    tempC: Math.round(data.main.temp),
    feelsLikeC: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    pressure: data.main.pressure,
    windSpeed: data.wind.speed,
    weather: (data.weather || [])[0] || { description: 'n/a' },
    forecast: [
      { label: 'Today', ...buildForecastDay(now, data.main.temp) },
    ],
    lastUpdated: now.toISOString(),
  };
}

function buildForecastDay(date, baseTemp) {
  return {
    date: date.toISOString().split('T')[0],
    tempHigh: Math.round(baseTemp + 2),
    tempLow: Math.round(baseTemp - 4),
    condition: 'Clear',
  };
}

function simulate(city = 'Your area') {
  // Deterministic pseudo-random weather for stable UI demo.
  const seed = (city || 'default').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = (n) => ((seed * 13 + n * 7) % 41) / 10 - 2; // roughly -2..2
  const today = new Date();
  const baseTemp = 28 + rand(1);
  const conditions = ['Partly Cloudy', 'Sunny', 'Light Rain', 'Cloudy', 'Clear'];
  const condition = conditions[seed % conditions.length];

  const days = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push({
      date: d.toISOString().split('T')[0],
      label: i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
      tempHigh: Math.round(baseTemp + rand(i + 2)),
      tempLow: Math.round(baseTemp - 6 + rand(i)),
      condition: conditions[(seed + i) % conditions.length],
    });
  }

  return {
    source: 'simulated',
    simulated: true,
    city,
    tempC: Math.round(baseTemp),
    feelsLikeC: Math.round(baseTemp - 1),
    humidity: 55 + (seed % 30),
    pressure: 1012 + (seed % 8),
    windSpeed: (3 + (seed % 8)).toFixed(1),
    weather: { main: condition, description: condition },
    forecast: days,
    farmingTips: farmingTipsFor(condition),
    lastUpdated: today.toISOString(),
  };
}

function farmingTipsFor(condition) {
  const tips = {
    Sunny: [
      'High evapotranspiration expected; ensure adequate irrigation for young crops.',
      'Plan harvesting during cooler morning hours to reduce produce moisture loss.',
    ],
    'Light Rain': [
      'Recent rain means irrigation can be reduced for 1–2 days.',
      'Monitor drainage to prevent waterlogging in low-lying fields.',
    ],
    Cloudy: [
      'Reduced sunlight may slow photosynthesis; be alert for fungal disease in humid conditions.',
      'Good time for transplanting and nursery activities.',
    ],
    'Partly Cloudy': [
      'Favourable conditions for spraying; follow label instructions and avoid strong wind.',
      'Ideal for sowing in most regions.',
    ],
    Clear: [
      'Great for field preparation and harvesting.',
      'Consider protective shade for sensitive nursery crops.',
    ],
  };
  return tips[condition] || ['Continue with routine farm operations.'];
}

module.exports = { fetchWeather, simulate };

