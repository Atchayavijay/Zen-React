// middleware/apikey.js
const apiKeyMiddleware = (req, res, next) => {
  const clientKey = req.headers['x-api-key']; // Always lowercase for headers
  const serverKey = process.env.API_KEY; // Store in .env for safety

  if (!clientKey || clientKey !== serverKey) {
    return res.status(401).json({ error: 'Invalid or missing API key.' });
  }
  next();
};

module.exports = apiKeyMiddleware;
