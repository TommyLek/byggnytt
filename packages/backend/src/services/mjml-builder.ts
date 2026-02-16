import mjml from 'mjml';
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
  BlockStyle,
} from '@byggnytt/shared';

interface BuildResult {
  html: string;
  errors: string[];
}

/**
 * Konverterar en lista av block + settings till mailkompatibel HTML via MJML.
 */
export function buildMjml(blocks: Block[], settings: NewsletterSettings): BuildResult {
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  const mjmlBlocks = sortedBlocks
    .map((block) => blockToMjml(block, settings))
    .join('\n');

  const mjmlDocument = `
    <mjml>
      <mj-head>
        <mj-preview>${escapeHtml(settings.preheader || '')}</mj-preview>
        <mj-attributes>
          <mj-all font-family="${settings.font_family}" />
          <mj-text font-size="16px" line-height="1.5" color="#333333" />
          <mj-button background-color="${settings.color_primary}" font-size="16px" border-radius="4px" />
        </mj-attributes>
        <mj-style>
          .cta-button a { text-decoration: none !important; }
        </mj-style>
      </mj-head>
      <mj-body background-color="${settings.color_background}" width="600px">
        ${mjmlBlocks}
      </mj-body>
    </mjml>
  `;

  const result = mjml(mjmlDocument, {
    validationLevel: 'soft',
    minify: false,
  });

  return {
    html: result.html,
    errors: result.errors.map((e) => e.formattedMessage || e.message),
  };
}

function blockToMjml(block: Block, settings: NewsletterSettings): string {
  const sectionAttrs = buildSectionAttrs(block.style);

  switch (block.type) {
    case 'hero':
      return heroToMjml(block.content as HeroContent, sectionAttrs, settings);
    case 'text':
      return textToMjml(block.content as TextContent, sectionAttrs);
    case 'image-text':
      return imageTextToMjml(block.content as ImageTextContent, sectionAttrs, settings);
    case 'campaign':
      return campaignToMjml(block.content as CampaignContent, sectionAttrs);
    case 'divider':
      return dividerToMjml(block.content as DividerContent, sectionAttrs);
    case 'footer':
      return footerToMjml(block.content as FooterContent, sectionAttrs);
    case 'product':
      return productToMjml(block.content as ProductContent, sectionAttrs, settings);
    case 'product-grid':
      return productGridToMjml(block.content as ProductGridContent, sectionAttrs, settings);
    default:
      return '';
  }
}

function buildSectionAttrs(style: BlockStyle): string {
  const parts: string[] = [];

  if (style.backgroundColor) {
    parts.push(`background-color="${style.backgroundColor}"`);
  }
  if (style.fullWidth) {
    parts.push('full-width="full-width"');
  }

  const pt = style.paddingTop ?? 16;
  const pb = style.paddingBottom ?? 16;
  const pl = style.paddingLeft ?? 24;
  const pr = style.paddingRight ?? 24;
  parts.push(`padding="${pt}px ${pr}px ${pb}px ${pl}px"`);

  return parts.join(' ');
}

// === Block → MJML mappningar ===

function heroToMjml(content: HeroContent, sectionAttrs: string, settings: NewsletterSettings): string {
  const imgSection = content.imageUrl
    ? `<mj-image src="${escapeHtml(content.imageUrl)}" alt="${escapeHtml(content.imageAlt)}" width="600px" padding="0" />`
    : '';

  const ctaButton = content.ctaText && content.ctaUrl
    ? `<mj-button href="${escapeHtml(content.ctaUrl)}" background-color="${content.ctaColor || settings.color_primary}" color="#ffffff" border-radius="4px" font-size="16px" padding="16px 0">
        ${escapeHtml(content.ctaText)}
       </mj-button>`
    : '';

  return `
    <mj-section ${sectionAttrs} padding="0">
      <mj-column>
        ${imgSection}
      </mj-column>
    </mj-section>
    <mj-section padding="24px">
      <mj-column>
        <mj-text align="${content.textAlign}" font-size="28px" font-weight="bold" line-height="1.2" padding="8px 0">
          ${escapeHtml(content.title)}
        </mj-text>
        ${content.subtitle ? `<mj-text align="${content.textAlign}" font-size="18px" color="#666666" padding="4px 0">${escapeHtml(content.subtitle)}</mj-text>` : ''}
        ${ctaButton}
      </mj-column>
    </mj-section>
  `;
}

