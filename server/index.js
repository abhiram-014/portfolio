const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { initializeAdmin } = require('./auth');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

const app = express();

// Trust reverse proxy (for Render / Railway / Nginx / Cloudflare IP detection)
app.set('trust proxy', 1);

// HTTP Security Headers via Helmet
app.use(helmet({
  contentSecurityPolicy: false, // Allows flexible video and font CDN embedding
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration
const corsOptions = {
  origin: config.ALLOWED_ORIGINS === '*' ? true : config.ALLOWED_ORIGINS,
  credentials: true
};
app.use(cors(corsOptions));

// Request parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Global API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // max 200 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', apiLimiter);

// Static directories
app.use(express.static(config.PUBLIC_DIR));
app.use('/photos', express.static(path.join(config.ROOT_DIR, 'photos')));
app.use('/videos', express.static(path.join(config.ROOT_DIR, 'videos')));
app.use('/uploads', express.static(config.UPLOADS_DIR));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Admin dashboard route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(config.PUBLIC_DIR, 'admin.html'));
});

// Root index fallback
app.get('/', (req, res) => {
  res.sendFile(path.join(config.PUBLIC_DIR, 'index.html'));
});

// 404 Handler for undefined API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Global Error Handler (Hides internal stack traces in production)
app.use((err, req, res, next) => {
  console.error('[UNHANDLED SERVER ERROR]', err);
  const status = err.status || 500;
  const message = config.IS_PROD ? 'Internal server error' : err.message;
  res.status(status).json({ error: message });
});

// Server Initialization
let server = null;
async function start() {
  await initializeAdmin();
  server = app.listen(config.PORT, () => {
    console.log(`====================================================`);
    console.log(`  Portfolio & Admin Server active on port ${config.PORT}`);
    console.log(`  Environment: ${config.NODE_ENV}`);
    console.log(`  Storage Driver: ${config.STORAGE_DRIVER}`);
    console.log(`  Website:     http://localhost:${config.PORT}`);
    console.log(`  Admin Panel: http://localhost:${config.PORT}/admin`);
    console.log(`====================================================`);
  });
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received. Shutting down gracefully...');
  if (server) server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
  console.log('[SERVER] SIGINT received. Shutting down gracefully...');
  if (server) server.close(() => process.exit(0));
});

start();
