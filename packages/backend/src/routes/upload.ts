import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { getDb } from '../db/database.js';
import { processImage, deleteImageFile } from '../services/image-service.js';
import { validateUuidParam } from '../middleware/validate.js';
import type { ImageInfo } from '@byggnytt/shared';

const uploadDir = process.env.UPLOAD_DIR || './uploads';
mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Otillåten filtyp. Tillåtna: JPG, PNG, GIF, WebP'));
    }
  },
});

const router = Router();

// POST /api/upload
router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Ingen bild uppladdad' });
      return;
    }

    const db = getDb();
    const id = uuidv4();
    const publicUrl = process.env.PUBLIC_URL || 'http://localhost:3001';
    const filePath = join(uploadDir, req.file.filename);

    // Bearbeta bilden: resize + WebP-konvertering
    const processed = await processImage(filePath, uploadDir);

    db.prepare(
      `INSERT INTO images (id, filename, original_name, mime_type, size, width, height)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      processed.filename,
      req.file.originalname,
      processed.mime_type,
      processed.size,
      processed.width,
      processed.height
    );

    const image: ImageInfo = {
      id,
      filename: processed.filename,
      original_name: req.file.originalname,
      mime_type: processed.mime_type,
      size: processed.size,
      width: processed.width,
      height: processed.height,
      uploaded_at: new Date().toISOString(),
      url: `${publicUrl}/uploads/${processed.filename}`,
    };

    res.status(201).json(image);
  } catch (err) {
    next(err);
  }
});

// GET /api/images
router.get('/', (_req, res) => {
  const db = getDb();
  const publicUrl = process.env.PUBLIC_URL || 'http://localhost:3001';
  const rows = db.prepare('SELECT * FROM images ORDER BY uploaded_at DESC').all() as ImageInfo[];

  const images = rows.map((row) => ({
    ...row,
    url: `${publicUrl}/uploads/${row.filename}`,
  }));

  res.json(images);
});

// DELETE /api/images/:id
router.delete('/:id', validateUuidParam('id'), async (req, res, next) => {
  try {
    const db = getDb();
    const image = db.prepare('SELECT filename FROM images WHERE id = ?').get(req.params.id) as
      | { filename: string }
      | undefined;

    if (!image) {
      res.status(404).json({ error: 'Bilden hittades inte' });
      return;
    }

    // Ta bort fil från disk
    await deleteImageFile(image.filename, uploadDir);

    // Ta bort från databas
    db.prepare('DELETE FROM images WHERE id = ?').run(req.params.id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
