// middleware/ensureAuth.js
const { User } = require('../models/user');

module.exports = async function ensureAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // attach the full user doc once so downstream routes have it
    req.user = await User.findById(req.session.userId);
    if (!req.user) {
      return res.status(401).json({ error: 'Account not found' });
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
