import sharp from 'sharp';
import { readFile, writeFile, unlink, stat } from 'fs/promises';
import { join, parse } from 'path';
import { MAX_IMAGE_WIDTH } from '@byggnytt/shared';

interface ProcessedImage {
  filename: string;
  width: number;
  height: number;
  size: number;
  mime_type: string;
}

/**
 * Bearbetar en uppladdad bild:
 * 1. Resizar till max MAX_IMAGE_WIDTH px bredd (behåller proportioner)
 * 2. Konverterar till WebP för bättre komprimering
 * 3. Tar bort originalfilen
 */
export async function processImage(
  filePath: string,
  uploadDir: string
): Promise<ProcessedImage> {
  const { name } = parse(filePath);
  const webpFilename = `${name}.webp`;
  const outputPath = join(uploadDir, webpFilename);

  const metadata = await sharp(filePath).metadata();
  const needsResize = (metadata.width ?? 0) > MAX_IMAGE_WIDTH;

  let pipeline = sharp(filePath);

  if (needsResize) {
    pipeline = pipeline.resize(MAX_IMAGE_WIDTH, undefined, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const result = await pipeline
    .webp({ quality: 82 })
    .toFile(outputPath);

  // Ta bort originalfilen om den skiljer sig från output
  if (filePath !== outputPath) {
    await unlink(filePath).catch(() => {});
  }

  return {
    filename: webpFilename,
    width: result.width,
    height: result.height,
    size: result.size,
    mime_type: 'image/webp',
  };
}

/**
 * Skapar en thumbnail för förhandsgranskning.
 */
export async function createThumbnail(
  filePath: string,
  uploadDir: string,
  width = 200
): Promise<string> {
  const { name } = parse(filePath);
  const thumbFilename = `${name}_thumb.webp`;
  const outputPath = join(uploadDir, thumbFilename);

  await sharp(filePath)
    .resize(width, undefined, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 70 })
    .toFile(outputPath);

  return thumbFilename;
}

/**
 * Hämtar metadata om en bild utan att bearbeta den.
 */
export async function getImageMetadata(filePath: string) {
  const metadata = await sharp(filePath).metadata();
  return {
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    size: metadata.size,
  };
}

/**
 * Tar bort en bildfil från disk.
 */
export async function deleteImageFile(
  filename: string,
  uploadDir: string
): Promise<void> {
  const filePath = join(uploadDir, filename);
  await unlink(filePath).catch(() => {});

  // Ta bort eventuell thumbnail
  const { name } = parse(filename);
  const thumbPath = join(uploadDir, `${name}_thumb.webp`);
  await unlink(thumbPath).catch(() => {});
}
