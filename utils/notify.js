// utils/notify.js
const Notification = require('../models/notification');

async function pushNotification(userId, message, type = 'SYSTEM') {
  return Notification.create({ user: userId, message, type });
}

module.exports = { pushNotification };
