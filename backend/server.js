/**
 * REDDOT WORKSTATION — PRIVATE ATTACHMENT BACKEND SERVICE
 * 
 * Secure internal bridge between REDDOT desktop clients and Google Drive.
 * Keeps Google Drive completely invisible to the frontend.
 * Never exposes Drive IDs, URLs, or storage credentials to the user.
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

// Local data and vault directories
const DATA_DIR = path.join(__dirname, 'data');
const VAULT_DIR = path.join(__dirname, 'storage', 'vault');
const METADATA_FILE = path.join(DATA_DIR, 'attachments.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(VAULT_DIR)) fs.mkdirSync(VAULT_DIR, { recursive: true });
if (!fs.existsSync(METADATA_FILE)) fs.writeFileSync(METADATA_FILE, JSON.stringify({}), 'utf8');

// Multer in-memory or temp storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB max per file
  }
});

// Load Google Drive API Client if service-account or OAuth is configured
let driveClient = null;
let googleAuthType = 'none';

function initGoogleDrive() {
  if (driveClient) return driveClient;
  try {
    const credCandidates = [
      process.env.GOOGLE_APPLICATION_CREDENTIALS,
      path.join(__dirname, 'service-account.json'),
      path.join(__dirname, '..', 'backend', 'service-account.json'),
      path.join(process.resourcesPath || '', 'backend', 'service-account.json'),
      'D:\\documents\\PROJECT FILES_BP\\ANTIGRAVITY APP FILES\\wallpaper_desktop_app\\backend\\service-account.json'
    ].filter(Boolean);

    const credPath = credCandidates.find(p => fs.existsSync(p));
    if (credPath) {
      const auth = new google.auth.GoogleAuth({
        keyFile: credPath,
        scopes: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/drive.file']
      });
      driveClient = google.drive({ version: 'v3', auth });
      googleAuthType = 'service_account';
      console.log('[GDRIVE] Initialized Google Drive API using service account credentials from:', credPath);
      syncDriveFiles();
      return driveClient;
    }

    if (process.env.GDRIVE_CLIENT_ID && process.env.GDRIVE_CLIENT_SECRET && process.env.GDRIVE_REFRESH_TOKEN) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GDRIVE_CLIENT_ID,
        process.env.GDRIVE_CLIENT_SECRET,
        process.env.GDRIVE_REDIRECT_URI || 'http://localhost'
      );
      oauth2Client.setCredentials({ refresh_token: process.env.GDRIVE_REFRESH_TOKEN });
      driveClient = google.drive({ version: 'v3', auth: oauth2Client });
      googleAuthType = 'oauth2';
      console.log('[GDRIVE] Initialized Google Drive API using OAuth2 refresh token.');
      syncDriveFiles();
      return driveClient;
    }

    console.log('[STORAGE] Running in Secure Local Vault mode (Service account can be placed at backend/service-account.json).');
  } catch (err) {
    console.warn('[GDRIVE] Error initializing Google Drive:', err.message);
  }
  return null;
}

async function syncDriveFiles() {
  if (!driveClient) return;
  try {
    const res = await driveClient.files.list({
      pageSize: 100,
      q: "trashed = false and mimeType != 'application/vnd.google-apps.folder'",
      fields: 'files(id, name, mimeType, size, createdTime)'
    });
    if (res.data.files && res.data.files.length > 0) {
      const reg = getMetadataRegistry();
      res.data.files.forEach(f => {
        const attId = `gdrive_${f.id}`;
        const record = {
          id: attId,
          name: f.name,
          mimeType: f.mimeType || 'image/webp',
          size: Number(f.size || 0),
          isImage: f.mimeType ? f.mimeType.startsWith('image/') : true,
          storageType: 'gdrive',
          driveFileId: f.id,
          uploaderId: 'Google Drive',
          createdAt: f.createdTime ? new Date(f.createdTime).getTime() : Date.now()
        };
        reg[attId] = record;
        reg[f.name] = record;
        if (f.name.includes('_')) {
          const suffix = f.name.split('_').pop();
          if (suffix && suffix.length > 5) reg[suffix] = record;
        }
      });
      fs.writeFileSync(METADATA_FILE, JSON.stringify(reg, null, 2), 'utf8');
      console.log(`[GDRIVE] Synchronized ${res.data.files.length} cloud files from Google Drive.`);
    }
  } catch (err) {
    console.warn('[GDRIVE SYNC WARN]', err.message);
  }
}

initGoogleDrive();

// Helper to load/save metadata registry
function getMetadataRegistry() {
  try {
    return JSON.parse(fs.readFileSync(METADATA_FILE, 'utf8'));
  } catch (e) {
    return {};
  }
}

async function findAttachmentRecord(id) {
  if (!id) return null;
  const reg = getMetadataRegistry();
  if (reg[id]) return reg[id];

  const cleanId = decodeURIComponent(id).trim();
  if (reg[cleanId]) return reg[cleanId];

  // Try matching by name or partial
  let found = Object.values(reg).find(r => 
    r.id === cleanId || 
    r.name === cleanId || 
    (r.name && cleanId.includes(r.name)) || 
    (r.name && r.name.includes(cleanId)) ||
    (r.internalFilename && r.internalFilename.includes(cleanId))
  );
  if (found) return found;

  // Search Google Drive dynamically
  if (driveClient) {
    try {
      const searchTerms = [cleanId];
      if (cleanId.includes('_')) {
        const parts = cleanId.split('_');
        searchTerms.push(parts[parts.length - 1]);
      }
      for (const term of searchTerms) {
        if (!term || term.length < 3) continue;
        const q = `name contains '${term.replace(/'/g, "\\'")}' and trashed = false`;
        const gRes = await driveClient.files.list({
          q,
          pageSize: 5,
          fields: 'files(id, name, mimeType, size)'
        });
        if (gRes.data.files && gRes.data.files.length > 0) {
          const gf = gRes.data.files[0];
          const newRec = {
            id: cleanId,
            name: gf.name,
            mimeType: gf.mimeType || 'image/webp',
            size: Number(gf.size || 0),
            isImage: gf.mimeType ? gf.mimeType.startsWith('image/') : true,
            storageType: 'gdrive',
            driveFileId: gf.id,
            createdAt: Date.now()
          };
          saveMetadata(cleanId, newRec);
          return newRec;
        }
      }
    } catch (e) {
      console.warn('[GDRIVE SEARCH WARN]', e.message);
    }
  }
  return null;
}

function saveMetadata(id, record) {
  const reg = getMetadataRegistry();
  reg[id] = record;
  fs.writeFileSync(METADATA_FILE, JSON.stringify(reg, null, 2), 'utf8');
}

function removeMetadata(id) {
  const reg = getMetadataRegistry();
  delete reg[id];
  fs.writeFileSync(METADATA_FILE, JSON.stringify(reg, null, 2), 'utf8');
}

// Allowed MIME categories
const ALLOWED_MIME_PATTERNS = [
  /^image\/(png|jpeg|jpg|webp|gif|svg\+xml)$/,
  /^application\/pdf$/,
  /^text\/(plain|csv|markdown|html)$/,
  /^application\/(json|zip|x-zip-compressed|vnd\.ms-excel|vnd\.openxmlformats-officedocument.*|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/
];

function isMimeAllowed(mime) {
  if (!mime) return false;
  return ALLOWED_MIME_PATTERNS.some(p => p.test(mime.toLowerCase()));
}

// -----------------------------------------------------------------------------
// ENDPOINTS
// -----------------------------------------------------------------------------

/**
 * Health Check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'REDDOT Secure Attachment Gateway',
    storageMode: driveClient ? `Google Drive (${googleAuthType})` : 'Private Local Vault',
    version: '1.0.0',
    timestamp: Date.now()
  });
});

/**
 * List All Stored Attachments
 * GET /api/attachments
 */
