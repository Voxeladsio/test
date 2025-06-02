// routes/profile_edit.js
const express    = require('express');
const slugify    = require('slugify');                 // npm i slugify
const { Annotator, Company } = require('../models/user');
const ensureAuth = require('../middleware/ensureAuth');
const router     = express.Router();

/* -----------------------------------------------------------
   PUT /api/profile/me
   ----------------------------------------------------------- */
router.put('/me', ensureAuth, async (req, res) => {
  try {
    const isCompany = req.user.role === 'company';

    /* 1️⃣  Build a whitelist ---------------------------------- */
    const allowed = isCompany
      ? ['companyName', 'bio', 'website', 'logoUrl']
      : ['username', 'bio', 'skills', 'avatarUrl'];

    const payload = {};
    allowed.forEach(k => {
      if (k in req.body) payload[k] = req.body[k];
    });

    /* 2️⃣  Extra logic for companies ------------------------- */
    if (isCompany && 'companyName' in payload) {
      // regenerate slug only if the name actually changed
      const newSlug = slugify(payload.companyName, { lower:true, strict:true });
      payload.slug = newSlug;
    }

    /* 3️⃣  Choose the discriminator model -------------------- */
    const Model   = isCompany ? Company : Annotator;

    const updated = await Model.findByIdAndUpdate(
      req.user._id,
      payload,
      { new:true, runValidators:true }
    ).select('-password -email -__v');     // redact sensitive fields

    res.json(updated);
  } catch (err) {
    // duplicate key errors come through as E11000
    if (err.code === 11000) {
      const dupKey = Object.keys(err.keyPattern)[0];
      return res.status(409).json({ error: `${dupKey} already in use` });
    }
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
