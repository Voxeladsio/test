const router      = require('express').Router();
const ensureAuth  = require('../middleware/ensureAuth');   // you already have this
const Notification = require('../models/notification');

// GET /api/me/karma
router.get('/karma', ensureAuth, (req, res) => {
  res.json({ karma: req.user.karma });
});

// GET /api/me/notifications?unread=true
router.get('/notifications', ensureAuth, async (req, res) => {
  const { unread } = req.query;
  const filter = { user: req.user._id };
  if (unread === 'true') filter.isRead = false;

  const notes = await Notification.find(filter).sort({ createdAt: -1 }).limit(20);
  res.json(notes);
});

// PATCH /api/me/notifications/:id/read
router.patch('/notifications/:id/read', ensureAuth, async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, user: req.user._id },{ isRead: true });
  res.json({ ok: true });
});

module.exports = router;
