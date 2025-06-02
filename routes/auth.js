/* ─────────────────────────  auth.js  ───────────────────────── */
const express  = require('express');
const bcrypt   = require('bcrypt');

// ⬇️ 1) import the three models instead of just User
const { User, Annotator, Company } = require('../models/user');
const ensureAuth = require('../middleware/ensureAuth');  // if you still want it here

const router   = express.Router();

/* POST /api/auth/register ───────────────────────────────────── */
router.post('/register', async (req, res) => {
  try {
    // ⬇️ 2) pull role + any extra fields off the body
    const { email, password, role, ...rest } = req.body;

    if (!email || !password || !role)
      return res.status(400).json({ error: 'Email, password & role required' });

    if (!['annotator', 'company'].includes(role))
      return res.status(400).json({ error: 'Invalid role' });

    const hash = await bcrypt.hash(password, 10);

    // ⬇️ 3) pick the correct discriminator model
    let Model;
    if (role === 'company') Model = Company;
    else                    Model = Annotator;   // default is annotator

    // ⬇️ 4) build the payload common + role-specific
    const payload = { email, password: hash, ...rest };

    // 5) -- will throw if required role-specific fields missing (e.g. companyName)
    const user = await Model.create(payload);

    // 6) log them in
    req.session.userId = user._id;

    res.json({ id: user._id, email: user.email, role: user.role });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

/* POST /api/auth/login ──────────────────────────────────────── */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // ⬇️ 7) query the *base* model so either role matches
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    req.session.userId = user._id;
    res.json({ id: user._id, email: user.email, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* POST /api/auth/logout ─────────────────────────────────────── */
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('annota.sid');
    res.json({ ok: true });
  });
});

/* GET /api/auth/me ──────────────────────────────────────────── */
router.get('/me', async (req, res) => {
  if (!req.session.userId) return res.json({ user: null });

  try {
    // ⬇️ 8) pull role too so the client can gate UI
    const user = await User.findById(req.session.userId)
                           .select('email role');
    if (!user) return res.json({ user: null });

    res.json({ user });
  } catch (err) {
    console.error('Error in /api/auth/me:', err);
    res.json({ user: null });
  }
});

module.exports = { router, ensureAuth };
/* ───────────────────────── end auth.js ─────────────────────── */
