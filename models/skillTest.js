const { Schema, model } = require('mongoose');

const SkillTestSchema = new Schema({
  title:         { type: String, required: true },
  karmaReward:   { type: Number, default: 5 },
  passThreshold: { type: Number, default: 80 },   // percent accuracy
  interfaceXml:  { type: String, required: true },
  tasks:         { type: Array,  required: true } // ground-truth objects
}, { timestamps: true });

module.exports = model('SkillTest', SkillTestSchema);
