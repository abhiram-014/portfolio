const path = require('path');
const fs = require('fs');
const config = require('../config');

let s3Client = null;
if (config.STORAGE_DRIVER === 's3' && config.S3_BUCKET && config.S3_ACCESS_KEY_ID && config.S3_SECRET_ACCESS_KEY) {
  try {
    const { S3Client } = require('@aws-sdk/client-s3');
    const s3Config = {
      region: config.S3_REGION || 'auto',
      credentials: {
        accessKeyId: config.S3_ACCESS_KEY_ID,
        secretAccessKey: config.S3_SECRET_ACCESS_KEY
      }
    };
    if (config.S3_ENDPOINT) {
      s3Config.endpoint = config.S3_ENDPOINT;
    }
    s3Client = new S3Client(s3Config);
    console.log(`[STORAGE] S3/Cloudflare R2 Storage initialized for bucket "${config.S3_BUCKET}"`);
  } catch (err) {
    console.error('[STORAGE] Failed to initialize S3/R2 client, falling back to local storage:', err.message);
  }
}

const StorageProvider = {
  /**
   * Save uploaded file to persistent storage (Cloudflare R2, AWS S3, or Local Disk)
   */
  saveFile: async (fileBuffer, originalName, mimetype) => {
    const isVideo = mimetype.startsWith('video/');
    const ext = path.extname(originalName).toLowerCase();
    const cleanName = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueName = `${cleanName}_${Date.now()}_${Math.round(Math.random() * 1e5)}${ext}`;
    const subfolder = isVideo ? 'videos' : 'images';

    // 1. Cloudflare R2 / AWS S3 Cloud Storage
    if (s3Client && config.STORAGE_DRIVER === 's3') {
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      const key = `uploads/${subfolder}/${uniqueName}`;

      const command = new PutObjectCommand({
        Bucket: config.S3_BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: mimetype
      });

      await s3Client.send(command);

      const publicUrl = config.CDN_BASE_URL
        ? `${config.CDN_BASE_URL}/${key}`
        : `${config.S3_ENDPOINT ? config.S3_ENDPOINT : `https://${config.S3_BUCKET}.s3.${config.S3_REGION}.amazonaws.com`}/${config.S3_BUCKET}/${key}`;

      return {
        filename: uniqueName,
        url: publicUrl,
        driver: 's3'
      };
    }

    // 2. Local Disk Storage
    const destDir = path.join(config.UPLOADS_DIR, subfolder);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const filePath = path.join(destDir, uniqueName);
    fs.writeFileSync(filePath, fileBuffer);

    return {
      filename: uniqueName,
      url: `/uploads/${subfolder}/${uniqueName}`,
      driver: 'local'
    };
  },

  /**
   * Delete media file from persistent storage to prevent orphaned files
   */
  deleteFile: async (fileUrl) => {
    if (!fileUrl || typeof fileUrl !== 'string') return;

    // 1. Delete from S3 / Cloudflare R2
    if (s3Client && config.STORAGE_DRIVER === 's3') {
      try {
        const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
        
        // Extract key from URL
        let key = '';
        if (config.CDN_BASE_URL && fileUrl.startsWith(config.CDN_BASE_URL)) {
          key = fileUrl.replace(`${config.CDN_BASE_URL}/`, '');
        } else if (fileUrl.includes(`/${config.S3_BUCKET}/`)) {
          key = fileUrl.split(`/${config.S3_BUCKET}/`)[1];
        } else if (fileUrl.includes('uploads/')) {
          key = fileUrl.substring(fileUrl.indexOf('uploads/'));
        }

        if (key) {
          const command = new DeleteObjectCommand({
            Bucket: config.S3_BUCKET,
            Key: key
          });
          await s3Client.send(command);
          console.log(`[STORAGE] Deleted R2/S3 object: ${key}`);
        }
      } catch (err) {
        console.warn(`[STORAGE WARNING] Failed to delete S3/R2 file: ${err.message}`);
      }
      return;
    }

    // 2. Delete from Local Storage
    if (fileUrl.startsWith('/uploads/')) {
      try {
        const localPath = path.join(config.ROOT_DIR, fileUrl);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
          console.log(`[STORAGE] Deleted local file: ${localPath}`);
        }
      } catch (err) {
        console.warn(`[STORAGE WARNING] Failed to delete local file: ${err.message}`);
      }
    }
  }
};

module.exports = StorageProvider;
