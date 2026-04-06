import { Router, Request, Response } from 'express';

const router = Router();

const QUERY_API = process.env.QUERY_API_URL || 'http://192.168.62.15:5100';
const WEBSHOP_IMAGE_BASE =
  process.env.WEBSHOP_IMAGE_BASE || 'https://www.jabs.se/image/';
const WEBSHOP_PRODUCT_BASE =
  process.env.WEBSHOP_PRODUCT_BASE || 'https://www.jabs.se/';

async function queryWebshop(sql: string): Promise<{ columns: string[]; rows: Record<string, unknown>[] }> {
  const res = await fetch(`${QUERY_API}/api/v1/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: 'webshop', sql }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Query failed' }));
    throw new Error(err.error || `QueryService HTTP ${res.status}`);
  }
  return res.json();
}

// GET /api/product-lookup/:sku
router.get('/:sku', async (req: Request, res: Response) => {
  const sku = req.params.sku as string;

  if (!sku || sku.length === 0) {
    res.status(400).json({ error: 'Artikelnummer krävs' });
    return;
  }

  try {
    // Sanitize: only allow alphanumeric, dash, dot, space
    const safeSku = sku.trim().replace(/[^a-zA-Z0-9\-. ]/g, '');
    const isNumeric = /^\d+$/.test(safeSku);

    // Search by model first, then product_id and ean if numeric
    const whereClauses = [`p.model = '${safeSku}'`];
    if (isNumeric) {
      whereClauses.push(`p.product_id = ${safeSku}`);
      whereClauses.push(`p.ean = '${safeSku}'`);
    }

    const productResult = await queryWebshop(
      `SELECT p.product_id, p.model, p.image, p.price, p.tax_class_id, p.ean,
              pd.name, pd.subtext,
              pb.name AS brand_name,
              COALESCE(tr.rate, 0) AS tax_rate
       FROM product p
       JOIN product_description pd ON p.product_id = pd.product_id AND pd.language_id = 2
       LEFT JOIN product_brand pb ON p.brand_id = pb.brand_id
       LEFT JOIN tax_rule tru ON p.tax_class_id = tru.tax_class_id
       LEFT JOIN tax_rate tr ON tru.tax_rate_id = tr.tax_rate_id
       WHERE (${whereClauses.join(' OR ')}) AND p.status = 1
       LIMIT 1`
    );

    if (productResult.rows.length === 0) {
      res.status(404).json({ error: `Ingen produkt hittades med "${sku}"` });
      return;
    }

    const row = productResult.rows[0];
    const productId = row.product_id;

    // Get URL alias for product link
    let productUrl = `${WEBSHOP_PRODUCT_BASE}index.php?route=product/product&product_id=${productId}`;
    try {
      const aliasResult = await queryWebshop(
        `SELECT keyword FROM url_alias WHERE query = 'product_id=${productId}' LIMIT 1`
      );
      if (aliasResult.rows.length > 0) {
        productUrl = `${WEBSHOP_PRODUCT_BASE}${aliasResult.rows[0].keyword}`;
      }
    } catch {
      // Use fallback URL
    }

    // Build image URL
    const imagePath = row.image as string;
    const imageUrl =
      imagePath && imagePath !== 'catalog/no_image.png'
        ? `${WEBSHOP_IMAGE_BASE}${imagePath}`
        : '';

    // Format price — exkl. moms for proffs, inkl. moms for konsument
    const channel = (req.query.channel as string) || 'konsument';
    const rawPrice = row.price as number;
    const taxRate = row.tax_rate as number;
    const price = channel === 'proffs' ? rawPrice : rawPrice * (1 + taxRate / 100);
    const suffix = channel === 'proffs' ? 'kr exkl. moms' : 'kr';
    const priceFormatted = `${Math.round(price)} ${suffix}`;

    // Build description from subtext and brand
    const parts: string[] = [];
    if (row.subtext) parts.push(row.subtext as string);
    if (row.brand_name) parts.push(row.brand_name as string);

    res.json({
      sku: row.model,
      name: row.name as string,
      description: parts.join(' | ') || undefined,
      price: priceFormatted,
      imageUrl,
      productUrl,
    });
  } catch (err) {
    console.error('Produktuppslag misslyckades:', err);
    res.status(502).json({ error: 'Kunde inte ansluta till webshoppens databas' });
  }
});

export default router;
