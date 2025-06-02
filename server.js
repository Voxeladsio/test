// server.js
require('dotenv').config();

const cors    = require('cors');
const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const jobsRouter = require('./routes/jobs');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const profileRoutes = require('./routes/profile');
const profileEditRoutes = require('./routes/profile_edit');
const { router: authRouter } = require('./routes/auth');
const applicationsRouter = require('./routes/applications');
const meRouter = require('./routes/me');
const adminSkillTests = require('./routes/adminSkillTests');
const skillTestRoutes = require('./routes/skillTests');
const webhookRouter  = require('./routes/webhooks');







const app = express();


// connect to MongoDB (put your URI in .env as MONGODB_URI)
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

  app.use(session({
  name: 'annota.sid',
  secret: process.env.SESSION_SECRET,      // set in your .env
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60                  // 14 days
  }),
  cookie: {
    httpOnly: true,
    maxAge: 14 * 24 * 60 * 60 * 1000,       // 14 days
  }
}));

app.use(
  cors({
    origin: 'https://test-41uj.onrender.com',  // your deployed front-end host
    credentials: true                          // allow cookies (for sessions)
  })
);

// — Middlewares —

// 1) JSON + forms
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2) Static assets
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRouter);

// 3) API routes
app.use('/api/jobs', jobsRouter);

app.use('/api/profile', profileRoutes);

app.use('/api/profile', profileEditRoutes);

app.use('/api/applications', applicationsRouter);

app.use('/api/me',  meRouter);     // ← new line

app.use('/api/admin/skilltests', adminSkillTests);

app.use('/api/skilltests', skillTestRoutes);

app.use('/api/webhooks', webhookRouter);




// 4) Catch-all for SPA
app.get('/*path', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});





// — Start server —
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀  Annota server running at http://localhost:${PORT}`)
);
