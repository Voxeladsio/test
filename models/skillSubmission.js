const { Schema, model, Types } = require('mongoose');

const SkillSubmissionSchema = new Schema({
  test:     { type: Types.ObjectId, ref: 'SkillTest', required: true },
  user:     { type: Types.ObjectId, ref: 'User',      required: true },
  passed:   { type: Boolean, default: false },
  accuracy: { type: Number }                // will use in Chunk 4
}, { timestamps: true });

module.exports = model('SkillSubmission', SkillSubmissionSchema);
