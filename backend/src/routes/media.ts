import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { uploadBuffer, uploadToCloudinary } from '../lib/cloudinary.js';
import { ok, fail } from '../lib/response.js';
import { v4 as uuid } from 'uuid';
import { createFileStore } from '../db/fileStore.js';

const r = Router();
const db = createFileStore();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

r.use(authenticate);

// Signed server-side upload to Cloudinary — supports image/video/voice notes
// Accepts: multipart/form-data (field: file) OR JSON { dataUri: "data:image/jpeg;base64,..." }
r.post('/upload', upload.single('file'), async (req, res) => {
  try {
    let result: { secure_url: string; public_id: string; thumbnailUrl: string; resource_type: string } | null = null;

    if ((req as any).file) {
      const file = (req as any).file as Express.Multer.File;
      result = await uploadBuffer(file.buffer, { mimetype: file.mimetype, filename: file.originalname });
    } else if (req.body?.dataUri) {
      result = await uploadToCloudinary(req.body.dataUri, { resource_type: 'auto' });
    } else if (req.body?.url) {
      result = await uploadToCloudinary(req.body.url, { resource_type: 'auto' });
    } else {
      return res.status(400).json(fail('VALIDATION', 'Provide multipart file (field: file) or JSON { dataUri }'));
    }

    // Optionally create a message immediately if conversationId is provided
    const { conversationId, text } = req.body || {};
    if (conversationId) {
      const conv = await db.conversations.findById(conversationId);
      if (!conv) return res.status(404).json(fail('NOT_FOUND', 'Conversation not found'));
      const u = (req as any).user;
      const msg = {
        id: uuid(),
        conversationId,
        senderId: u.id,
        text: text || '',
        mediaUrl: result.secure_url, // Cloudinary secure_url
        public_id: result.public_id, // Cloudinary public_id
        thumbnailUrl: result.thumbnailUrl, // eager 320x320 thumbnail for previews
        mediaType: result.resource_type === 'video' ? 'video' : result.resource_type === 'image' ? 'image' : 'audio',
        resourceType: result.resource_type,
        createdAt: new Date().toISOString(),
        reactions: [],
        seenBy: [],
        deliveredTo: [],
        editedAt: null,
        deletedAt: null,
      };
      await db.messages.create(msg);
      try {
        const { broadcastToConversation } = await import('../ws/server.js');
        broadcastToConversation(conversationId, { type: 'message:new', payload: msg });
      } catch {}
      return res.json(ok({ ...result, message: msg }));
    }

    res.json(ok(result));
  } catch (e: any) {
    console.error('[cloudinary upload]', e);
    res.status(500).json(fail('UPLOAD', e.message || 'Cloudinary upload failed'));
  }
});

// Confirm endpoint — expects Cloudinary fields (secure_url + public_id)
r.post('/confirm', async (req, res) => {
  const { conversationId, secure_url, public_id, thumbnailUrl, resourceType, text } = req.body;
  if (!secure_url || !public_id) return res.status(400).json(fail('VALIDATION', 'secure_url and public_id required (Cloudinary)'));
  const conv = await db.conversations.findById(conversationId);
  if (!conv) return res.status(404).json(fail('NOT_FOUND', 'Conversation not found'));
  const u = (req as any).user;
  const msg = {
    id: uuid(),
    conversationId,
    senderId: u.id,
    text: text || '',
    mediaUrl: secure_url,
    public_id,
    thumbnailUrl: thumbnailUrl || secure_url,
    resourceType: resourceType || 'image',
    mediaType: resourceType === 'video' ? 'video' : resourceType === 'image' ? 'image' : 'audio',
    createdAt: new Date().toISOString(),
    reactions: [],
    seenBy: [],
    deliveredTo: [],
    editedAt: null,
    deletedAt: null,
  };
  await db.messages.create(msg);
  res.json(ok(msg));
  try {
    const { broadcastToConversation } = await import('../ws/server.js');
    broadcastToConversation(conversationId, { type: 'message:new', payload: msg });
  } catch {}
});

// Optional: return signed params for direct client-side signed upload (if needed)
r.post('/sign', async (req, res) => {
  const { folder } = req.body || {};
  const { signUploadParams } = await import('../lib/cloudinary.js');
  const sig = signUploadParams({ folder: folder || 'link/media' });
  res.json(ok(sig));
});

export default r;
