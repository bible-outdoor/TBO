require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

// --- Route imports ---
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const eventRoutes = require('./routes/events');
const donationRoutes = require('./routes/donations');
const donationsPublicRoutes = require('./routes/donationsPublic');
const mediaRoutes = require('./routes/media');
const sermonRoutes = require('./routes/sermons');
const libraryRoutes = require('./routes/library');
const logRoutes = require('./routes/logs');
const contactsRoutes = require('./routes/contacts');
const settingsRoutes = require('./routes/settings');
const contactRepliesRoutes = require('./routes/contactReplies');
const pastorMsgsRoutes = require('./routes/pastorMsgs');
const testimoniesRoutes = require('./routes/testimonies');
const membersRoutes = require('./routes/members');

const app = express();

// --- Trust proxy (required for rate limiting behind Render proxy) ---
// Configure trust proxy more specifically for Render
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Trust first proxy (Render)
} else {
  app.set('trust proxy', false); // Don't trust proxy in development
}

// --- CORS: Restrict to frontend domains (update before production!) ---
const allowedOrigins = [
  'https://tbo-qyda.onrender.com', // Production (without trailing slash)
  'https://tbo-qyda.onrender.com/', // Production (with trailing slash)
  'http://127.0.0.1:3000', // Dev (added for completeness)
  'http://127.0.0.1:4000', // Dev (added for completeness)
  'http://127.0.0.1:5500', // Dev (your current frontend)
  'https://bibleoutdoor.netlify.app', // Netlify production (added for CORS)
  'https://yourdomain.com', // TODO: Replace with your production domain
];
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS policy: This origin is not allowed.'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// --- Rate Limiting for Auth Endpoints ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Increased limit to be less restrictive during testing
  message: { error: 'Too many attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Improved key generator for proxy environments
  keyGenerator: (req) => {
    // Get the real IP from various headers that proxies might set
    const forwarded = req.headers['x-forwarded-for'];
    const real = req.headers['x-real-ip'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : 
               real || req.ip || req.connection.remoteAddress || 'unknown';
    return ip;
  },
  // Custom handler for when limit is exceeded
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again in 15 minutes.'
    });
  },
  // Skip rate limiting in development
  skip: (req) => process.env.NODE_ENV === 'development'
});
app.use('/api/auth/login', authLimiter);
app.use('/api/members/login', authLimiter);
app.use('/api/members/register', authLimiter);
app.use('/api/members/verify', authLimiter);
// Add more as needed (e.g., /api/users/login, /api/users/register)

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- API routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/donations/public', donationsPublicRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/sermons', sermonRoutes);
app.use('/api/logs', logRoutes); // For frontend compatibility
app.use('/api/activitylog', logRoutes); // For frontend compatibility
app.use('/api/contacts', contactsRoutes);
app.use('/api/contactReplies', contactRepliesRoutes);
app.use('/api/pastorMsgs', pastorMsgsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/testimonies', testimoniesRoutes);
app.use('/api/members', membersRoutes);

// --- Serve static frontend files ---
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));

// --- DB connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(()=>console.log('MongoDB connected'))
  .catch(err=>console.error('MongoDB connection error:', err));

// --- Cloudinary config ---
require('./utils/cloudinary'); // Ensure config loads at startup

// --- Test Gmail connection on startup ---
const { testGmailConnection } = require('./utils/mailer');
setTimeout(async () => {
  console.log('\n📧 Testing Gmail configuration...');
  await testGmailConnection();
  console.log('📧 Gmail test completed\n');
}, 3000); // Wait 3 seconds after server start

// --- Server start ---
app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
app.get('/', (req, res) => res.send('Admin backend running!'));