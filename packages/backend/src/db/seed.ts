import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import type Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatesDir = resolve(__dirname, '../../../../templates');

/**
 * Seedar default-mallar om inga finns i databasen.
 */
export function seedDefaultTemplates(db: Database.Database): void {
  const count = db.prepare('SELECT COUNT(*) as count FROM templates WHERE is_default = 1').get() as {
    count: number;
  };

  if (count.count > 0) return;

  console.log('Seedar default-mallar...');

  const channels = ['proffs', 'konsument'] as const;

  for (const channel of channels) {
    try {
      const templatePath = resolve(templatesDir, channel, 'default.json');
      const templateData = JSON.parse(readFileSync(templatePath, 'utf-8'));

      const id = uuidv4();
      db.prepare(
        `INSERT INTO templates (id, name, channel, blocks, settings, is_default)
         VALUES (?, ?, ?, ?, ?, 1)`
      ).run(
        id,
        templateData.name,
        channel,
        JSON.stringify(templateData.blocks),
        JSON.stringify(templateData.settings)
      );

      console.log(`  Skapade standardmall: ${templateData.name}`);
    } catch (err) {
      console.warn(`  Kunde inte ladda mall för ${channel}:`, (err as Error).message);
    }
  }
}
