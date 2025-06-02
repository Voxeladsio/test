const { Annotator } = require('../models/user');
const { pushNotification } = require('./notify');

async function awardKarma(userId, delta, reason='') {
  if (!delta) return;
  await Annotator.findByIdAndUpdate(userId, { $inc: { karma: delta } });
  await pushNotification(userId, `+${delta} karma – ${reason}`, 'KARMA');
  console.log(`[KARMA] +${delta} for ${userId} → ${reason}`);
}

module.exports = { awardKarma };
