// models/notification.js
const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const NotificationSchema = new Schema({
  user:    { type: Types.ObjectId, ref: 'User', required: true },
  type:    { type: String, enum: ['KARMA', 'QUALITY', 'SYSTEM'], default: 'SYSTEM' },
  message: { type: String, required: true },
  isRead:  { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
