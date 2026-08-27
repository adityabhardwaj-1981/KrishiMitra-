module.exports = (req, res) => {
  res.status(200).json({ status: 'ok', service: 'KrishiMitra AI Serverless', timestamp: new Date().toISOString() });
};
