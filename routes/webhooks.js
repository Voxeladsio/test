// routes/webhooks.js
const express          = require('express');
const router           = express.Router();
const SkillTest        = require('../models/skillTest');
const SkillSubmission  = require('../models/skillSubmission');
const { bumpQuality }  = require('../utils/quality');
const { awardKarma }   = require('../utils/karma');
const { pushNotification } = require('../utils/notify');

/**
 * gradeSingle(innerId, choice, tasks)
 *
 * - innerId: the LS “inner_id” (1 or 2) that matches the original task.id you imported.
 * - choice:  the string the annotator picked (e.g. "Cat" or "Dog")
 * - tasks:   the SkillTest.tasks array, each entry has { id, data: { correct_answer, … } }
 *
 * Returns: 100 if choice === correct_answer for that innerId; otherwise 0.
 */
function gradeSingle(innerId, choice, tasks) {
  const found = tasks.find((t) => t.id === innerId);
  if (!found) return 0;
  return found.data.correct_answer === choice ? 100 : 0;
}

router.post('/ls', express.json(), async (req, res) => {
  // 1) Dump the raw payload
  console.log('▶️ LS webhook payload:', JSON.stringify(req.body, null, 2));

  try {
    const { action } = req.body;

    // 2) Ignore the initial TASKS_CREATED payload
    if (action === 'TASKS_CREATED') {
      return res.json({ ok: true });
    }

    // 3) Only handle ANNOTATION_CREATED
    if (action === 'ANNOTATION_CREATED') {
      // 3A) Extract both the LS task object and the annotation object
      const lsTask       = req.body.task;        // includes inner_id, data, etc.
      const lsAnnotation = req.body.annotation;  // includes result array

      if (!lsTask || !lsTask.data) {
        console.error('❌ Missing task.data in ANNOTATION_CREATED payload');
        return res.status(400).json({ error: 'Malformed payload: no task.data' });
      }
      if (!lsAnnotation || !Array.isArray(lsAnnotation.result)) {
        console.error('❌ Missing annotation.result in ANNOTATION_CREATED payload');
        return res.status(400).json({ error: 'Malformed payload: no annotation.result' });
      }

      // 3B) Grab the small ID you originally set (inner_id) and the choice
      const innerId      = lsTask.inner_id;  // <— this is 1 or 2, matching your SkillTest.tasks[].id
      const pickedChoice = lsAnnotation.result[0]?.value?.choices?.[0];
      if (typeof pickedChoice !== 'string') {
        console.error('❌ Cannot find picked choice in annotation.result:', lsAnnotation.result);
        return res.status(400).json({ error: 'Malformed annotation.result' });
      }

      // 3C) Extract userId and testId from task.data
      const userId = lsTask.data.user;
      const testId = lsTask.data.test;
      if (!userId || !testId) {
        console.error('❌ Missing user or test in lsTask.data:', lsTask.data);
        return res.status(400).json({ error: 'Missing user/test in payload' });
      }

      // 3D) Load the SkillTest so we know its thresholds & tasks array
      const testDoc = await SkillTest.findById(testId);
      if (!testDoc) {
        console.error('❌ SkillTest not found for ID:', testId);
        return res.status(404).json({ error: 'Test not found' });
      }

      // 3E) Grade this one annotation using the inner_id
      const oneAccuracy = gradeSingle(innerId, pickedChoice, testDoc.tasks);
      const passed      = oneAccuracy >= testDoc.passThreshold;

      // 3F) Create a SkillSubmission record
      await SkillSubmission.create({
        test:     testId,
        user:     userId,
        accuracy: oneAccuracy,
        passed
      });

      // 3G) Bump the annotator’s quality and send a QUALITY notification
      await bumpQuality(userId, oneAccuracy);

      // 3H) If passed, award karma and send a KARMA notification
      if (passed) {
        await awardKarma(userId, testDoc.karmaReward, `passed "${testDoc.title}"`);
        await pushNotification(
          userId,
          `🎉 You passed "${testDoc.title}" (task ${innerId}) with ${oneAccuracy.toFixed(1)}%!`,
          'KARMA'
        );
      } else {
        // If not passed, send a score notification
        await pushNotification(
          userId,
          `You scored ${oneAccuracy.toFixed(1)}% on "${testDoc.title}" (task ${innerId}). ` +
          `Threshold: ${testDoc.passThreshold}%`,
          'QUALITY'
        );
      }

      // 3I) Let LS know we processed it
      return res.json({ ok: true });
    }

    // 4) Any other action: just return OK
    return res.json({ ok: true });
  } catch (err) {
    console.error('❌ Webhook /api/webhooks/ls error:', err);
    return res.status(500).json({ error: 'Server error in webhook' });
  }
});

module.exports = router;