app.get('/api/attachments', (req, res) => {
  try {
    const reg = getMetadataRegistry();
    const list = Object.values(reg).map(record => ({
      id: record.id,
      name: record.name,
      mimeType: record.mimeType,
      size: record.size,
      isImage: record.mimeType ? record.mimeType.startsWith('image/') : false,
      storageType: record.storageType,
      uploaderId: record.uploaderId || 'RD-EMP',
      channelId: record.channelId || 'general',
      createdAt: record.createdAt,
      previewUrl: `http://127.0.0.1:${PORT}/api/attachments/${record.id}/preview`,
      downloadUrl: `http://127.0.0.1:${PORT}/api/attachments/${record.id}/download`
    })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    res.json({ success: true, count: list.length, attachments: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read attachment registry: ' + err.message });
  }
});

/**
 * Storage Quota & Mode Status
 * GET /api/storage/status
 */
app.get('/api/storage/status', (req, res) => {
  try {
    const reg = getMetadataRegistry();
    const list = Object.values(reg);
    let totalBytes = 0;
    list.forEach(f => { totalBytes += (f.size || 0); });
    res.json({
      status: 'online',
      service: 'REDDOT Secure Attachment Gateway',
      storageMode: driveClient ? `Google Drive (${googleAuthType})` : 'Private Local Vault',
      totalFiles: list.length,
      totalBytesUsed: totalBytes,
      totalBytesUsedFormatted: (totalBytes / (1024 * 1024)).toFixed(2) + ' MB',
      maxAttachmentSizeMB: 25,
      timestamp: Date.now()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve storage status: ' + err.message });
  }
});

/**
 * Upload Attachment
 * POST /api/attachments/upload
 */
app.post('/api/attachments/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided in request.' });
    }

    const { originalname, mimetype, size, buffer } = req.file;

    // Sanitize filename and validate size
    const safeName = path.basename(originalname || 'attachment.dat').replace(/[^a-zA-Z0-9._-]/g, '_');
    const uploaderId = req.headers['x-reddot-user-id'] || req.body.uploaderId || 'RD-EMP';
    const channelId = req.headers['x-reddot-channel-id'] || req.body.channelId || 'general';

    if (size > 25 * 1024 * 1024) {
      return res.status(413).json({ error: 'File exceeds maximum allowed size of 25MB.' });
    }

    // Generate opaque application attachment ID (completely neutral, no Drive signs)
    const attachmentId = 'att_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    const internalFilename = attachmentId + path.extname(safeName);

    let driveFileId = null;

    if (driveClient) {
      // Stream buffer to Private Google Drive
      const { Readable } = require('stream');
      const stream = Readable.from(buffer);

      const fileMetadata = {
        name: internalFilename, // Store under opaque ID name
        description: `REDDOT Workstation Attachment: ${safeName}`
      };

      if (process.env.GDRIVE_FOLDER_ID) {
        fileMetadata.parents = [process.env.GDRIVE_FOLDER_ID];
      }

      const media = {
        mimeType: mimetype,
        body: stream
      };

      const gRes = await driveClient.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, mimeType, size'
      });

      driveFileId = gRes.data.id;
    } else {
      // Store in secure private local disk vault
      const vaultPath = path.join(VAULT_DIR, internalFilename);
      fs.writeFileSync(vaultPath, buffer);
    }

    // Record internal metadata (driveFileId stays backend-only)
    const record = {
      id: attachmentId,
      name: safeName,
      mimeType: mimetype,
      size: size,
      uploaderId: uploaderId,
      channelId: channelId,
      createdAt: Date.now(),
      storageType: driveClient ? 'gdrive' : 'local_vault',
      driveFileId: driveFileId,
      internalFilename: internalFilename
    };

    saveMetadata(attachmentId, record);

    // Return strictly user-relevant, opaque metadata (NEVER expose Drive IDs or URLs)
    res.status(201).json({
      success: true,
      attachment: {
        id: attachmentId,
        name: safeName,
        mimeType: mimetype,
        size: size,
        isImage: mimetype.startsWith('image/'),
        createdAt: record.createdAt
      }
    });

  } catch (err) {
    console.error('[UPLOAD ERROR]', err);
    res.status(500).json({ error: 'Failed to securely store attachment: ' + err.message });
  }
});

