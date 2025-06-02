const ensureAuth = require('./ensureAuth');   // the one you already have

module.exports = [
  ensureAuth,                                 // 1) must be logged-in
  (req, res, next) => {                       // 2) must have admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access only' });
    }
    next();
  }
];