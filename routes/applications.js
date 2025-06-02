const router          = require('express').Router();
const Application     = require('../models/application');
const ensureAnnotator = require('../middleware/ensureAnnotator');
const { awardKarma }  = require('../utils/karma');
const { APPLY_JOB }   = require('../constants/karma');

// POST /api/applications/:jobId/apply
router.post('/:jobId/apply', ensureAnnotator, async (req, res, next) => {
  try {
    const app = await Application.create({
      job:  req.params.jobId,
      user: req.user._id
    });

    await awardKarma(req.user._id, APPLY_JOB, 'job application');
    res.status(201).json(app);                     // 201 = Created
  } catch (err) { next(err); }
});

module.exports = router;
