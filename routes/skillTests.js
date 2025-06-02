const router            = require('express').Router();
const SkillTest         = require('../models/skillTest');
const SkillSubmission   = require('../models/skillSubmission');
const ensureAnnotator   = require('../middleware/ensureAnnotator');  // role check
const { createProject } = require('../services/ls');

// GET /api/skilltests
router.get('/', ensureAnnotator, async (req, res, next) => {
  try {
    // exclude tests the user already PASSED
    const passedIds = await SkillSubmission.distinct(
      'test',
      { user: req.user._id, passed: true }
    );

    const tests = await SkillTest.find(
      { _id: { $nin: passedIds } },          // not in passed list
      'title karmaReward passThreshold'      // projection (fields to return)
    ).sort({ createdAt: -1 });

    res.json(tests);
  } catch (err) { next(err); }
});

router.post('/:id/start', ensureAnnotator, async (req, res, next) => {
  try {
    const test = await SkillTest.findById(req.params.id);
    if (!test) return res.status(404).json({ error: 'Test not found' });

    // 1. Create a Label Studio project configured for THIS user & test.
    const { url } = await createProject(test, req.user);

    // 2. Return only the URL
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
