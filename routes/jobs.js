// routes/jobs.js
const express = require('express');
const router  = express.Router();
const Job     = require('../models/job');
const { ensureAuth } = require('./auth');

// GET /api/jobs — return all jobs (most recent first)
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/jobs/my — list only this user’s jobs
router.get('/my', ensureAuth, async (req, res) => {
  try {
    const jobs = await Job.find({ owner: req.session.userId }).sort('-createdAt');
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/jobs/:slug — get a single job by slug
router.get('/:slug', async (req, res) => {
  try {
    const job = await Job.findOne({ slug: req.params.slug });
    console.log(job)
    if (!job) return res.status(404).json({ error: 'Not found' });
    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/jobs — create a new job listing
router.post('/', ensureAuth, async (req, res) => {
  try {
    const { title, company, description, rate, contactEmail, applyLink } = req.body;
    if (!contactEmail) {
      return res.status(400).json({ error: 'Contact email is required' });
    }

    const job = new Job({
      title,
      company,
      description,
      rate,
      contactEmail,
      applyLink,
      owner: req.session.userId
    });
    await job.save();
    res.status(201).json(job);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/jobs/:id — update fields (only if owner)
router.patch('/:id', ensureAuth, async (req, res) => {
  try {
    const updates = (({ title, company, description, rate, contactEmail, applyLink }) =>
      ({ title, company, description, rate, contactEmail, applyLink }))(req.body);

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, owner: req.session.userId },
      updates,
      { new: true, runValidators: true }
    );
    if (!job) {
      return res.status(404).json({ error: 'Not found or unauthorized' });
    }
    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Server error' });
  }
});

// DELETE /api/jobs/:id — remove listing (only if owner)
router.delete('/:id', ensureAuth, async (req, res) => {
  try {
    const result = await Job.deleteOne({ _id: req.params.id, owner: req.session.userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Not found or unauthorized' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
