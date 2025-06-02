const router      = require('express').Router();
const SkillTest   = require('../models/skillTest');
const ensureAdmin = require('../middleware/ensureAdmin');   // role check

// POST /api/admin/skilltests
router.post('/', ensureAdmin, async (req, res, next) => {
  try {
    const doc = await SkillTest.create(req.body);
    res.status(201).json(doc);
  } catch (err) { next(err); }
});

module.exports = router;
