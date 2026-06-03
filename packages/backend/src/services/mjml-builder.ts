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
  JabsTheme,
  ThemeVariant,
} from '@byggnytt/shared';
import { themeVariant, jabsTheme } from '@byggnytt/shared';

interface BuildResult {
  html: string;
  errors: string[];
}

/**
 * Konverterar en lista av block + settings till mailkompatibel HTML via MJML.
 * Proffskanalen ('proffs') renderas med jabs.se-uttrycket; övriga kanaler
 * behåller den klassiska layouten.
 */
export function buildMjml(
  blocks: Block[],
  settings: NewsletterSettings,
  channel?: string
): BuildResult {
  const variant = themeVariant(channel);
  const jt = variant === 'jabs' ? jabsTheme(settings) : null;

  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  const blocksMjml = sortedBlocks
    .map((block) => blockToMjml(block, settings, variant, jt))
    .join('\n');

  // Fast header-chrome överst i proffskanalen
  const mjmlBlocks = jt ? headerJabsMjml(settings, jt) + '\n' + blocksMjml : blocksMjml;

  const head = jt
    ? `
        <mj-attributes>
          <mj-all font-family="${settings.font_family}" />
          <mj-text font-size="15px" line-height="1.6" color="${jt.body}" />
          <mj-button background-color="${jt.accent}" color="${jt.accentInk}" font-size="14px" font-weight="bold" border-radius="3px" inner-padding="14px 30px" />
        </mj-attributes>
        <mj-style>
          a { color: ${jt.link}; }
          .cta-button a { text-decoration: none !important; }
        </mj-style>`
    : `
        <mj-attributes>
          <mj-all font-family="${settings.font_family}" />
          <mj-text font-size="16px" line-height="1.5" color="#333333" />
          <mj-button background-color="${settings.color_primary}" font-size="16px" border-radius="4px" />
        </mj-attributes>
        <mj-style>
          .cta-button a { text-decoration: none !important; }
        </mj-style>`;

  const mjmlDocument = `
    <mjml>
      <mj-head>
        <mj-preview>${escapeHtml(settings.preheader || '')}</mj-preview>
        ${head}
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

function blockToMjml(
  block: Block,
  settings: NewsletterSettings,
  variant: ThemeVariant,
  jt: JabsTheme | null
): string {
  if (jt) {
    return blockToJabsMjml(block, settings, jt);
  }

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

// ════════════════════════════════════════════════════════════════════════
// jabs.se-uttrycket (proffskanalen)
// ════════════════════════════════════════════════════════════════════════

function blockToJabsMjml(block: Block, settings: NewsletterSettings, jt: JabsTheme): string {
  switch (block.type) {
    case 'hero':
      return heroJabsMjml(block.content as HeroContent, jt);
    case 'text':
      return textJabsMjml(block.content as TextContent, jt);
    case 'image-text':
      return imageTextJabsMjml(block.content as ImageTextContent, jt);
    case 'campaign':
      return campaignJabsMjml(block.content as CampaignContent, jt);
    case 'divider':
      return dividerJabsMjml(block.content as DividerContent, jt);
    case 'footer':
      return footerJabsMjml(block.content as FooterContent, jt);
    case 'product':
      return productJabsMjml(block.content as ProductContent, jt);
    case 'product-grid':
      return productGridJabsMjml(block.content as ProductGridContent, jt);
    default:
      return '';
  }
}

function headerJabsMjml(settings: NewsletterSettings, jt: JabsTheme): string {
  const logo = settings.header_logo_url
    ? `<mj-image src="${escapeHtml(settings.header_logo_url)}" alt="${escapeHtml(settings.sender_name)}" width="160px" align="left" padding="0" />`
    : `<mj-text align="left" font-size="20px" font-weight="bold" color="${jt.ink}" padding="0">${escapeHtml(settings.sender_name)}</mj-text>`;

  const label = (settings.header_label || 'Nyhetsbrev').toUpperCase();

  const stores = settings.header_stores ?? [];
  const storeCols = stores
    .map((st) =>
      st.logoUrl
        ? `<mj-column vertical-align="middle"><mj-image src="${escapeHtml(st.logoUrl)}" alt="${escapeHtml(st.name)}" width="150px" padding="10px 10px 0 10px" /></mj-column>`
        : `<mj-column vertical-align="middle"><mj-text align="center" font-size="14px" font-weight="bold" color="${jt.ink}" padding="14px 10px 0 10px">${escapeHtml(st.name)}</mj-text></mj-column>`
    )
    .join('');

  return `
    <mj-section background-color="${jt.surface}" padding="10px 24px">
      <mj-column>
        <mj-text align="center" font-size="11px" color="${jt.muted}" padding="0">
          Visas inte brevet korrekt? <a href="#" style="color:${jt.muted}; text-decoration:underline;">Öppna i webbläsaren</a>
        </mj-text>
      </mj-column>
    </mj-section>
    <mj-section background-color="${jt.surface}" border-top="4px solid ${jt.accent}" padding="20px 28px 14px 28px">
      <mj-column width="60%" vertical-align="middle">
        ${logo}
      </mj-column>
      <mj-column width="40%" vertical-align="middle">
        <mj-text align="right" font-size="11px" font-weight="bold" letter-spacing="2px" color="${jt.muted}" padding="0">${escapeHtml(label)}</mj-text>
      </mj-column>
    </mj-section>
    ${stores.length > 0 ? `
    <mj-section background-color="${jt.surface}" border-top="1px solid ${jt.dividerLine}" padding="10px 22px 12px 22px">
      ${storeCols}
    </mj-section>` : ''}
  `;
}

function heroJabsMjml(content: HeroContent, jt: JabsTheme): string {
  const imgSection = content.imageUrl
    ? `<mj-section background-color="${jt.surface}" padding="0">
         <mj-column>
           <mj-image src="${escapeHtml(content.imageUrl)}" alt="${escapeHtml(content.imageAlt)}" width="600px" padding="0" />
         </mj-column>
       </mj-section>`
    : '';

  const ctaButton = content.ctaText && content.ctaUrl
    ? `<mj-button css-class="cta-button" href="${escapeHtml(content.ctaUrl)}" background-color="${content.ctaColor || jt.accent}" align="${content.textAlign}">
         ${escapeHtml(content.ctaText)}
       </mj-button>`
    : '';

  return `
    ${imgSection}
    <mj-section background-color="${jt.surface}" padding="30px 36px 34px 36px">
      <mj-column>
        <mj-text align="${content.textAlign}" font-size="34px" font-weight="bold" line-height="40px" color="${jt.ink}" padding="0 0 12px 0">
          ${escapeHtml(content.title)}
        </mj-text>
        ${content.subtitle ? `<mj-text align="${content.textAlign}" font-size="15px" line-height="24px" color="${jt.body}" padding="0 0 22px 0">${escapeHtml(content.subtitle)}</mj-text>` : ''}
        ${ctaButton}
      </mj-column>
    </mj-section>
  `;
}

function textJabsMjml(content: TextContent, jt: JabsTheme): string {
  const heading = content.heading
    ? `<mj-text padding="0 0 14px 0">
         <div style="border-left:4px solid ${jt.link}; padding-left:12px; font-size:20px; font-weight:bold; line-height:1.3; color:${jt.ink};">
           ${escapeHtml(content.heading)}
         </div>
       </mj-text>`
    : '';

  return `
    <mj-section background-color="${jt.surface}" padding="30px 36px">
      <mj-column>
        ${heading}
        <mj-text align="${content.textAlign}" font-size="14px" line-height="23px" color="${jt.body}" padding="0">
          ${content.body}
        </mj-text>
      </mj-column>
    </mj-section>
  `;
}

function imageTextJabsMjml(content: ImageTextContent, jt: JabsTheme): string {
  const imageColumn = `
    <mj-column width="50%">
      <mj-image src="${escapeHtml(content.imageUrl)}" alt="${escapeHtml(content.imageAlt)}" width="280px" padding="0" />
    </mj-column>
  `;

  const ctaLink = content.ctaText && content.ctaUrl
    ? `<mj-text padding="14px 0 0 0">
         <a href="${escapeHtml(content.ctaUrl)}" style="color:${jt.link}; font-size:14px; font-weight:bold; text-decoration:none;">${escapeHtml(content.ctaText)} &rarr;</a>
       </mj-text>`
    : '';

  const textColumn = `
    <mj-column width="50%">
      ${content.heading ? `<mj-text font-size="18px" font-weight="bold" color="${jt.ink}" padding="0 0 8px 0">${escapeHtml(content.heading)}</mj-text>` : ''}
      <mj-text font-size="14px" line-height="23px" color="${jt.body}" padding="0">
        ${content.body}
      </mj-text>
      ${ctaLink}
    </mj-column>
  `;

  const columns = content.imagePosition === 'left'
    ? imageColumn + textColumn
    : textColumn + imageColumn;

  return `
    <mj-section background-color="${jt.surface}" padding="28px 30px" direction="${content.imagePosition === 'right' ? 'rtl' : 'ltr'}">
      ${columns}
    </mj-section>
  `;
}

function campaignJabsMjml(content: CampaignContent, jt: JabsTheme): string {
  const ctaButton = content.ctaText && content.ctaUrl
    ? `<mj-button css-class="cta-button" href="${escapeHtml(content.ctaUrl)}" background-color="${content.ctaColor || jt.accent}" align="left">
         ${escapeHtml(content.ctaText)}
       </mj-button>`
    : '';

  // Tvåkolumnskort (bild + text) när bild finns, annars centrerad mörk banner.
  if (content.backgroundImageUrl) {
    return `
      <mj-section background-color="${jt.sectionBg}" padding="8px 24px 26px 24px">
        <mj-column background-color="${jt.featuredImageBg}" width="45%" vertical-align="middle" padding="0">
          <mj-image src="${escapeHtml(content.backgroundImageUrl)}" alt="${escapeHtml(content.heading)}" padding="0" />
        </mj-column>
        <mj-column background-color="${jt.featuredBg}" width="55%" vertical-align="middle" padding="26px 28px">
          <mj-text font-size="23px" font-weight="bold" line-height="28px" color="${jt.featuredInk}" padding="0 0 10px 0">
            ${escapeHtml(content.heading)}
          </mj-text>
          ${content.body ? `<mj-text font-size="14px" line-height="22px" color="${jt.featuredBody}" padding="0 0 16px 0">${escapeHtml(content.body)}</mj-text>` : ''}
          ${ctaButton}
        </mj-column>
      </mj-section>
    `;
  }

  return `
    <mj-section background-color="${jt.featuredBg}" padding="34px 28px">
      <mj-column>
        <mj-text align="center" font-size="23px" font-weight="bold" line-height="28px" color="${jt.featuredInk}" padding="0 0 10px 0">
          ${escapeHtml(content.heading)}
        </mj-text>
        ${content.body ? `<mj-text align="center" font-size="14px" line-height="22px" color="${jt.featuredBody}" padding="0 0 18px 0">${escapeHtml(content.body)}</mj-text>` : ''}
        <mj-button css-class="cta-button" href="${escapeHtml(content.ctaUrl)}" background-color="${content.ctaColor || jt.accent}">
          ${escapeHtml(content.ctaText)}
        </mj-button>
      </mj-column>
    </mj-section>
  `;
}

function dividerJabsMjml(content: DividerContent, jt: JabsTheme): string {
  if (content.style === 'space') {
    return `
      <mj-section background-color="${jt.surface}" padding="0">
        <mj-column><mj-spacer height="${content.height}px" /></mj-column>
      </mj-section>
    `;
  }

  if (content.style === 'dots') {
    return `
      <mj-section background-color="${jt.surface}" padding="8px 24px">
        <mj-column>
          <mj-text align="center" font-size="20px" color="${content.lineColor || jt.dividerLine}" letter-spacing="8px" padding="8px 0">
            &bull;&bull;&bull;
          </mj-text>
        </mj-column>
      </mj-section>
    `;
  }

  return `
    <mj-section background-color="${jt.surface}" padding="8px 24px">
      <mj-column>
        <mj-divider border-color="${content.lineColor || jt.dividerLine}" border-width="${content.height}px" padding="8px 0" />
      </mj-column>
    </mj-section>
  `;
}

function footerJabsMjml(content: FooterContent, jt: JabsTheme): string {
  const contactParts: string[] = [];
  if (content.phone) contactParts.push(escapeHtml(content.phone));
  if (content.email) contactParts.push(`<a href="mailto:${escapeHtml(content.email)}" style="color:${jt.footerMuted}">${escapeHtml(content.email)}</a>`);
  if (content.websiteUrl) contactParts.push(`<a href="${escapeHtml(content.websiteUrl)}" style="color:${jt.footerMuted}">${escapeHtml(content.websiteUrl)}</a>`);

  const socialLinks = content.socialLinks && content.socialLinks.length > 0
    ? `<mj-text align="center" font-size="13px" font-weight="bold" color="${jt.footerInk}" padding="6px 0 0 0">
         ${content.socialLinks.map((l) => `<a href="${escapeHtml(l.url)}" style="color:${jt.footerInk}; text-decoration:none;">${escapeHtml(l.platform)}</a>`).join(' &nbsp;·&nbsp; ')}
       </mj-text>`
    : '';

  return `
    <mj-section background-color="${jt.footerBg}" padding="30px 36px 28px 36px">
      <mj-column>
        <mj-text align="center" font-size="15px" font-weight="bold" color="${jt.footerInk}" padding="0 0 8px 0">
          ${escapeHtml(content.companyName)}
        </mj-text>
        <mj-text align="center" font-size="12px" color="${jt.footerMuted}" padding="0 0 4px 0">
          ${escapeHtml(content.address)}
        </mj-text>
        ${contactParts.length > 0 ? `<mj-text align="center" font-size="12px" color="${jt.footerMuted}" padding="4px 0">${contactParts.join(' | ')}</mj-text>` : ''}
        ${socialLinks}
        <mj-text align="center" font-size="11px" color="${jt.footerMuted}" padding="16px 0 0 0">
          <a href="${escapeHtml(content.unsubscribeUrl)}" style="color:${jt.footerMuted}; text-decoration:underline">
            ${escapeHtml(content.unsubscribeText)}
          </a>
        </mj-text>
      </mj-column>
    </mj-section>
  `;
}

function productJabsMjml(content: ProductContent, jt: JabsTheme): string {
  const badge = content.badge
    ? `<mj-text padding="0 0 8px 0">
         <span style="display:inline-block; background-color:${jt.accent}; color:${jt.accentInk}; font-size:10px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; padding:3px 8px;">${escapeHtml(content.badge)}</span>
       </mj-text>`
    : '';

  return `
    <mj-section background-color="${jt.sectionBg}" padding="14px 24px">
      <mj-column background-color="${jt.surface}" border="1px solid ${jt.cardBorder}" width="40%" vertical-align="middle" padding="14px">
        <mj-image src="${escapeHtml(content.imageUrl)}" alt="${escapeHtml(content.name)}" padding="0" />
      </mj-column>
      <mj-column background-color="${jt.surface}" border="1px solid ${jt.cardBorder}" width="60%" vertical-align="top" padding="16px 18px">
        ${badge}
        <mj-text font-size="16px" font-weight="bold" color="${jt.ink}" line-height="20px" padding="0 0 4px 0">
          ${escapeHtml(content.name)}
        </mj-text>
        ${content.description ? `<mj-text font-size="12px" color="${jt.muted}" padding="0 0 8px 0">${escapeHtml(content.description)}</mj-text>` : ''}
        ${content.sku ? `<mj-text font-size="11px" color="${jt.muted}" padding="0 0 6px 0">Art.nr: ${escapeHtml(content.sku)}</mj-text>` : ''}
        <mj-text font-size="11px" color="${jt.muted}" padding="0">Pris från</mj-text>
        <mj-text font-size="20px" font-weight="bold" color="${jt.accent}" padding="0 0 12px 0">
          ${escapeHtml(content.price)}
        </mj-text>
        <mj-button css-class="cta-button" href="${escapeHtml(content.productUrl)}" background-color="${jt.accent}" align="left" inner-padding="11px 22px">
          Visa produkt
        </mj-button>
      </mj-column>
    </mj-section>
  `;
}

function productGridJabsMjml(content: ProductGridContent, jt: JabsTheme): string {
  const heading = content.heading
    ? `<mj-section background-color="${jt.sectionBg}" padding="26px 36px 8px 36px">
         <mj-column>
           <mj-text padding="0">
             <div style="border-left:5px solid ${jt.accent}; padding-left:12px; font-size:20px; font-weight:bold; color:${jt.ink};">
               ${escapeHtml(content.heading)}
             </div>
           </mj-text>
         </mj-column>
       </mj-section>`
    : '';

  const colWidth = content.columns === 2 ? '50%' : '33.33%';

  const productColumns = content.products
    .slice(0, content.columns)
    .map((p) => {
      const badge = p.badge
        ? `<mj-text padding="0 0 6px 0"><span style="display:inline-block; background-color:${jt.accent}; color:${jt.accentInk}; font-size:10px; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; padding:3px 7px;">${escapeHtml(p.badge)}</span></mj-text>`
        : '';
      return `
        <mj-column background-color="${jt.surface}" border="1px solid ${jt.cardBorder}" width="${colWidth}" padding="12px 14px" vertical-align="top">
          <mj-image src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" width="150px" height="150px" padding="0 0 8px 0" />
          ${badge}
          <mj-text font-size="14px" font-weight="bold" color="${jt.ink}" line-height="19px" padding="0 0 4px 0">${escapeHtml(p.name)}</mj-text>
          <mj-text font-size="11px" color="${jt.muted}" padding="0">Pris från</mj-text>
          <mj-text font-size="18px" font-weight="bold" color="${jt.accent}" padding="0 0 8px 0">${escapeHtml(p.price)}</mj-text>
          <mj-text font-size="12px" font-weight="bold" padding="0">
            <a href="${escapeHtml(p.productUrl)}" style="color:${jt.link}; text-decoration:none;">Visa &rarr;</a>
          </mj-text>
        </mj-column>
      `;
    })
    .join('\n');

  return `
    ${heading}
    <mj-section background-color="${jt.sectionBg}" padding="14px 18px 22px 18px">
      ${productColumns}
    </mj-section>
  `;
}

// ════════════════════════════════════════════════════════════════════════
// Klassiskt uttryck (konsument m.fl.)
// ════════════════════════════════════════════════════════════════════════

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
        <mj-image src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" width="150px" height="150px" border-radius="4px" />
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
