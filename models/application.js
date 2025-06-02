const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const ApplicationSchema = new Schema({
  job:  { type: Types.ObjectId, ref: 'Job',  required: true },
  user: { type: Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['new', 'hired', 'rejected'], default: 'new' }
}, { timestamps: true });

module.exports = mongoose.model('Application', ApplicationSchema);
