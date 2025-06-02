// routes/webhooks.js
const express          = require('express');
const router           = express.Router();
const SkillTest        = require('../models/skillTest');
const SkillSubmission  = require('../models/skillSubmission');
const { bumpQuality }  = require('../utils/quality');
const { awardKarma }   = require('../utils/karma');
const { pushNotification } = require('../utils/notify');

/**
 * gradeSingle(taskId, choice, tasks)
 *
 * - taskId:  the LS “task.id” (a number) from the webhook’s TASK or ANNOTATION payload
 * - choice:  the string the annotator picked (e.g. "Cat" or "Dog")
 * - tasks:   the full SkillTest.tasks array, each entry { id, data: { correct_answer, … } }
 *
 * Returns: 100 if choice === correct_answer for this task; otherwise 0.
 */
function gradeSingle(taskId, choice, tasks) {
  const found = tasks.find((t) => t.id === taskId);
  if (!found) return 0;
  return found.data.correct_answer === choice ? 100 : 0;
}

router.post('/ls', express.json(), async (req, res) => {
  // 1) Log the raw payload so we can inspect both TASKS_CREATED and ANNOTATION_CREATED:
  console.log('▶️ LS webhook payload:', JSON.stringify(req.body, null, 2));

  try {
    const { action } = req.body;

    // 2) Ignore the initial TASKS_CREATED webhook (no annotation yet)
    if (action === 'TASKS_CREATED') {
      return res.json({ ok: true });
    }

    // 3) Process only ANNOTATION_CREATED
    if (action === 'ANNOTATION_CREATED') {
      // 3A) Extract the top‐level "task" object (LS’s task) and "annotation" object
      const lsTask       = req.body.task;
      const lsAnnotation = req.body.annotation;

      if (!lsTask || !lsTask.data) {
        console.error('❌ Missing task.data in ANNOTATION_CREATED payload');
        return res.status(400).json({ error: 'Malformed payload: no task.data' });
      }
      if (!lsAnnotation || !Array.isArray(lsAnnotation.result)) {
        console.error('❌ Missing annotation.result in ANNOTATION_CREATED payload');
        return res.status(400).json({ error: 'Malformed payload: no annotation.result' });
      }

      // 3B) Get userId and testId from lsTask.data
      const userId = lsTask.data.user;
      const testId = lsTask.data.test;
      if (!userId || !testId) {
        console.error('❌ Missing user or test in lsTask.data:', lsTask.data);
        return res.status(400).json({ error: 'Missing user/test in payload' });
      }

      // 3C) Get the annotator’s chosen value for this single task:
      //      LS’s "annotation.result" is an array; for a single-choice task, result[0].value.choices[0] is the pick.
      const pickedChoice = lsAnnotation.result[0]?.value?.choices?.[0];
      if (typeof pickedChoice !== 'string') {
        console.error('❌ Cannot find picked choice in annotation.result:', lsAnnotation.result);
        return res.status(400).json({ error: 'Malformed annotation.result' });
      }

      // 3D) Fetch the SkillTest doc so we know its full "tasks" array and thresholds
      const testDoc = await SkillTest.findById(testId);
      if (!testDoc) {
        console.error('❌ SkillTest not found for ID:', testId);
        return res.status(404).json({ error: 'Test not found' });
      }

      // 3E) Grade this one task: 100 if correct, else 0
      const taskId      = lsTask.id;
      const oneAccuracy = gradeSingle(taskId, pickedChoice, testDoc.tasks);
      const passed      = oneAccuracy >= testDoc.passThreshold;

      // 3F) Save a SkillSubmission document for this single task attempt
      await SkillSubmission.create({
        test:     testId,
        user:     userId,
        accuracy: oneAccuracy,
        passed
      });

      // 3G) Bump the annotator’s running-average quality and send a QUALITY notification
      await bumpQuality(userId, oneAccuracy);

      // 3H) If they passed this task, award karma and send a KARMA notification
      if (passed) {
        await awardKarma(userId, testDoc.karmaReward, `passed "${testDoc.title}"`);
        await pushNotification(
          userId,
          `🎉 You passed "${testDoc.title}" (task ${taskId}) with ${oneAccuracy.toFixed(1)}%!`,
          'KARMA'
        );
      } else {
        // If they didn’t pass, still notify them of their score on this task
        await pushNotification(
          userId,
          `You scored ${oneAccuracy.toFixed(1)}% on "${testDoc.title}" (task ${taskId}). ` +
          `Threshold: ${testDoc.passThreshold}%`,
          'QUALITY'
        );
      }

      // 3I) Acknowledge LS with 200 OK
      return res.json({ ok: true });
    }

    // 4) If LS ever sends a different action, just return 200
    return res.json({ ok: true });

  } catch (err) {
    console.error('❌ Webhook /api/webhooks/ls error:', err);
    return res.status(500).json({ error: 'Server error in webhook' });
  }
});

module.exports = router;
