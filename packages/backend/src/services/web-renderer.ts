import type {
  Block,
  NewsletterSettings,
  HeroContent,
  TextContent,
  ImageTextContent,
  CampaignContent,
  DividerContent,
  FooterContent,
  ProductContent,
  ProductGridContent,
} from '@byggnytt/shared';

/**
 * Renderar block till ren HTML/CSS för webbvisning och PDF.
 * Skiljer sig från MJML-renderaren genom att använda modern CSS
 * istället för tabellbaserad layout.
 */
export function renderWebHtml(
  blocks: Block[],
  settings: NewsletterSettings,
  options: { title?: string; standalone?: boolean } = {}
): string {
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);
  const bodyContent = sortedBlocks
    .map((block) => blockToHtml(block, settings))
    .join('\n');

  if (!options.standalone) {
    return bodyContent;
  }

  return `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(options.title || settings.subject || 'Nyhetsbrev')}</title>
  <style>
    ${getBaseStyles(settings)}
  </style>
</head>
<body>
  <div class="newsletter-wrapper">
    <div class="newsletter-container">
      ${bodyContent}
    </div>
  </div>
</body>
</html>`;
}

function getBaseStyles(settings: NewsletterSettings): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${settings.font_family};
      background-color: ${settings.color_background};
      color: #333333;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    .newsletter-wrapper {
      display: flex;
      justify-content: center;
      padding: 24px 16px;
    }
    .newsletter-container {
      width: 100%;
      max-width: 600px;
      background-color: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .block-section {
      width: 100%;
    }
    img { max-width: 100%; height: auto; display: block; }
    a { color: ${settings.color_primary}; }

    /* Hero */
    .hero-block .hero-image { width: 100%; }
    .hero-block .hero-content { padding: 24px; }
    .hero-block h1 { font-size: 28px; font-weight: 700; line-height: 1.2; margin-bottom: 8px; }
    .hero-block .subtitle { font-size: 18px; color: #666; margin-bottom: 16px; }
    .hero-block .cta-btn {
      display: inline-block; padding: 12px 28px; color: #fff;
      text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600;
    }

    /* Text */
    .text-block { padding: 24px; }
    .text-block h2 { font-size: 22px; font-weight: 700; line-height: 1.3; margin-bottom: 8px; }
    .text-block .body-text { font-size: 16px; line-height: 1.6; }
    .text-block .body-text p { margin-bottom: 12px; }

    /* Image + Text */
    .image-text-block { display: flex; gap: 0; }
    .image-text-block.reverse { flex-direction: row-reverse; }
    .image-text-block .img-col { flex: 1; min-width: 0; }
    .image-text-block .img-col img { width: 100%; height: 100%; object-fit: cover; }
    .image-text-block .text-col { flex: 1; padding: 24px; display: flex; flex-direction: column; justify-content: center; }
    .image-text-block h3 { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
    .image-text-block .body-text { font-size: 15px; line-height: 1.6; margin-bottom: 16px; }

    /* Campaign */
    .campaign-block {
      padding: 40px 24px; text-align: center; background-size: cover; background-position: center;
    }
    .campaign-block h2 { font-size: 26px; font-weight: 700; margin-bottom: 12px; }
    .campaign-block .body-text { font-size: 16px; margin-bottom: 20px; }
    .campaign-block .cta-btn {
      display: inline-block; padding: 12px 32px; color: #fff;
      text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600;
    }

    /* Divider */
    .divider-block.line hr { border: none; border-top-style: solid; }
    .divider-block.dots { text-align: center; font-size: 20px; letter-spacing: 8px; padding: 8px 0; }

    /* Footer */
    .footer-block { padding: 24px; text-align: center; }
    .footer-block .company-name { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 8px; }
    .footer-block .address { font-size: 12px; color: #ccc; margin-bottom: 4px; }
    .footer-block .contact { font-size: 12px; color: #999; margin-top: 4px; }
    .footer-block .contact a { color: #999; }
    .footer-block .unsubscribe { font-size: 11px; color: #999; margin-top: 16px; }
    .footer-block .unsubscribe a { color: #999; text-decoration: underline; }
    .footer-block .social-links { margin: 12px 0; }
    .footer-block .social-links a { color: #999; margin: 0 8px; text-decoration: none; font-size: 13px; }

    /* Product */
    .product-block { display: flex; padding: 24px; gap: 20px; }
    .product-block .product-image { flex: 0 0 40%; }
    .product-block .product-image img { border-radius: 4px; }
    .product-block .product-info { flex: 1; }
    .product-block .badge { font-size: 12px; font-weight: 700; margin-bottom: 4px; }
    .product-block h3 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
    .product-block .description { font-size: 14px; color: #666; margin-bottom: 8px; }
    .product-block .sku { font-size: 12px; color: #999; margin-bottom: 4px; }
    .product-block .price { font-size: 20px; font-weight: 700; margin-bottom: 12px; }

    /* Product Grid */
    .product-grid-block { padding: 24px; }
    .product-grid-block h2 { font-size: 22px; font-weight: 700; margin-bottom: 16px; }
    .product-grid { display: grid; gap: 16px; }
    .product-grid.cols-2 { grid-template-columns: 1fr 1fr; }
    .product-grid.cols-3 { grid-template-columns: 1fr 1fr 1fr; }
    .product-card img { width: 100%; border-radius: 4px; margin-bottom: 8px; }
    .product-card .name { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
    .product-card .price { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
    .product-card .cta-btn {
      display: inline-block; padding: 8px 16px; color: #fff;
      text-decoration: none; border-radius: 4px; font-size: 12px;
    }

    @media (max-width: 480px) {
      .image-text-block { flex-direction: column !important; }
      .product-block { flex-direction: column; }
      .product-block .product-image { flex: none; }
      .product-grid.cols-3 { grid-template-columns: 1fr 1fr; }
    }
  `;
}

function blockToHtml(block: Block, settings: NewsletterSettings): string {
  switch (block.type) {
    case 'hero':
      return heroToHtml(block.content as HeroContent, settings);
    case 'text':
      return textToHtml(block.content as TextContent, block.style);
    case 'image-text':
      return imageTextToHtml(block.content as ImageTextContent, settings);
    case 'campaign':
      return campaignToHtml(block.content as CampaignContent);
    case 'divider':
      return dividerToHtml(block.content as DividerContent);
    case 'footer':
      return footerToHtml(block.content as FooterContent);
    case 'product':
      return productToHtml(block.content as ProductContent, settings);
    case 'product-grid':
      return productGridToHtml(block.content as ProductGridContent, settings);
    default:
      return '';
  }
}

function heroToHtml(content: HeroContent, settings: NewsletterSettings): string {
  const img = content.imageUrl
    ? `<img class="hero-image" src="${escapeHtml(content.imageUrl)}" alt="${escapeHtml(content.imageAlt)}" />`
    : '';
  const cta = content.ctaText && content.ctaUrl
    ? `<a class="cta-btn" href="${escapeHtml(content.ctaUrl)}" style="background-color:${content.ctaColor || settings.color_primary}">${escapeHtml(content.ctaText)}</a>`
    : '';

  return `
    <div class="block-section hero-block" style="text-align:${content.textAlign}">
      ${img}
      <div class="hero-content">
        <h1>${escapeHtml(content.title)}</h1>
        ${content.subtitle ? `<p class="subtitle">${escapeHtml(content.subtitle)}</p>` : ''}
        ${cta}
      </div>
    </div>`;
}

function textToHtml(content: TextContent, style: import('@byggnytt/shared').BlockStyle): string {
  const bg = style.backgroundColor ? `background-color:${style.backgroundColor};` : '';
  return `
    <div class="block-section text-block" style="text-align:${content.textAlign};${bg}">
      ${content.heading ? `<h2>${escapeHtml(content.heading)}</h2>` : ''}
      <div class="body-text">${content.body}</div>
    </div>`;
}

function imageTextToHtml(content: ImageTextContent, settings: NewsletterSettings): string {
  const cta = content.ctaText && content.ctaUrl
    ? `<a class="cta-btn" href="${escapeHtml(content.ctaUrl)}" style="background-color:${settings.color_primary};color:#fff;display:inline-block;padding:10px 20px;border-radius:4px;text-decoration:none;font-size:14px">${escapeHtml(content.ctaText)}</a>`
    : '';

  return `
    <div class="block-section image-text-block${content.imagePosition === 'right' ? ' reverse' : ''}">
      <div class="img-col">
        <img src="${escapeHtml(content.imageUrl)}" alt="${escapeHtml(content.imageAlt)}" />
      </div>
      <div class="text-col">
        ${content.heading ? `<h3>${escapeHtml(content.heading)}</h3>` : ''}
        <div class="body-text">${content.body}</div>
        ${cta}
      </div>
    </div>`;
}

function campaignToHtml(content: CampaignContent): string {
  const bgImg = content.backgroundImageUrl
    ? `background-image:url('${escapeHtml(content.backgroundImageUrl)}');`
    : '';

  return `
    <div class="block-section campaign-block" style="background-color:${content.backgroundColor};${bgImg}color:${content.textColor}">
      <h2>${escapeHtml(content.heading)}</h2>
      ${content.body ? `<p class="body-text">${escapeHtml(content.body)}</p>` : ''}
      <a class="cta-btn" href="${escapeHtml(content.ctaUrl)}" style="background-color:${content.ctaColor}">${escapeHtml(content.ctaText)}</a>
    </div>`;
}

function dividerToHtml(content: DividerContent): string {
  if (content.style === 'space') {
    return `<div class="block-section" style="height:${content.height}px"></div>`;
  }
  if (content.style === 'dots') {
    return `<div class="block-section divider-block dots" style="color:${content.lineColor || '#DDDDDD'}">&bull;&bull;&bull;</div>`;
  }
  return `<div class="block-section divider-block line" style="padding:8px 24px"><hr style="border-top-color:${content.lineColor || '#DDDDDD'};border-top-width:${content.height}px" /></div>`;
}

function footerToHtml(content: FooterContent): string {
  const contactParts: string[] = [];
  if (content.phone) contactParts.push(escapeHtml(content.phone));
  if (content.email) contactParts.push(`<a href="mailto:${escapeHtml(content.email)}">${escapeHtml(content.email)}</a>`);
  if (content.websiteUrl) contactParts.push(`<a href="${escapeHtml(content.websiteUrl)}">${escapeHtml(content.websiteUrl)}</a>`);

  const socialLinks = content.socialLinks && content.socialLinks.length > 0
    ? `<div class="social-links">${content.socialLinks.map((l) => `<a href="${escapeHtml(l.url)}">${escapeHtml(l.platform)}</a>`).join('')}</div>`
    : '';

  return `
    <div class="block-section footer-block" style="background-color:#333333">
      <p class="company-name">${escapeHtml(content.companyName)}</p>
      <p class="address">${escapeHtml(content.address)}</p>
      ${contactParts.length > 0 ? `<p class="contact">${contactParts.join(' | ')}</p>` : ''}
      ${socialLinks}
      <p class="unsubscribe"><a href="${escapeHtml(content.unsubscribeUrl)}">${escapeHtml(content.unsubscribeText)}</a></p>
    </div>`;
}

function productToHtml(content: ProductContent, settings: NewsletterSettings): string {
  return `
    <div class="block-section product-block">
      <div class="product-image">
        <img src="${escapeHtml(content.imageUrl)}" alt="${escapeHtml(content.name)}" />
      </div>
      <div class="product-info">
        ${content.badge ? `<p class="badge" style="color:${settings.color_primary}">${escapeHtml(content.badge)}</p>` : ''}
        <h3>${escapeHtml(content.name)}</h3>
        ${content.description ? `<p class="description">${escapeHtml(content.description)}</p>` : ''}
        <p class="sku">Art.nr: ${escapeHtml(content.sku)}</p>
        <p class="price" style="color:${settings.color_primary}">${escapeHtml(content.price)}</p>
        <a class="cta-btn" href="${escapeHtml(content.productUrl)}" style="background-color:${settings.color_primary}">Visa produkt</a>
      </div>
    </div>`;
}

function productGridToHtml(content: ProductGridContent, settings: NewsletterSettings): string {
  const cards = content.products
    .slice(0, content.columns)
    .map(
      (p) => `
      <div class="product-card">
        <img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" />
        ${p.badge ? `<p class="badge" style="color:${settings.color_primary};font-size:11px;font-weight:700">${escapeHtml(p.badge)}</p>` : ''}
        <p class="name">${escapeHtml(p.name)}</p>
        <p class="price" style="color:${settings.color_primary}">${escapeHtml(p.price)}</p>
        <a class="cta-btn" href="${escapeHtml(p.productUrl)}" style="background-color:${settings.color_primary}">Visa</a>
      </div>`
    )
    .join('\n');

  return `
    <div class="block-section product-grid-block">
      ${content.heading ? `<h2>${escapeHtml(content.heading)}</h2>` : ''}
      <div class="product-grid cols-${content.columns}">
        ${cards}
      </div>
    </div>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