function textToMjml(content: TextContent, sectionAttrs: string): string {
  const heading = content.heading
    ? `<mj-text align="${content.textAlign}" font-size="22px" font-weight="bold" line-height="1.3" padding="0 0 8px 0">
        ${escapeHtml(content.heading)}
       </mj-text>`
    : '';

  return `
    <mj-section ${sectionAttrs}>
      <mj-column>
        ${heading}
        <mj-text align="${content.textAlign}" font-size="16px" line-height="1.6" padding="0">
          ${content.body}
        </mj-text>
      </mj-column>
    </mj-section>
  `;
}

function imageTextToMjml(
  content: ImageTextContent,
  sectionAttrs: string,
  settings: NewsletterSettings
): string {
  const imageColumn = `
    <mj-column width="50%">
      <mj-image src="${escapeHtml(content.imageUrl)}" alt="${escapeHtml(content.imageAlt)}" width="280px" border-radius="4px" />
    </mj-column>
  `;

  const ctaButton = content.ctaText && content.ctaUrl
    ? `<mj-button href="${escapeHtml(content.ctaUrl)}" background-color="${settings.color_primary}" color="#ffffff" border-radius="4px" font-size="14px" padding="16px 0" align="left">
        ${escapeHtml(content.ctaText)}
       </mj-button>`
    : '';

  const textColumn = `
    <mj-column width="50%">
      ${content.heading ? `<mj-text font-size="20px" font-weight="bold" padding="0 0 8px 0">${escapeHtml(content.heading)}</mj-text>` : ''}
      <mj-text font-size="15px" line-height="1.6" padding="0">
        ${content.body}
      </mj-text>
      ${ctaButton}
    </mj-column>
  `;

  const columns = content.imagePosition === 'left'
    ? imageColumn + textColumn
    : textColumn + imageColumn;

  return `
    <mj-section ${sectionAttrs} direction="${content.imagePosition === 'right' ? 'rtl' : 'ltr'}">
      ${columns}
    </mj-section>
  `;
}

function campaignToMjml(content: CampaignContent, _sectionAttrs: string): string {
  const bgImage = content.backgroundImageUrl
    ? `background-url="${escapeHtml(content.backgroundImageUrl)}" background-size="cover"`
    : '';

  return `
    <mj-section background-color="${content.backgroundColor}" ${bgImage} padding="40px 24px">
      <mj-column>
        <mj-text align="center" font-size="26px" font-weight="bold" color="${content.textColor}" padding="0 0 12px 0">
          ${escapeHtml(content.heading)}
        </mj-text>
        ${content.body ? `<mj-text align="center" font-size="16px" color="${content.textColor}" padding="0 0 20px 0">${escapeHtml(content.body)}</mj-text>` : ''}
        <mj-button href="${escapeHtml(content.ctaUrl)}" background-color="${content.ctaColor}" color="#ffffff" border-radius="4px" font-size="16px">
          ${escapeHtml(content.ctaText)}
        </mj-button>
      </mj-column>
    </mj-section>
  `;
}

function dividerToMjml(content: DividerContent, sectionAttrs: string): string {
  if (content.style === 'space') {
    return `
      <mj-section ${sectionAttrs}>
        <mj-column>
          <mj-spacer height="${content.height}px" />
        </mj-column>
      </mj-section>
    `;
  }

  if (content.style === 'dots') {
    return `
      <mj-section ${sectionAttrs}>
        <mj-column>
          <mj-text align="center" font-size="20px" color="${content.lineColor || '#DDDDDD'}" letter-spacing="8px" padding="8px 0">
            &bull;&bull;&bull;
          </mj-text>
        </mj-column>
      </mj-section>
    `;
  }

  // line (default)
  return `
    <mj-section ${sectionAttrs}>
      <mj-column>
        <mj-divider border-color="${content.lineColor || '#DDDDDD'}" border-width="${content.height}px" padding="8px 0" />
      </mj-column>
    </mj-section>
  `;
}

