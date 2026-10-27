require('dotenv').config();
const path = require('path');
const crypto = require('crypto');

const isProd = process.env.NODE_ENV === 'production';

// Production security validations
let jwtSecret = process.env.JWT_SECRET;
if (isProd) {
  if (!jwtSecret || jwtSecret.length < 32 || jwtSecret.includes('super_secret_jwt_key_video_portfolio')) {
    console.error('FATAL CONFIG ERROR: In production, JWT_SECRET must be a strong random secret with at least 32 characters.');
    process.exit(1);
  }
} else {
  if (!jwtSecret) {
    jwtSecret = 'dev_only_jwt_secret_key_video_portfolio_2026_cinematic';
  }
}

module.exports = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PROD: isProd,
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: '7d',
  ADMIN_USERNAME: (process.env.ADMIN_USERNAME || 'admin').trim(),
  ADMIN_DEFAULT_PASSWORD: process.env.ADMIN_PASSWORD || process.env.ADMIN_DEFAULT_PASSWORD || '',
  UPLOAD_MAX_VIDEO_SIZE_MB: parseInt(process.env.UPLOAD_MAX_VIDEO_SIZE_MB || '150', 10),
  UPLOAD_MAX_IMAGE_SIZE_MB: parseInt(process.env.UPLOAD_MAX_IMAGE_SIZE_MB || '15', 10),
  
  // Storage Driver: 'local' or 's3' (supports Cloudflare R2, AWS S3, Supabase, MinIO)
  STORAGE_DRIVER: process.env.STORAGE_DRIVER || 'local',
  S3_BUCKET: process.env.S3_BUCKET || '',
  S3_REGION: process.env.S3_REGION || 'auto',
  S3_ENDPOINT: process.env.S3_ENDPOINT || '',
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID || '',
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY || '',
  CDN_BASE_URL: (process.env.CDN_BASE_URL || '').replace(/\/$/, ''),

  // Allowed CORS Origins (comma-separated string or '*')
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) : '*',

  // Paths
  DATA_DIR: path.join(__dirname, '..', 'data'),
  UPLOADS_DIR: path.join(__dirname, '..', 'uploads'),
  PUBLIC_DIR: path.join(__dirname, '..', 'public'),
  ROOT_DIR: path.join(__dirname, '..')
};
