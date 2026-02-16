import { Router } from 'express';
import type { Block, NewsletterSettings } from '@byggnytt/shared';
import { buildMjml } from '../services/mjml-builder.js';
import { renderWebHtml } from '../services/web-renderer.js';

const router = Router();

// POST /api/render - Webb-HTML för förhandsgranskning
router.post('/', (req, res, next) => {
  try {
    const { blocks, settings } = req.body as {
      blocks: Block[];
      settings: NewsletterSettings;
    };

    if (!blocks || !settings) {
      res.status(400).json({ error: 'blocks och settings krävs' });
      return;
    }

    if (!Array.isArray(blocks)) {
      res.status(400).json({ error: 'blocks måste vara en lista' });
      return;
    }

    const html = renderWebHtml(blocks, settings, { standalone: true });

    res.json({ html, type: 'preview' });
  } catch (err) {
    next(err);
  }
});

// POST /api/render/mjml - Mailkompatibel HTML via MJML
router.post('/mjml', (req, res, next) => {
  try {
    const { blocks, settings } = req.body as {
      blocks: Block[];
      settings: NewsletterSettings;
    };

    if (!blocks || !settings) {
      res.status(400).json({ error: 'blocks och settings krävs' });
      return;
    }

    if (!Array.isArray(blocks)) {
      res.status(400).json({ error: 'blocks måste vara en lista' });
      return;
    }

    const result = buildMjml(blocks, settings);

    if (result.errors.length > 0) {
      console.warn('MJML-varningar:', result.errors);
    }

    res.json({
      html: result.html,
      type: 'email',
      warnings: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
