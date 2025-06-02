// routes/webhooks.js
const express = require('express');
const router  = express.Router();
const SkillTest       = require('../models/skillTest');
const SkillSubmission = require('../models/skillSubmission');
const { bumpQuality } = require('../utils/quality');
const { awardKarma }  = require('../utils/karma');
const { pushNotification } = require('../utils/notify');
const grade           = require('../utils/grader');

router.post('/ls', express.json(), async (req, res) => {
  // 🔥 Dump the entire payload so we can inspect its shape:
  console.log('▶️ LS webhook payload:', JSON.stringify(req.body, null, 2));

  try {
    // … rest of your code below (we’ll update it next) …
    res.json({ ok: true });
  } catch (err) {
    console.error('❌ Webhook /api/webhooks/ls error:', err);
    res.status(500).json({ error: 'Server error in webhook' });
  }
});

module.exports = router;
