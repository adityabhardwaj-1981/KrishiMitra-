/**
 * Weather controller.
 */
const weatherService = require('../services/weatherService');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getWeather = asyncHandler(async (req, res, next) => {
  const { city, lat, lon } = req.query;
  const data = await weatherService.fetchWeather(city || 'Delhi', lat, lon);
  return success(res, data, 'Weather information retrieved.');
});

module.exports = { getWeather };

