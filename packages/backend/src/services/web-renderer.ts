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
  JabsTheme,
} from '@byggnytt/shared';
import { themeVariant, jabsTheme } from '@byggnytt/shared';

/**
 * Renderar block till ren HTML/CSS för webbvisning och PDF.
 * Skiljer sig från MJML-renderaren genom att använda modern CSS
 * istället för tabellbaserad layout.
 *
 * Proffskanalen ('proffs') renderas med jabs.se-uttrycket; övriga kanaler
 * behåller den klassiska layouten.
 */
export function renderWebHtml(
  blocks: Block[],
  settings: NewsletterSettings,
  options: { title?: string; standalone?: boolean; channel?: string } = {}
): string {
  const jt = themeVariant(options.channel) === 'jabs' ? jabsTheme(settings) : null;

  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);
  const blocksHtml = sortedBlocks
    .map((block) => (jt ? blockToJabsHtml(block, jt) : blockToHtml(block, settings)))
    .join('\n');

  // Fast header-chrome överst i proffskanalen
  const bodyContent = jt ? headerJabsHtml(settings, jt) + '\n' + blocksHtml : blocksHtml;

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
    ${jt ? getJabsStyles(settings, jt) : getBaseStyles(settings)}
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
    .product-block .cta-btn {
      display: inline-block; padding: 10px 24px; color: #fff;
      text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 600;
    }

    /* Product Grid */
    .product-grid-block { padding: 24px; }
    .product-grid-block h2 { font-size: 22px; font-weight: 700; margin-bottom: 16px; }
    .product-grid { display: grid; gap: 16px; }
    .product-grid.cols-2 { grid-template-columns: 1fr 1fr; }
    .product-grid.cols-3 { grid-template-columns: 1fr 1fr 1fr; }
    .product-card { display: flex; flex-direction: column; }
    .product-card img { width: 100%; height: 150px; object-fit: contain; border-radius: 4px; margin-bottom: 8px; }
    .product-card .name-wrap { flex: 1; }
    .product-card .name { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
    .product-card .price { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
    .product-card .cta-btn {
      display: inline-block; padding: 8px 16px; color: #fff;
      text-decoration: none; border-radius: 4px; font-size: 12px;
      margin-top: auto;
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
        <div class="name-wrap"><p class="name">${escapeHtml(p.name)}</p></div>
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

// ════════════════════════════════════════════════════════════════════════
// jabs.se-uttrycket (proffskanalen)
// ════════════════════════════════════════════════════════════════════════

function getJabsStyles(settings: NewsletterSettings, t: JabsTheme): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${settings.font_family};
      background-color: ${t.pageBg};
      color: ${t.body};
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    .newsletter-wrapper { display: flex; justify-content: center; padding: 24px 16px; }
    .newsletter-container {
      width: 100%; max-width: 600px;
      background-color: ${t.surface};
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .block-section { width: 100%; }
    img { max-width: 100%; height: auto; display: block; }
    a { color: ${t.link}; }

    /* Header-chrome */
    .j-header { background-color: ${t.surface}; }
    .j-hd-utility { text-align: center; font-size: 11px; color: ${t.muted}; padding: 10px 24px; }
    .j-hd-utility a { color: ${t.muted}; text-decoration: underline; }
    .j-hd-main { display: flex; align-items: center; justify-content: space-between; border-top: 4px solid ${t.accent}; padding: 20px 28px 14px 28px; }
    .j-hd-logo { width: 160px; max-width: 160px; height: auto; }
    .j-hd-logotext { font-size: 20px; font-weight: 700; color: ${t.ink}; }
    .j-hd-label { font-size: 11px; font-weight: 700; letter-spacing: 2px; color: ${t.muted}; text-transform: uppercase; }
    .j-hd-stores { display: flex; border-top: 1px solid ${t.dividerLine}; padding: 12px 22px; gap: 10px; }
    .j-hd-store { flex: 1; display: flex; align-items: center; justify-content: center; }
    .j-hd-store img { max-height: 50px; width: auto; display: inline-block; }
    .j-hd-store span { font-size: 14px; font-weight: 700; color: ${t.ink}; }

    /* Hero */
    .j-hero { background-color: ${t.surface}; }
    .j-hero .j-hero-image { width: 100%; }
    .j-hero .j-hero-content { padding: 30px 36px 34px 36px; }
    .j-hero h1 { font-size: 34px; line-height: 40px; font-weight: 700; color: ${t.ink}; margin-bottom: 12px; }
    .j-hero .j-subtitle { font-size: 15px; line-height: 24px; color: ${t.body}; margin-bottom: 22px; }
    .j-btn {
      display: inline-block; padding: 14px 30px; color: ${t.accentInk};
      text-decoration: none; border-radius: 3px; font-size: 14px; font-weight: 700; letter-spacing: 0.4px;
    }

    /* Text */
    .j-text { background-color: ${t.surface}; padding: 30px 36px; }
    .j-text .j-heading { border-left: 4px solid ${t.link}; padding-left: 12px; font-size: 20px; font-weight: 700; line-height: 1.3; color: ${t.ink}; margin-bottom: 14px; }
    .j-text .j-body { font-size: 14px; line-height: 23px; color: ${t.body}; }
    .j-text .j-body p { margin-bottom: 12px; }
    .j-text .j-body a { color: ${t.link}; }

    /* Image + Text */
    .j-imgtext { background-color: ${t.surface}; display: flex; gap: 24px; padding: 28px 30px; align-items: center; }
    .j-imgtext.reverse { flex-direction: row-reverse; }
    .j-imgtext .j-col-img { flex: 1; min-width: 0; }
    .j-imgtext .j-col-img img { width: 100%; }
    .j-imgtext .j-col-text { flex: 1; }
    .j-imgtext h3 { font-size: 18px; font-weight: 700; color: ${t.ink}; margin-bottom: 8px; }
    .j-imgtext .j-body { font-size: 14px; line-height: 23px; color: ${t.body}; margin-bottom: 14px; }
    .j-link { color: ${t.link}; font-size: 14px; font-weight: 700; text-decoration: none; }

    /* Campaign / featured (mörk) */
    .j-featured { padding: 8px 24px 26px 24px; background-color: ${t.sectionBg}; }
    .j-featured-inner { display: flex; background-color: ${t.featuredBg}; }
    .j-featured-inner .j-col-img { flex: 0 0 45%; background-color: ${t.featuredImageBg}; display: flex; align-items: center; justify-content: center; }
    .j-featured-inner .j-col-img img { width: 100%; }
    .j-featured-inner .j-col-text { flex: 1; padding: 26px 28px; }
    .j-featured h2 { font-size: 23px; line-height: 28px; font-weight: 700; color: ${t.featuredInk}; margin-bottom: 10px; }
    .j-featured .j-body { font-size: 14px; line-height: 22px; color: ${t.featuredBody}; margin-bottom: 16px; }
    .j-featured.center { padding: 0; }
    .j-featured.center .j-featured-banner { background-color: ${t.featuredBg}; padding: 34px 28px; text-align: center; }

    /* Divider */
    .j-divider.line hr { border: none; border-top-style: solid; }
    .j-divider.dots { text-align: center; font-size: 20px; letter-spacing: 8px; padding: 8px 0; background-color: ${t.surface}; }

    /* Footer */
    .j-footer { background-color: ${t.footerBg}; padding: 30px 36px 28px 36px; text-align: center; }
    .j-footer .j-company { font-size: 15px; font-weight: 700; color: ${t.footerInk}; margin-bottom: 8px; }
    .j-footer .j-address { font-size: 12px; color: ${t.footerMuted}; margin-bottom: 4px; }
    .j-footer .j-contact { font-size: 12px; color: ${t.footerMuted}; margin-top: 4px; }
    .j-footer .j-contact a { color: ${t.footerMuted}; }
    .j-footer .j-social { font-size: 13px; font-weight: 700; margin: 8px 0 0 0; }
    .j-footer .j-social a { color: ${t.footerInk}; text-decoration: none; margin: 0 6px; }
    .j-footer .j-unsub { font-size: 11px; color: ${t.footerMuted}; margin-top: 16px; }
    .j-footer .j-unsub a { color: ${t.footerMuted}; text-decoration: underline; }

    /* Badges */
    .j-badge { display: inline-block; background-color: ${t.accent}; color: ${t.accentInk}; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 3px 8px; }
    .j-badge.secondary { background-color: ${t.badgeSecondary}; text-transform: none; }
    .j-pricelabel { font-size: 11px; color: ${t.muted}; }

    /* Product (enskild) */
    .j-product { background-color: ${t.sectionBg}; padding: 14px 24px; }
    .j-product-card { display: flex; gap: 0; background-color: ${t.surface}; border: 1px solid ${t.cardBorder}; }
    .j-product-card .j-col-img { flex: 0 0 40%; display: flex; align-items: center; justify-content: center; padding: 14px; }
    .j-product-card .j-col-img img { width: 100%; }
    .j-product-card .j-col-info { flex: 1; padding: 16px 18px; }
    .j-product-card h3 { font-size: 16px; font-weight: 700; color: ${t.ink}; line-height: 20px; margin: 8px 0 4px; }
    .j-product-card .j-desc { font-size: 12px; color: ${t.muted}; margin-bottom: 8px; }
    .j-product-card .j-sku { font-size: 11px; color: ${t.muted}; margin-bottom: 6px; }
    .j-product-card .j-price { font-size: 20px; font-weight: 700; color: ${t.accent}; margin: 0 0 12px; }

    /* Product grid */
    .j-gridhead { background-color: ${t.sectionBg}; padding: 26px 36px 8px 36px; }
    .j-gridhead .j-heading { border-left: 5px solid ${t.accent}; padding-left: 12px; font-size: 20px; font-weight: 700; color: ${t.ink}; }
    .j-grid-block { background-color: ${t.sectionBg}; padding: 14px 18px 22px; }
    .j-grid { display: grid; gap: 12px; }
    .j-grid.cols-2 { grid-template-columns: 1fr 1fr; }
    .j-grid.cols-3 { grid-template-columns: 1fr 1fr 1fr; }
    .j-grid-card { display: flex; flex-direction: column; background-color: ${t.surface}; border: 1px solid ${t.cardBorder}; padding: 12px 14px; }
    .j-grid-card img { width: 100%; height: 120px; object-fit: contain; margin-bottom: 8px; }
    .j-grid-card .j-name { font-size: 14px; font-weight: 700; color: ${t.ink}; line-height: 19px; margin-bottom: 4px; flex: 1; }
    .j-grid-card .j-price { font-size: 18px; font-weight: 700; color: ${t.accent}; margin-bottom: 8px; }

    @media (max-width: 480px) {
      .j-imgtext { flex-direction: column !important; }
      .j-featured-inner { flex-direction: column; }
      .j-featured-inner .j-col-img { flex: none; }
      .j-product-card { flex-direction: column; }
      .j-product-card .j-col-img { flex: none; }
      .j-grid.cols-3 { grid-template-columns: 1fr 1fr; }
    }
  `;
}

function blockToJabsHtml(block: Block, t: JabsTheme): string {
  switch (block.type) {
    case 'hero':
      return heroJabsHtml(block.content as HeroContent, t);
    case 'text':
      return textJabsHtml(block.content as TextContent);
    case 'image-text':
      return imageTextJabsHtml(block.content as ImageTextContent);
    case 'campaign':
      return campaignJabsHtml(block.content as CampaignContent, t);
    case 'divider':
      return dividerJabsHtml(block.content as DividerContent, t);
    case 'footer':
      return footerJabsHtml(block.content as FooterContent);
    case 'product':
      return productJabsHtml(block.content as ProductContent);
    case 'product-grid':
      return productGridJabsHtml(block.content as ProductGridContent);
    default:
      return '';
  }
}

function headerJabsHtml(settings: NewsletterSettings, _t: JabsTheme): string {
  const logo = settings.header_logo_url
    ? `<img class="j-hd-logo" src="${escapeHtml(settings.header_logo_url)}" alt="${escapeHtml(settings.sender_name)}" />`
    : `<span class="j-hd-logotext">${escapeHtml(settings.sender_name)}</span>`;

  const label = (settings.header_label || 'Nyhetsbrev').toUpperCase();

  const stores = settings.header_stores ?? [];
  const storeEls = stores
    .map((st) =>
      st.logoUrl
        ? `<div class="j-hd-store"><img src="${escapeHtml(st.logoUrl)}" alt="${escapeHtml(st.name)}" /></div>`
        : `<div class="j-hd-store"><span>${escapeHtml(st.name)}</span></div>`
    )
    .join('');

  return `
    <div class="block-section j-header">
      <div class="j-hd-utility">Visas inte brevet korrekt? <a href="#">Öppna i webbläsaren</a></div>
      <div class="j-hd-main">
        <div class="j-hd-logo-wrap">${logo}</div>
        <div class="j-hd-label">${escapeHtml(label)}</div>
      </div>
      ${stores.length > 0 ? `<div class="j-hd-stores">${storeEls}</div>` : ''}
    </div>`;
}

function heroJabsHtml(content: HeroContent, t: JabsTheme): string {
  const img = content.imageUrl
    ? `<img class="j-hero-image" src="${escapeHtml(content.imageUrl)}" alt="${escapeHtml(content.imageAlt)}" />`
    : '';
  const cta = content.ctaText && content.ctaUrl
    ? `<a class="j-btn" href="${escapeHtml(content.ctaUrl)}" style="background-color:${content.ctaColor || t.accent}">${escapeHtml(content.ctaText)}</a>`
    : '';

  return `
    <div class="block-section j-hero" style="text-align:${content.textAlign}">
      ${img}
      <div class="j-hero-content">
        <h1>${escapeHtml(content.title)}</h1>
        ${content.subtitle ? `<p class="j-subtitle">${escapeHtml(content.subtitle)}</p>` : ''}
        ${cta}
      </div>
    </div>`;
}

function textJabsHtml(content: TextContent): string {
  return `
    <div class="block-section j-text" style="text-align:${content.textAlign}">
      ${content.heading ? `<div class="j-heading">${escapeHtml(content.heading)}</div>` : ''}
      <div class="j-body">${content.body}</div>
    </div>`;
}

function imageTextJabsHtml(content: ImageTextContent): string {
  const cta = content.ctaText && content.ctaUrl
    ? `<a class="j-link" href="${escapeHtml(content.ctaUrl)}">${escapeHtml(content.ctaText)} &rarr;</a>`
    : '';

  return `
    <div class="block-section j-imgtext${content.imagePosition === 'right' ? ' reverse' : ''}">
      <div class="j-col-img">
        <img src="${escapeHtml(content.imageUrl)}" alt="${escapeHtml(content.imageAlt)}" />
      </div>
      <div class="j-col-text">
        ${content.heading ? `<h3>${escapeHtml(content.heading)}</h3>` : ''}
        <div class="j-body">${content.body}</div>
        ${cta}
      </div>
    </div>`;
}

function campaignJabsHtml(content: CampaignContent, t: JabsTheme): string {
  const cta = content.ctaText && content.ctaUrl
    ? `<a class="j-btn" href="${escapeHtml(content.ctaUrl)}" style="background-color:${content.ctaColor || t.accent}">${escapeHtml(content.ctaText)}</a>`
    : '';

  if (content.backgroundImageUrl) {
    return `
      <div class="block-section j-featured">
        <div class="j-featured-inner">
          <div class="j-col-img">
            <img src="${escapeHtml(content.backgroundImageUrl)}" alt="${escapeHtml(content.heading)}" />
          </div>
          <div class="j-col-text">
            <h2>${escapeHtml(content.heading)}</h2>
            ${content.body ? `<p class="j-body">${escapeHtml(content.body)}</p>` : ''}
            ${cta}
          </div>
        </div>
      </div>`;
  }

  return `
    <div class="block-section j-featured center">
      <div class="j-featured-banner">
        <h2>${escapeHtml(content.heading)}</h2>
        ${content.body ? `<p class="j-body">${escapeHtml(content.body)}</p>` : ''}
        ${cta}
      </div>
    </div>`;
}

function dividerJabsHtml(content: DividerContent, t: JabsTheme): string {
  if (content.style === 'space') {
    return `<div class="block-section" style="height:${content.height}px;background-color:${t.surface}"></div>`;
  }
  if (content.style === 'dots') {
    return `<div class="block-section j-divider dots" style="color:${content.lineColor || t.dividerLine}">&bull;&bull;&bull;</div>`;
  }
  return `<div class="block-section j-divider line" style="padding:8px 24px;background-color:${t.surface}"><hr style="border-top-color:${content.lineColor || t.dividerLine};border-top-width:${content.height}px" /></div>`;
}

function footerJabsHtml(content: FooterContent): string {
  const contactParts: string[] = [];
  if (content.phone) contactParts.push(escapeHtml(content.phone));
  if (content.email) contactParts.push(`<a href="mailto:${escapeHtml(content.email)}">${escapeHtml(content.email)}</a>`);
  if (content.websiteUrl) contactParts.push(`<a href="${escapeHtml(content.websiteUrl)}">${escapeHtml(content.websiteUrl)}</a>`);

  const social = content.socialLinks && content.socialLinks.length > 0
    ? `<p class="j-social">${content.socialLinks.map((l) => `<a href="${escapeHtml(l.url)}">${escapeHtml(l.platform)}</a>`).join(' · ')}</p>`
    : '';

  return `
    <div class="block-section j-footer">
      <p class="j-company">${escapeHtml(content.companyName)}</p>
      <p class="j-address">${escapeHtml(content.address)}</p>
      ${contactParts.length > 0 ? `<p class="j-contact">${contactParts.join(' | ')}</p>` : ''}
      ${social}
      <p class="j-unsub"><a href="${escapeHtml(content.unsubscribeUrl)}">${escapeHtml(content.unsubscribeText)}</a></p>
    </div>`;
}

function productJabsHtml(content: ProductContent): string {
  return `
    <div class="block-section j-product">
      <div class="j-product-card">
        <div class="j-col-img">
          <img src="${escapeHtml(content.imageUrl)}" alt="${escapeHtml(content.name)}" />
        </div>
        <div class="j-col-info">
          ${content.badge ? `<span class="j-badge">${escapeHtml(content.badge)}</span>` : ''}
          <h3>${escapeHtml(content.name)}</h3>
          ${content.description ? `<p class="j-desc">${escapeHtml(content.description)}</p>` : ''}
          ${content.sku ? `<p class="j-sku">Art.nr: ${escapeHtml(content.sku)}</p>` : ''}
          <p class="j-pricelabel">Pris från</p>
          <p class="j-price">${escapeHtml(content.price)}</p>
          <a class="j-link" href="${escapeHtml(content.productUrl)}">Visa produkt &rarr;</a>
        </div>
      </div>
    </div>`;
}

function productGridJabsHtml(content: ProductGridContent): string {
  const cards = content.products
    .slice(0, content.columns)
    .map(
      (p) => `
      <div class="j-grid-card">
        ${p.badge ? `<span class="j-badge" style="margin-bottom:6px">${escapeHtml(p.badge)}</span>` : ''}
        <img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" />
        <p class="j-name">${escapeHtml(p.name)}</p>
        <p class="j-pricelabel">Pris från</p>
        <p class="j-price">${escapeHtml(p.price)}</p>
        <a class="j-link" href="${escapeHtml(p.productUrl)}">Visa &rarr;</a>
      </div>`
    )
    .join('\n');

  return `
    ${content.heading ? `<div class="block-section j-gridhead"><div class="j-heading">${escapeHtml(content.heading)}</div></div>` : ''}
    <div class="block-section j-grid-block">
      <div class="j-grid cols-${content.columns}">
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
