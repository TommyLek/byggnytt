import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Server error:', err.message);

  // Multer-fel (filuppladdning)
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'Filen är för stor. Max 5 MB.' });
      return;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({ error: 'Oväntat fältnamn. Använd "image".' });
      return;
    }
    res.status(400).json({ error: `Uppladdningsfel: ${err.message}` });
    return;
  }

  // Multer filter-fel (otillåten filtyp)
  if (err.message.includes('Otillåten filtyp')) {
    res.status(400).json({ error: err.message });
    return;
  }

  // SQLite constraint-fel
  if (err.message.includes('SQLITE_CONSTRAINT')) {
    res.status(400).json({ error: 'Databasfel: ogiltig data' });
    return;
  }

  // JSON parse-fel
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Ogiltig JSON i request body' });
    return;
  }

  // Sharp-fel (bildbehandling)
  if (err.message.includes('Input file is missing') || err.message.includes('unsupported image')) {
    res.status(400).json({ error: 'Kunde inte bearbeta bilden. Kontrollera filformatet.' });
    return;
  }

  // Generellt serverfel
  res.status(500).json({
    error: 'Internt serverfel',
    details: process.env.NODE_ENV !== 'production' ? err.message : undefined,
  });
}
