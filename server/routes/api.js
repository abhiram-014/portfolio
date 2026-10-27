const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');
const config = require('../config');
const StorageProvider = require('../storage/storageProvider');
const { requireAuth } = require('../middleware/authMiddleware');

// Configure Multer memory storage (allows validation + forwarding to local disk or S3)
const storage = multer.memoryStorage();

// Strict whitelist for file extensions and MIME types
const ALLOWED_VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
const ALLOWED_VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.mkv'];

const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.mimetype.startsWith('video/')) {
    if (ALLOWED_VIDEO_MIMES.includes(file.mimetype) && ALLOWED_VIDEO_EXTS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid video format (${file.mimetype}, ${ext}). Allowed: MP4, WebM, MOV`), false);
    }
  } else if (file.mimetype.startsWith('image/')) {
    if (ALLOWED_IMAGE_MIMES.includes(file.mimetype) && ALLOWED_IMAGE_EXTS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid image format (${file.mimetype}, ${ext}). Allowed: JPG, PNG, WebP, AVIF`), false);
    }
  } else {
    cb(new Error('Unsupported file type. Only videos and raster images are permitted.'), false);
  }
};

const maxUploadSize = Math.max(config.UPLOAD_MAX_VIDEO_SIZE_MB, config.UPLOAD_MAX_IMAGE_SIZE_MB) * 1024 * 1024;

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: maxUploadSize,
    files: 1
  }
});

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Get all published videos (sorted by order)
router.get('/videos', (req, res) => {
  try {
    const videos = db.getPublishedVideos();
    res.json({
      success: true,
      count: videos.length,
      data: videos
    });
  } catch (err) {
    console.error('[API ERROR] Failed to fetch public videos:', err.message);
    res.status(500).json({ error: 'Failed to retrieve portfolio videos' });
  }
});

// ==========================================
// PROTECTED ADMIN ROUTES
// ==========================================

// Get all videos (including drafts / hidden)
router.get('/admin/videos', requireAuth, (req, res) => {
  try {
    const videos = db.getVideos().sort((a, b) => (a.order || 0) - (b.order || 0));
    res.json({
      success: true,
      count: videos.length,
      data: videos
    });
  } catch (err) {
    console.error('[API ERROR] Failed to fetch admin videos:', err.message);
    res.status(500).json({ error: 'Failed to retrieve admin video list' });
  }
});

// Create video entry
router.post('/admin/videos', requireAuth, (req, res) => {
  try {
    const { title, description, videoUrl, posterUrl, category, aspectRatio, order, featured, published } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!videoUrl || typeof videoUrl !== 'string' || !videoUrl.trim()) {
      return res.status(400).json({ error: 'Video source URL is required' });
    }

    const created = db.createVideo({
      title: title.trim(),
      description: description ? String(description).trim() : '',
      videoUrl: videoUrl.trim(),
      posterUrl: posterUrl ? String(posterUrl).trim() : '',
      category: category ? String(category).trim() : 'General',
      aspectRatio: aspectRatio || 'ratio-wide',
      order: order !== undefined && !isNaN(Number(order)) ? Number(order) : undefined,
      featured: Boolean(featured),
      published: published !== undefined ? Boolean(published) : true
    });

    res.status(201).json({
      success: true,
      message: 'Video added successfully',
      data: created
    });
  } catch (err) {
    console.error('[API ERROR] Failed to create video:', err.message);
    res.status(500).json({ error: 'Failed to create video entry' });
  }
});

// Update video entry
router.put('/admin/videos/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.getVideoById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // If media URL changed, clean up previous file from storage
    if (req.body.videoUrl && req.body.videoUrl !== existing.videoUrl) {
      await StorageProvider.deleteFile(existing.videoUrl);
    }
    if (req.body.posterUrl && req.body.posterUrl !== existing.posterUrl) {
      await StorageProvider.deleteFile(existing.posterUrl);
    }

    const updated = db.updateVideo(id, req.body);
    res.json({
      success: true,
      message: 'Video updated successfully',
      data: updated
    });
  } catch (err) {
    console.error('[API ERROR] Failed to update video:', err.message);
    res.status(500).json({ error: 'Failed to update video entry' });
  }
});

// Delete video entry
router.delete('/admin/videos/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.getVideoById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Clean up associated media files from storage
    if (existing.videoUrl) {
      await StorageProvider.deleteFile(existing.videoUrl);
    }
    if (existing.posterUrl) {
      await StorageProvider.deleteFile(existing.posterUrl);
    }

    const success = db.deleteVideo(id);
    res.json({
      success,
      message: 'Video deleted successfully'
    });
  } catch (err) {
    console.error('[API ERROR] Failed to delete video:', err.message);
    res.status(500).json({ error: 'Failed to delete video entry' });
  }
});

// Reorder videos batch
router.post('/admin/videos/reorder', requireAuth, (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'orderedIds array is required' });
    }

    const reordered = db.reorderVideos(orderedIds);
    res.json({
      success: true,
      message: 'Videos reordered successfully',
      data: reordered
    });
  } catch (err) {
    console.error('[API ERROR] Failed to reorder videos:', err.message);
    res.status(500).json({ error: 'Failed to reorder videos' });
  }
});

// Upload media file (video or image) to active storage driver
router.post('/admin/upload', requireAuth, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: `File exceeds maximum upload size limit (${maxUploadSize / (1024 * 1024)}MB)` });
      }
      return res.status(400).json({ error: `Upload validation error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file was provided in the upload request' });
    }

    try {
      const saved = await StorageProvider.saveFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      res.json({
        success: true,
        message: 'File uploaded successfully',
        file: {
          filename: saved.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: saved.url,
          storage: saved.driver
        }
      });
    } catch (saveErr) {
      console.error('[STORAGE ERROR] File save failed:', saveErr.message);
      res.status(500).json({ error: 'Failed to save uploaded file to storage provider' });
    }
  });
});

module.exports = router;
