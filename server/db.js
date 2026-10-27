const fs = require('fs');
const path = require('path');
const config = require('./config');

// Ensure data directory exists
if (!fs.existsSync(config.DATA_DIR)) {
  fs.mkdirSync(config.DATA_DIR, { recursive: true });
}

const VIDEOS_FILE = path.join(config.DATA_DIR, 'videos.json');
const VIDEOS_BACKUP_FILE = path.join(config.DATA_DIR, 'videos.json.bak');
const USERS_FILE = path.join(config.DATA_DIR, 'users.json');

function readJSON(filePath, defaultValue = []) {
  try {
    if (!fs.existsSync(filePath)) {
      writeJSON(filePath, defaultValue, false);
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error(`[DB ERROR] Failed to parse ${filePath}:`, err.message);
    // Attempt recovery from backup if available
    const backupFile = `${filePath}.bak`;
    if (fs.existsSync(backupFile)) {
      try {
        console.warn(`[DB RECOVERY] Recovering from ${backupFile}...`);
        const backupData = fs.readFileSync(backupFile, 'utf-8');
        return JSON.parse(backupData || '[]');
      } catch (backupErr) {
        console.error(`[DB ERROR] Backup recovery failed:`, backupErr.message);
      }
    }
    return defaultValue;
  }
}

function writeJSON(filePath, data, createBackup = true) {
  try {
    const serialized = JSON.stringify(data, null, 2);
    
    // Create backup before modifying existing database
    if (createBackup && fs.existsSync(filePath)) {
      try {
        fs.copyFileSync(filePath, `${filePath}.bak`);
      } catch (e) {
        // Continue even if backup copy fails
      }
    }

    const tempFile = `${filePath}.tmp_${Date.now()}`;
    fs.writeFileSync(tempFile, serialized, 'utf-8');
    fs.renameSync(tempFile, filePath);
    return true;
  } catch (err) {
    console.error(`[DB ERROR] Failed to write ${filePath}:`, err.message);
    return false;
  }
}

const db = {
  getVideos: () => {
    return readJSON(VIDEOS_FILE, []);
  },

  getPublishedVideos: () => {
    const videos = readJSON(VIDEOS_FILE, []);
    return videos
      .filter(v => v.published !== false)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  getVideoById: (id) => {
    const videos = readJSON(VIDEOS_FILE, []);
    return videos.find(v => String(v.id) === String(id));
  },

  createVideo: (videoData) => {
    const videos = readJSON(VIDEOS_FILE, []);
    const newId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const highestOrder = videos.reduce((max, v) => Math.max(max, v.order || 0), 0);
    
    const newVideo = {
      id: newId,
      title: (videoData.title || 'Untitled Work').trim(),
      description: (videoData.description || '').trim(),
      videoUrl: (videoData.videoUrl || '').trim(),
      posterUrl: (videoData.posterUrl || '').trim(),
      category: (videoData.category || 'General').trim(),
      aspectRatio: videoData.aspectRatio || 'ratio-wide',
      order: typeof videoData.order === 'number' ? videoData.order : highestOrder + 1,
      featured: Boolean(videoData.featured),
      published: videoData.published !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    videos.push(newVideo);
    writeJSON(VIDEOS_FILE, videos);
    return newVideo;
  },

  updateVideo: (id, videoData) => {
    const videos = readJSON(VIDEOS_FILE, []);
    const index = videos.findIndex(v => String(v.id) === String(id));
    if (index === -1) return null;

    const existing = videos[index];
    const updated = {
      ...existing,
      title: videoData.title !== undefined ? videoData.title.trim() : existing.title,
      description: videoData.description !== undefined ? videoData.description.trim() : existing.description,
      videoUrl: videoData.videoUrl !== undefined ? videoData.videoUrl.trim() : existing.videoUrl,
      posterUrl: videoData.posterUrl !== undefined ? videoData.posterUrl.trim() : existing.posterUrl,
      category: videoData.category !== undefined ? videoData.category.trim() : existing.category,
      aspectRatio: videoData.aspectRatio !== undefined ? videoData.aspectRatio : existing.aspectRatio,
      order: typeof videoData.order === 'number' ? videoData.order : existing.order,
      featured: videoData.featured !== undefined ? Boolean(videoData.featured) : existing.featured,
      published: videoData.published !== undefined ? Boolean(videoData.published) : existing.published,
      updatedAt: new Date().toISOString()
    };

    videos[index] = updated;
    writeJSON(VIDEOS_FILE, videos);
    return updated;
  },

  deleteVideo: (id) => {
    const videos = readJSON(VIDEOS_FILE, []);
    const index = videos.findIndex(v => String(v.id) === String(id));
    if (index === -1) return false;

    videos.splice(index, 1);
    writeJSON(VIDEOS_FILE, videos);
    return true;
  },

  reorderVideos: (orderedIds) => {
    const videos = readJSON(VIDEOS_FILE, []);
    const videoMap = new Map(videos.map(v => [String(v.id), v]));

    orderedIds.forEach((id, index) => {
      const vid = videoMap.get(String(id));
      if (vid) {
        vid.order = index + 1;
        vid.updatedAt = new Date().toISOString();
      }
    });

    const updatedList = Array.from(videoMap.values()).sort((a, b) => (a.order || 0) - (b.order || 0));
    writeJSON(VIDEOS_FILE, updatedList);
    return updatedList;
  },

  getUsers: () => {
    return readJSON(USERS_FILE, []);
  },

  getUserByUsername: (username) => {
    const users = readJSON(USERS_FILE, []);
    return users.find(u => u.username.toLowerCase() === username.toLowerCase());
  },

  saveUser: (userData) => {
    const users = readJSON(USERS_FILE, []);
    const index = users.findIndex(u => u.id === userData.id || u.username.toLowerCase() === userData.username.toLowerCase());
    
    if (index >= 0) {
      users[index] = { ...users[index], ...userData, updatedAt: new Date().toISOString() };
    } else {
      users.push({
        id: `user_${Date.now()}`,
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    writeJSON(USERS_FILE, users);
    return true;
  }
};

module.exports = db;
