// routes/webhooks.js
const express         = require('express');
const router          = express.Router();
const SkillTest       = require('../models/skillTest');
const SkillSubmission = require('../models/skillSubmission');
const { bumpQuality } = require('../utils/quality');
const { awardKarma, PASS_TEST } = require('../utils/karma');
const { pushNotification }= require('../utils/notify');
const grade           = require('../utils/grader');

/**
 * POST /api/webhooks/ls
 *
 * Called by Label Studio whenever an annotator clicks "Submit".
 * LS payload includes:
 *   task: { id, data: { user: "<userId>", test: "<testId>", … }, … }
 *   annotations: [ { task:1, result:[…] }, … ]
 */
router.post('/ls', express.json(), async (req, res) => {
  try {
    const { task, annotations } = req.body;
    // LS puts our custom `data.user` and `data.test` into payload.task.data
    const userId = task.data.user;
    const testId = task.data.test;

    if (!userId || !testId) {
      return res.status(400).json({ error: 'Missing user or test ID in payload' });
    }

    // 1) Fetch the SkillTest to read its `tasks` array & passThreshold/karmaReward
    const testDoc = await SkillTest.findById(testId);
    if (!testDoc) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // 2) Compute accuracy via grader()
    const accuracy = grade(annotations, testDoc.tasks);
    const passed   = accuracy >= testDoc.passThreshold;   // boolean

    // 3) Save a new SkillSubmission doc
    await SkillSubmission.create({
      test:     testId,
      user:     userId,
      accuracy,
      passed
    });

    // 4) Bump quality (running average) and send notification
    await bumpQuality(userId, accuracy);

    // 5) If passed, award karma
    if (passed) {
      await awardKarma(userId, testDoc.karmaReward, `passed "${testDoc.title}"`);
      await pushNotification(userId,
        `🎉 You passed "${testDoc.title}" with ${accuracy.toFixed(1)}% accuracy!`,
        'KARMA'
      );
    } else {
      await pushNotification(userId,
        `You scored ${accuracy.toFixed(1)}% on "${testDoc.title}". (${testDoc.passThreshold}% needed)`,
        'QUALITY'
      );
    }

    // 6) Acknowledge LS: they expect a 200 OK
    res.json({ ok: true });

  } catch (err) {
    console.error('❌ Webhook /api/webhooks/ls error:', err);
    res.status(500).json({ error: 'Server error in webhook' });
  }
});

module.exports = router;
