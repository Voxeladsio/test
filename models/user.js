// models/user.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const baseOptions = {
  discriminatorKey: 'role',
  collection: 'users',
  timestamps: true
};

/* ── BaseUserSchema ───────────────────────────────────────────────────── */
const BaseUserSchema = new Schema(
  {
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true }
  },
  baseOptions
);

const User = mongoose.model('User', BaseUserSchema);

/* ── AnnotatorSchema ───────────────────────────────────────────────────── */
const AnnotatorSchema = new Schema({
  karma:     { type: Number, default: 0 },
  badges:    [{ type: String }],
  username:  {
    type: String,
    required: true,
    unique: true,
    match: /^[a-z0-9_]{3,20}$/
  },
  bio:       { type: String, maxlength: 500, default: '' },
  avatarUrl: { type: String, default: '' },
  skills:    [{ type: String }],

  // ← NEW: quality sub‐document
  quality: {
    score:   { type: Number, default: 0 },   // 0–100 %
    samples: { type: Number, default: 0 }    // # of submissions counted
  }
});

const Annotator = User.discriminator('annotator', AnnotatorSchema);

/* ── CompanySchema (unchanged) ──────────────────────────────────────────── */
const CompanySchema = new Schema({
  companyName: { type: String, required: true },
  bio:       { type: String, maxlength: 500, default: '' },
  website:     { type: String,  default: '' },
  logoUrl:     { type: String,  default: '' },
  verified:    { type: Boolean, default: false },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    match: /^[a-z0-9-]{3,50}$/
  }
});

CompanySchema.pre('save', function (next) {
  if (!this.slug && this.companyName) {
    this.slug = this.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

const Company = User.discriminator('company', CompanySchema);

module.exports = { User, Annotator, Company };
