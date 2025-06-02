// models/Job.js
const mongoose  = require('mongoose');
const slugify   = require('slugify');
const { Schema } = mongoose;

const jobSchema = new Schema({
  title:        { type: String, required: true },
  company:      { type: String, required: true },
  description:  { type: String, required: true },
  rate:         { type: Number, required: true },
  paid:         { type: Boolean, default: false },
  slug:         { type: String, unique: true },
  contactEmail: { type: String, required: true },
  applyLink:    { type: String },  // optional URL to external application form
  owner:        { type: Schema.Types.ObjectId, ref: 'User', required: true },  // ← NEW
  createdAt:    { type: Date,   default: Date.now }
});

// slug generation hook remains unchanged…
jobSchema.pre('validate', function(next) {
  if (!this.slug && this.title) {
    const base = slugify(this.title, { lower: true, strict: true });
    this.slug = `${base}-${Date.now()}`;
  }
  next();
});

module.exports = mongoose.model('Job', jobSchema);
