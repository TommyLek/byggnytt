import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database.js';
import { validateBody } from '../middleware/validate.js';
import type { Template, Newsletter } from '@byggnytt/shared';

const router = Router();

// GET /api/templates
router.get('/', (req, res) => {
  const db = getDb();
  const { channel } = req.query;

  let sql = 'SELECT * FROM templates';
  const params: string[] = [];

  if (channel && typeof channel === 'string') {
    sql += ' WHERE channel = ?';
    params.push(channel);
  }

  sql += ' ORDER BY is_default DESC, created_at DESC';

  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  const templates = rows.map(parseTemplateRow);
  res.json(templates);
});

// GET /api/templates/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id) as
    | Record<string, unknown>
    | undefined;

  if (!row) {
    res.status(404).json({ error: 'Mallen hittades inte' });
    return;
  }

  res.json(parseTemplateRow(row));
});

// POST /api/templates - Skapa mall (från nyhetsbrev eller manuellt)
router.post(
  '/',
  validateBody([
    { field: 'name', required: true, type: 'string', minLength: 1, maxLength: 200 },
    { field: 'channel', required: true, type: 'string', enum: ['proffs', 'konsument'] },
  ]),
  (req, res) => {
    const db = getDb();
    const { name, channel, blocks, settings, from_newsletter_id } = req.body;
    const id = uuidv4();

    let templateBlocks = blocks || [];
    let templateSettings = settings || {};

    // Om from_newsletter_id anges, kopiera block och settings från det nyhetsbrevet
    if (from_newsletter_id) {
      const newsletter = db
        .prepare('SELECT blocks, settings FROM newsletters WHERE id = ?')
        .get(from_newsletter_id) as Record<string, string> | undefined;

      if (!newsletter) {
        res.status(404).json({ error: 'Nyhetsbrevet att skapa mall från hittades inte' });
        return;
      }

      templateBlocks = JSON.parse(newsletter.blocks);
      templateSettings = JSON.parse(newsletter.settings);
    }

    db.prepare(
      `INSERT INTO templates (id, name, channel, blocks, settings) VALUES (?, ?, ?, ?, ?)`
    ).run(id, name, channel, JSON.stringify(templateBlocks), JSON.stringify(templateSettings));

    const created = db.prepare('SELECT * FROM templates WHERE id = ?').get(id) as Record<
      string,
      unknown
    >;
    res.status(201).json(parseTemplateRow(created));
  }
);

// DELETE /api/templates/:id
router.delete('/:id', (req, res) => {
  const db = getDb();

  // Förhindra borttagning av default-mallar
  const template = db.prepare('SELECT is_default FROM templates WHERE id = ?').get(req.params.id) as
    | Record<string, number>
    | undefined;

  if (!template) {
    res.status(404).json({ error: 'Mallen hittades inte' });
    return;
  }

  if (template.is_default) {
    res.status(400).json({ error: 'Standardmallar kan inte tas bort' });
    return;
  }

  db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

function parseTemplateRow(row: Record<string, unknown>): Template {
  return {
    ...row,
    blocks: typeof row.blocks === 'string' ? JSON.parse(row.blocks as string) : row.blocks,
    settings: typeof row.settings === 'string' ? JSON.parse(row.settings as string) : row.settings,
    is_default: Boolean(row.is_default),
  } as Template;
}

export default router;
