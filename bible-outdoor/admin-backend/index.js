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

// --- CORS: Restrict to frontend domains (update before production!) ---
const allowedOrigins = [
  'http://localhost:3000', // Dev
  'https://bible-outdoor-backend.onrender.com', // Production
  'http://127.0.0.1:3000', // Dev (added for completeness)
  'http://127.0.0.1:4000', // Dev (added for completeness)
  'http://127.0.0.1:5500', // Dev (your current frontend)
  'https://bespoke-caramel-a297a0.netlify.app', // Netlify production
  'https://bibleoutdoor.netlify.app', // Netlify production (added for CORS)
  'https://yourdomain.com', // TODO: Replace with your production domain
  'https://687767aeb25587993eb5382c--bibleoutdoor.netlify.app' // TODO: Replace with your production domain
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
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many attempts, please try again later.'
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
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=>console.log('MongoDB connected'))
  .catch(err=>console.error('MongoDB connection error:', err));

// --- Cloudinary config ---
require('./utils/cloudinary'); // Ensure config loads at startup

// --- Server start ---
app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
app.get('/', (req, res) => res.send('Admin backend running!'));