const ensureAuth = require('./ensureAuth');

module.exports = [
  ensureAuth,                               // step ➊  make sure they’re logged-in
  (req, res, next) => {                     // step ➋  check role
    if (req.user.role !== 'annotator') {
      return res.status(403).json({ error: 'Annotator access only' });
    }
    next();
  }
];
