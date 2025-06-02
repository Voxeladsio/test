// routes/profile.js
const express = require('express');
const { Annotator, Company } = require('../models/user');
const router = express.Router();

/* ------------------------------------------------------------
   GET /api/profile/annotators/:username
   ------------------------------------------------------------ */
router.get('/annotators/:username', async (req, res) => {
  try {
    const doc = await Annotator.findOne({ username: req.params.username })
      // hide secure/internal stuff
      .select('-password -email -__v');
    if (!doc) return res.status(404).json({ error: 'Annotator not found' });
    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ------------------------------------------------------------
   GET /api/profile/companies/:slugOrId
   slugOrId can be Mongo _id or a custom slug field if you add one
   ------------------------------------------------------------ */
router.get('/companies/:slug', async (req, res) => {
  try {
    // prefer slug if you have one, else fall back to _id
    const query = req.params.slug.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: req.params.slug }          // 24-char hex → looks like MongoID
      : { slug: req.params.slug };        // e.g. "acme-ai"

    const doc = await Company.findOne(query).select('-password -email -__v');
    if (!doc) return res.status(404).json({ error: 'Company not found' });
    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
