import { Router } from 'express';
import { getDb } from '../db/database.js';
import { validateUuidParam } from '../middleware/validate.js';
import { renderWebHtml } from '../services/web-renderer.js';
import { generatePdf } from '../services/pdf-generator.js';
import type { Newsletter, Block, NewsletterSettings } from '@byggnytt/shared';

const router = Router();

// POST /api/export/pdf/:id - Generera PDF
router.post('/pdf/:id', validateUuidParam(), async (req, res, next) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT * FROM newsletters WHERE id = ?').get(req.params.id) as
      | Record<string, string>
      | undefined;

    if (!row) {
      res.status(404).json({ error: 'Nyhetsbrevet hittades inte' });
      return;
    }

    const blocks: Block[] = JSON.parse(row.blocks);
    const settings: NewsletterSettings = JSON.parse(row.settings);

    // Rendera till ren HTML (ej MJML) för bästa PDF-resultat
    const html = renderWebHtml(blocks, settings, {
      title: row.title,
      standalone: true,
      channel: row.channel,
    });

    const pdfBuffer = await generatePdf(html);

    const safeTitle = row.title.replace(/[^a-zA-Z0-9åäöÅÄÖ\s-]/g, '').replace(/\s+/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

// GET /api/export/public/:id - Publik webbsida
router.get('/public/:id', validateUuidParam(), (req, res, next) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT * FROM newsletters WHERE id = ?').get(req.params.id) as
      | Record<string, string>
      | undefined;

    if (!row) {
      res.status(404).json({ error: 'Nyhetsbrevet hittades inte' });
      return;
    }

    const blocks: Block[] = JSON.parse(row.blocks);
    const settings: NewsletterSettings = JSON.parse(row.settings);

    const html = renderWebHtml(blocks, settings, {
      title: row.title,
      standalone: true,
      channel: row.channel,
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    next(err);
  }
});

export default router;
