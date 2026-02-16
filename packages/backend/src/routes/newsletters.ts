import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database.js';
import { CHANNEL_CONFIG } from '@byggnytt/shared';
import { validateBody, validateUuidParam } from '../middleware/validate.js';
import type { Newsletter, UpdateNewsletterRequest } from '@byggnytt/shared';

const router = Router();

// GET /api/newsletters
router.get('/', (req, res) => {
  const db = getDb();
  const { channel, status } = req.query;

  let sql = 'SELECT * FROM newsletters';
  const conditions: string[] = [];
  const params: string[] = [];

  if (channel && typeof channel === 'string') {
    if (!['proffs', 'konsument'].includes(channel)) {
      res.status(400).json({ error: 'Ogiltig kanal. Välj proffs eller konsument.' });
      return;
    }
    conditions.push('channel = ?');
    params.push(channel);
  }
  if (status && typeof status === 'string') {
    if (!['draft', 'ready', 'sent'].includes(status)) {
      res.status(400).json({ error: 'Ogiltig status. Välj draft, ready eller sent.' });
      return;
    }
    conditions.push('status = ?');
    params.push(status);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY updated_at DESC';

  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  const newsletters = rows.map(parseNewsletterRow);
  res.json(newsletters);
});

// GET /api/newsletters/:id
router.get('/:id', validateUuidParam(), (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM newsletters WHERE id = ?').get(req.params.id) as
    | Record<string, unknown>
    | undefined;

  if (!row) {
    res.status(404).json({ error: 'Nyhetsbrevet hittades inte' });
    return;
  }

  res.json(parseNewsletterRow(row));
});

// POST /api/newsletters
router.post(
  '/',
  validateBody([
    { field: 'title', required: true, type: 'string', minLength: 1, maxLength: 500 },
    { field: 'channel', required: true, type: 'string', enum: ['proffs', 'konsument'] },
  ]),
  (req, res) => {
    const db = getDb();
    const { title, channel, blocks, settings, from_template_id } = req.body;

    const channelConfig = CHANNEL_CONFIG[channel as keyof typeof CHANNEL_CONFIG];
    const id = uuidv4();

    let finalBlocks = blocks || [];
    let finalSettings = { ...channelConfig.defaultSettings, ...settings };

    // Om from_template_id anges, ladda block och settings från mallen
    if (from_template_id) {
      const template = db
        .prepare('SELECT blocks, settings FROM templates WHERE id = ?')
        .get(from_template_id) as Record<string, string> | undefined;

      if (template) {
        finalBlocks = JSON.parse(template.blocks);
        finalSettings = { ...JSON.parse(template.settings), ...settings };
      }
    }

    db.prepare(
      `INSERT INTO newsletters (id, title, channel, blocks, settings) VALUES (?, ?, ?, ?, ?)`
    ).run(id, title, channel, JSON.stringify(finalBlocks), JSON.stringify(finalSettings));

    const created = db.prepare('SELECT * FROM newsletters WHERE id = ?').get(id) as Record<
      string,
      unknown
    >;
    res.status(201).json(parseNewsletterRow(created));
  }
);

// PUT /api/newsletters/:id
router.put('/:id', validateUuidParam(), (req, res) => {
  const db = getDb();
  const body = req.body as UpdateNewsletterRequest;
  const existing = db.prepare('SELECT * FROM newsletters WHERE id = ?').get(req.params.id) as
    | Record<string, unknown>
    | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Nyhetsbrevet hittades inte' });
    return;
  }

  // Validera status om den anges
  if (body.status && !['draft', 'ready', 'sent'].includes(body.status)) {
    res.status(400).json({ error: 'Ogiltig status. Välj draft, ready eller sent.' });
    return;
  }

  // Validera titel om den anges
  if (body.title !== undefined && (typeof body.title !== 'string' || body.title.length === 0)) {
    res.status(400).json({ error: 'Titel måste vara en icke-tom sträng' });
    return;
  }

  const updates: string[] = [];
  const params: (string | undefined)[] = [];

  if (body.title !== undefined) {
    updates.push('title = ?');
    params.push(body.title);
  }
  if (body.status !== undefined) {
    updates.push('status = ?');
    params.push(body.status);
  }
  if (body.blocks !== undefined) {
    if (!Array.isArray(body.blocks)) {
      res.status(400).json({ error: 'blocks måste vara en lista' });
      return;
    }
    updates.push('blocks = ?');
    params.push(JSON.stringify(body.blocks));
  }
  if (body.settings !== undefined) {
    if (typeof body.settings !== 'object') {
      res.status(400).json({ error: 'settings måste vara ett objekt' });
      return;
    }
    const currentSettings = JSON.parse(existing.settings as string);
    updates.push('settings = ?');
    params.push(JSON.stringify({ ...currentSettings, ...body.settings }));
  }

  if (updates.length === 0) {
    res.json(parseNewsletterRow(existing));
    return;
  }

  updates.push("updated_at = datetime('now')");
  params.push(req.params.id);

  db.prepare(`UPDATE newsletters SET ${updates.join(', ')} WHERE id = ?`).run(...params);

  const updated = db.prepare('SELECT * FROM newsletters WHERE id = ?').get(
    req.params.id
  ) as Record<string, unknown>;
  res.json(parseNewsletterRow(updated));
});

// DELETE /api/newsletters/:id
router.delete('/:id', validateUuidParam(), (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM newsletters WHERE id = ?').run(req.params.id);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Nyhetsbrevet hittades inte' });
    return;
  }

  res.status(204).send();
});

// POST /api/newsletters/:id/duplicate
router.post('/:id/duplicate', validateUuidParam(), (req, res) => {
  const db = getDb();
  const original = db.prepare('SELECT * FROM newsletters WHERE id = ?').get(req.params.id) as
    | Record<string, string>
    | undefined;

  if (!original) {
    res.status(404).json({ error: 'Nyhetsbrevet hittades inte' });
    return;
  }

  const newId = uuidv4();
  db.prepare(
    `INSERT INTO newsletters (id, title, channel, blocks, settings)
     VALUES (?, ?, ?, ?, ?)`
  ).run(newId, `${original.title} (kopia)`, original.channel, original.blocks, original.settings);

  const created = db.prepare('SELECT * FROM newsletters WHERE id = ?').get(newId) as Record<
    string,
    unknown
  >;
  res.status(201).json(parseNewsletterRow(created));
});

function parseNewsletterRow(row: Record<string, unknown>): Newsletter {
  return {
    ...row,
    blocks: typeof row.blocks === 'string' ? JSON.parse(row.blocks as string) : row.blocks,
    settings:
      typeof row.settings === 'string' ? JSON.parse(row.settings as string) : row.settings,
  } as Newsletter;
}

export default router;