/**
 * Get Attachment Metadata
 * GET /api/attachments/:id/metadata
 */
app.get('/api/attachments/:id/metadata', async (req, res) => {
  const { id } = req.params;
  const record = await findAttachmentRecord(id);

  if (!record) {
    return res.status(404).json({ error: 'Attachment not found.' });
  }

  res.json({
    id: record.id,
    name: record.name,
    mimeType: record.mimeType,
    size: record.size,
    isImage: record.mimeType ? record.mimeType.startsWith('image/') : false,
    createdAt: record.createdAt
  });
});

/**
 * Download Attachment Content
 * GET /api/attachments/:id/download
 */
app.get('/api/attachments/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const record = await findAttachmentRecord(id);

    if (!record) {
      return res.status(404).json({ error: 'Attachment not found.' });
    }

    res.setHeader('Content-Type', record.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(record.name)}"`);
    if (record.size) res.setHeader('Content-Length', record.size);

    if (record.storageType === 'gdrive' && record.driveFileId) {
      if (!driveClient) initGoogleDrive();
      if (driveClient) {
        // Stream from private Google Drive
        const gStream = await driveClient.files.get(
          { fileId: record.driveFileId, alt: 'media' },
          { responseType: 'stream' }
        );
        gStream.data.on('error', (err) => {
          console.error('[GSTREAM DOWNLOAD ERROR]', err);
          if (!res.headersSent) res.status(500).json({ error: 'Stream interrupted' });
        });
        return gStream.data.pipe(res);
      }
    } else {
      // Stream from local vault
      const vaultPath = path.join(VAULT_DIR, record.internalFilename || id);
      if (!fs.existsSync(vaultPath)) {
        return res.status(404).json({ error: 'Vault file missing on disk.' });
      }
      fs.createReadStream(vaultPath).pipe(res);
    }
  } catch (err) {
    console.error('[DOWNLOAD ERROR]', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to retrieve attachment stream.' });
    }
  }
});

