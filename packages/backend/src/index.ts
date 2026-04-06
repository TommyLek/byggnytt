import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { resolve } from 'path';
import newsletterRoutes from './routes/newsletters.js';
import templateRoutes from './routes/templates.js';
import renderRoutes from './routes/render.js';
import exportRoutes from './routes/export.js';
import uploadRoutes from './routes/upload.js';
import productLookupRoutes from './routes/product-lookup.js';
import { errorHandler } from './middleware/errorHandler.js';
import { getDb } from './db/database.js';
import { seedDefaultTemplates } from './db/seed.js';

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));

// Statiska filer (uppladdade bilder)
app.use('/uploads', express.static(resolve(process.env.UPLOAD_DIR || './uploads')));

// Routes
app.use('/api/newsletters', newsletterRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/render', renderRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/images', uploadRoutes);
app.use('/api/product-lookup', productLookupRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Initiera databas, seeda mallar och starta server
const db = getDb();
seedDefaultTemplates(db);

app.listen(port, () => {
  console.log(`ByggNytt backend körs på http://localhost:${port}`);
});
