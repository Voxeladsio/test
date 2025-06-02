// utils/quality.js
const { Annotator } = require('../models/user');
const Notification  = require('../models/notification');

/**
 * bumpQuality(userId, newAccuracy)
 *
 * - Reads the annotator’s existing quality.score & samples.
 * - Computes a new running average:
 *      newScore = ((oldScore * oldSamples) + newAccuracy) / (oldSamples + 1)
 * - Increments samples by 1.
 * - Saves back to the user document.
 * - Pushes a "QUALITY" notification for the user.
 *
 * newAccuracy is a number between 0 and 100.
 */
async function bumpQuality(userId, newAccuracy) {
  // 1) Fetch the current values
  const user = await Annotator.findById(userId).select('quality').lean();
  if (!user) throw new Error('Annotator not found for quality bump');

  const oldScore   = user.quality?.score || 0;
  const oldSamples = user.quality?.samples || 0;

  // 2) Compute new running average
  const totalScore = oldScore * oldSamples + newAccuracy;
  const newSamples = oldSamples + 1;
  const newScore   = totalScore / newSamples;   // e.g., 85.5

  // 3) Persist back to Annotator doc
  await Annotator.findByIdAndUpdate(userId, {
    'quality.score':   newScore,
    'quality.samples': newSamples
  });

  // 4) Push a notification so they see their updated quality
  await Notification.create({
    user:    userId,
    type:    'QUALITY',
    message: `Your quality is now ${newScore.toFixed(1)}% (based on ${newSamples} tests)`
  });

  return newScore;
}

module.exports = { bumpQuality };