/**
 * Preview / Thumbnail Stream
 * GET /api/attachments/:id/preview
 */
app.get('/api/attachments/:id/preview', async (req, res) => {
  try {
    const { id } = req.params;
    const record = await findAttachmentRecord(id);

    if (!record) {
      return res.status(404).json({ error: 'Attachment not found.' });
    }

    res.setHeader('Content-Type', record.mimeType || 'image/png');
    res.setHeader('Cache-Control', 'private, max-age=86400');

    if (record.storageType === 'gdrive' && record.driveFileId) {
      if (!driveClient) initGoogleDrive();
      if (driveClient) {
        const gStream = await driveClient.files.get(
          { fileId: record.driveFileId, alt: 'media' },
          { responseType: 'stream' }
        );
        gStream.data.on('error', (err) => {
          console.error('[GSTREAM ERROR]', err);
          if (!res.headersSent) res.status(500).json({ error: 'Stream error: ' + err.message });
        });
        return gStream.data.pipe(res);
      }
    } else {
      const vaultPath = path.join(VAULT_DIR, record.internalFilename || id);
      if (!fs.existsSync(vaultPath)) {
        return res.status(404).json({ error: 'Image file missing.' });
      }
      fs.createReadStream(vaultPath).pipe(res);
    }
  } catch (err) {
    console.error('[PREVIEW ERROR]', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate preview stream.' });
    }
  }
});

/**
 * Delete Attachment
 * DELETE /api/attachments/:id
 */
app.delete('/api/attachments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reg = getMetadataRegistry();
    const record = reg[id];

    if (!record) {
      return res.status(404).json({ error: 'Attachment not found.' });
    }

    if (record.storageType === 'gdrive' && driveClient && record.driveFileId) {
      try {
        await driveClient.files.delete({ fileId: record.driveFileId });
      } catch (e) {
        console.warn('[GDRIVE DELETE WARN]', e.message);
      }
    } else {
      const vaultPath = path.join(VAULT_DIR, record.internalFilename);
      if (fs.existsSync(vaultPath)) fs.unlinkSync(vaultPath);
    }

    removeMetadata(id);
    res.json({ success: true, message: 'Attachment deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete attachment: ' + err.message });
  }
});

// Start service
app.listen(PORT, () => {
  console.log(`==========================================================`);
  console.log(` REDDOT WORKSTATION — ATTACHMENT GATEWAY SERVICE v1.0.0`);
  console.log(` Listening on port: http://localhost:${PORT}`);
  console.log(` Private Storage Engine: ${driveClient ? 'Google Drive Cloud' : 'Secure Local Vault'}`);
  console.log(`==========================================================`);
});