function footerToMjml(content: FooterContent, _sectionAttrs: string): string {
  const contactParts: string[] = [];
  if (content.phone) contactParts.push(escapeHtml(content.phone));
  if (content.email) contactParts.push(`<a href="mailto:${escapeHtml(content.email)}" style="color:#999999">${escapeHtml(content.email)}</a>`);
  if (content.websiteUrl) contactParts.push(`<a href="${escapeHtml(content.websiteUrl)}" style="color:#999999">${escapeHtml(content.websiteUrl)}</a>`);

  const socialSection = content.socialLinks && content.socialLinks.length > 0
    ? `<mj-social font-size="12px" icon-size="24px" mode="horizontal" padding="8px 0">
        ${content.socialLinks.map((link) => `<mj-social-element name="${link.platform}" href="${escapeHtml(link.url)}" />`).join('\n')}
       </mj-social>`
    : '';

  return `
    <mj-section background-color="#333333" padding="24px">
      <mj-column>
        <mj-text align="center" font-size="14px" color="#ffffff" font-weight="bold" padding="0 0 8px 0">
          ${escapeHtml(content.companyName)}
        </mj-text>
        <mj-text align="center" font-size="12px" color="#cccccc" padding="0 0 4px 0">
          ${escapeHtml(content.address)}
        </mj-text>
        ${contactParts.length > 0 ? `<mj-text align="center" font-size="12px" color="#999999" padding="4px 0">${contactParts.join(' | ')}</mj-text>` : ''}
        ${socialSection}
        <mj-text align="center" font-size="11px" color="#999999" padding="16px 0 0 0">
          <a href="${escapeHtml(content.unsubscribeUrl)}" style="color:#999999; text-decoration:underline">
            ${escapeHtml(content.unsubscribeText)}
          </a>
        </mj-text>
      </mj-column>
    </mj-section>
  `;
}

function productToMjml(content: ProductContent, sectionAttrs: string, settings: NewsletterSettings): string {
  const badge = content.badge
    ? `<mj-text font-size="12px" font-weight="bold" color="${settings.color_primary}" padding="0 0 4px 0">${escapeHtml(content.badge)}</mj-text>`
    : '';

  return `
    <mj-section ${sectionAttrs}>
      <mj-column width="40%">
        <mj-image src="${escapeHtml(content.imageUrl)}" alt="${escapeHtml(content.name)}" width="220px" border-radius="4px" />
      </mj-column>
      <mj-column width="60%">
        ${badge}
        <mj-text font-size="18px" font-weight="bold" padding="0 0 4px 0">
          ${escapeHtml(content.name)}
        </mj-text>
        ${content.description ? `<mj-text font-size="14px" color="#666666" padding="0 0 8px 0">${escapeHtml(content.description)}</mj-text>` : ''}
        <mj-text font-size="12px" color="#999999" padding="0 0 4px 0">
          Art.nr: ${escapeHtml(content.sku)}
        </mj-text>
        <mj-text font-size="20px" font-weight="bold" color="${settings.color_primary}" padding="4px 0 12px 0">
          ${escapeHtml(content.price)}
        </mj-text>
        <mj-button href="${escapeHtml(content.productUrl)}" background-color="${settings.color_primary}" color="#ffffff" border-radius="4px" font-size="14px" align="left">
          Visa produkt
        </mj-button>
      </mj-column>
    </mj-section>
  `;
}

function productGridToMjml(content: ProductGridContent, sectionAttrs: string, settings: NewsletterSettings): string {
  const heading = content.heading
    ? `<mj-section padding="16px 24px 0 24px">
        <mj-column>
          <mj-text font-size="22px" font-weight="bold" padding="0">${escapeHtml(content.heading)}</mj-text>
        </mj-column>
       </mj-section>`
    : '';

  const colWidth = content.columns === 2 ? '50%' : '33.33%';

  const productColumns = content.products
    .slice(0, content.columns)
    .map(
      (p) => `
      <mj-column width="${colWidth}">
        <mj-image src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" width="180px" border-radius="4px" />
        ${p.badge ? `<mj-text font-size="11px" font-weight="bold" color="${settings.color_primary}" padding="8px 0 0 0">${escapeHtml(p.badge)}</mj-text>` : ''}
        <mj-text font-size="14px" font-weight="bold" padding="4px 0 2px 0">${escapeHtml(p.name)}</mj-text>
        <mj-text font-size="16px" font-weight="bold" color="${settings.color_primary}" padding="2px 0 8px 0">${escapeHtml(p.price)}</mj-text>
        <mj-button href="${escapeHtml(p.productUrl)}" background-color="${settings.color_primary}" color="#ffffff" border-radius="4px" font-size="12px" padding="0">
          Visa
        </mj-button>
      </mj-column>
    `
    )
    .join('\n');

  return `
    ${heading}
    <mj-section ${sectionAttrs}>
      ${productColumns}
    </mj-section>
  `;
}

// === Hjälpfunktioner ===

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
