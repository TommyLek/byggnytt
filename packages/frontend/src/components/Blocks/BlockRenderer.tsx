import { useState, useRef, useEffect, useCallback } from 'react';
import type {
  Block,
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
import { jabsTheme } from '@byggnytt/shared';
import { useEditorStore } from '../../stores/editorStore';
import { api } from '../../utils/api';

interface BlockRendererProps {
  block: Block;
}

export function BlockRenderer({ block }: BlockRendererProps) {
  const channel = useEditorStore((s) => s.newsletter?.channel);
  const settings = useEditorStore((s) => s.newsletter?.settings);

  if (channel === 'proffs' && settings) {
    const t = jabsTheme(settings);
    switch (block.type) {
      case 'hero':
        return <HeroJabsPreview block={block} content={block.content as HeroContent} t={t} />;
      case 'text':
        return <TextJabsPreview block={block} content={block.content as TextContent} t={t} />;
      case 'image-text':
        return <ImageTextJabsPreview block={block} content={block.content as ImageTextContent} t={t} />;
      case 'campaign':
        return <CampaignJabsPreview block={block} content={block.content as CampaignContent} t={t} />;
      case 'divider':
        return <DividerPreview content={block.content as DividerContent} />;
      case 'footer':
        return <FooterJabsPreview block={block} content={block.content as FooterContent} t={t} />;
      case 'product':
        return <ProductJabsPreview block={block} content={block.content as ProductContent} t={t} />;
      case 'product-grid':
        return <ProductGridJabsPreview block={block} content={block.content as ProductGridContent} t={t} />;
      default:
        break;
    }
  }

  switch (block.type) {
    case 'hero':
      return <HeroPreview block={block} content={block.content as HeroContent} />;
    case 'text':
      return <TextPreview block={block} content={block.content as TextContent} />;
    case 'image-text':
      return <ImageTextPreview block={block} content={block.content as ImageTextContent} />;
    case 'campaign':
      return <CampaignPreview block={block} content={block.content as CampaignContent} />;
    case 'divider':
      return <DividerPreview content={block.content as DividerContent} />;
    case 'footer':
      return <FooterPreview block={block} content={block.content as FooterContent} />;
    case 'product':
      return <ProductPreview block={block} content={block.content as ProductContent} />;
    case 'product-grid':
      return <ProductGridPreview block={block} content={block.content as ProductGridContent} />;
    default:
      return (
        <div className="p-4 bg-gray-50 rounded text-sm text-gray-400 text-center">
          Block: {block.type}
        </div>
      );
  }
}

// ── Inline editing helper ──────────────────────────────────────────────

function InlineText({
  value,
  blockId,
  field,
  as: Tag = 'div',
  className,
  placeholder,
}: {
  value: string;
  blockId: string;
  field: string;
  as?: 'h2' | 'h3' | 'p' | 'div' | 'span';
  className?: string;
  placeholder?: string;
}) {
  const updateBlockContent = useEditorStore((s) => s.updateBlockContent);
  const ref = useRef<HTMLElement>(null);
  const internalValue = useRef(value);

  // Set content on mount
  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = value || '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external updates (not from our own edits)
  useEffect(() => {
    if (
      ref.current &&
      value !== internalValue.current &&
      document.activeElement !== ref.current
    ) {
      ref.current.textContent = value || '';
      internalValue.current = value;
    }
  }, [value]);

  const handleBlur = () => {
    const newText = ref.current?.textContent || '';
    if (newText !== internalValue.current) {
      internalValue.current = newText;
      updateBlockContent(blockId, { [field]: newText });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      ref.current?.blur();
    }
  };

  return (
    <Tag
      ref={ref as React.Ref<never>}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
      className={`${className || ''} inline-editable`}
      data-placeholder={placeholder}
    />
  );
}

// ── Canvas image with upload ───────────────────────────────────────────

function CanvasImage({
  url,
  alt,
  blockId,
  field,
  className,
  placeholderText,
}: {
  url: string;
  alt: string;
  blockId: string;
  field: string;
  className?: string;
  placeholderText?: string;
}) {
  const updateBlockContent = useEditorStore((s) => s.updateBlockContent);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return;
      setUploading(true);
      try {
        const result = await api.images.upload(file);
        updateBlockContent(blockId, { [field]: result.url });
      } catch (err) {
        console.error('Upload failed:', err);
      } finally {
        setUploading(false);
      }
    },
    [blockId, field, updateBlockContent],
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  if (url) {
    return (
      <div className={`relative group/img ${className || ''}`}>
        <img src={url} alt={alt} className="w-full h-full object-cover" />
        <div
          className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          onClick={handleClick}
        >
          <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">
            Byt bild
          </span>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`flex flex-col items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors ${className || ''}`}
    >
      {uploading ? (
        <div className="flex flex-col items-center">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-1" />
          <span className="text-xs text-gray-400">Laddar upp...</span>
        </div>
      ) : (
        <>
          <span className="text-2xl text-gray-400">+</span>
          <span className="text-xs text-gray-400 mt-1">
            {placeholderText || 'Ladda upp bild'}
          </span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

// ── Block previews with inline editing ─────────────────────────────────

function HeroPreview({ block, content }: { block: Block; content: HeroContent }) {
  return (
    <div style={{ textAlign: content.textAlign }}>
      <CanvasImage
        url={content.imageUrl}
        alt={content.imageAlt}
        blockId={block.id}
        field="imageUrl"
        className="w-full h-48 rounded-t"
        placeholderText="Hero-bild"
      />
      <div className="p-4">
        <InlineText
          value={content.title}
          blockId={block.id}
          field="title"
          as="h2"
          className="text-xl font-bold text-gray-900"
          placeholder="Rubrik"
        />
        <InlineText
          value={content.subtitle || ''}
          blockId={block.id}
          field="subtitle"
          as="p"
          className="text-sm text-gray-500 mt-1"
          placeholder="Underrubrik"
        />
        {content.ctaText && (
          <span
            className="inline-block mt-3 px-4 py-1.5 text-white text-sm rounded"
            style={{ backgroundColor: content.ctaColor || '#E87A2E' }}
          >
            {content.ctaText}
          </span>
        )}
      </div>
    </div>
  );
}

function TextPreview({ block, content }: { block: Block; content: TextContent }) {
  return (
    <div className="p-4" style={{ textAlign: content.textAlign }}>
      <InlineText
        value={content.heading || ''}
        blockId={block.id}
        field="heading"
        as="h3"
        className="text-lg font-bold text-gray-900 mb-1"
        placeholder="Rubrik"
      />
      <div
        className="text-sm text-gray-600 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: content.body }}
      />
    </div>
  );
}

function ImageTextPreview({
  block,
  content,
}: {
  block: Block;
  content: ImageTextContent;
}) {
  return (
    <div
      className={`flex gap-3 p-4 ${content.imagePosition === 'right' ? 'flex-row-reverse' : ''}`}
    >
      <div className="w-1/2">
        <CanvasImage
          url={content.imageUrl}
          alt={content.imageAlt}
          blockId={block.id}
          field="imageUrl"
          className="w-full h-32 rounded"
          placeholderText="Bild"
        />
      </div>
      <div className="w-1/2 flex flex-col justify-center">
        <InlineText
          value={content.heading || ''}
          blockId={block.id}
          field="heading"
          as="h3"
          className="text-sm font-bold text-gray-900 mb-1"
          placeholder="Rubrik"
        />
        <div
          className="text-xs text-gray-600 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content.body }}
        />
        {content.ctaText && (
          <span className="inline-block mt-2 text-xs text-blue-600 font-medium">
            {content.ctaText} &rarr;
          </span>
        )}
      </div>
    </div>
  );
}

function CampaignPreview({
  block,
  content,
}: {
  block: Block;
  content: CampaignContent;
}) {
  return (
    <div
      className="p-6 text-center rounded"
      style={{
        backgroundColor: content.backgroundColor,
        backgroundImage: content.backgroundImageUrl
          ? `url(${content.backgroundImageUrl})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: content.textColor,
      }}
    >
      <InlineText
        value={content.heading}
        blockId={block.id}
        field="heading"
        as="h2"
        className="text-lg font-bold mb-1"
        placeholder="Kampanjrubrik"
      />
      <InlineText
        value={content.body || ''}
        blockId={block.id}
        field="body"
        as="p"
        className="text-sm mb-3 opacity-90"
        placeholder="Kampanjtext"
      />
      <span
        className="inline-block px-4 py-1.5 text-white text-sm rounded"
        style={{ backgroundColor: content.ctaColor }}
      >
        {content.ctaText}
      </span>
    </div>
  );
}

function DividerPreview({ content }: { content: DividerContent }) {
  if (content.style === 'space') {
    return <div style={{ height: `${content.height}px` }} />;
  }
  if (content.style === 'dots') {
    return (
      <div
        className="text-center py-2"
        style={{
          color: content.lineColor || '#DDDDDD',
          letterSpacing: '8px',
          fontSize: '20px',
        }}
      >
        &bull;&bull;&bull;
      </div>
    );
  }
  return (
    <div className="px-4 py-2">
      <hr
        style={{
          borderTopColor: content.lineColor || '#DDDDDD',
          borderTopWidth: `${content.height}px`,
        }}
      />
    </div>
  );
}

function FooterPreview({ block, content }: { block: Block; content: FooterContent }) {
  return (
    <div className="bg-gray-800 text-center p-4 rounded text-white">
      <InlineText
        value={content.companyName}
        blockId={block.id}
        field="companyName"
        as="p"
        className="text-sm font-bold"
        placeholder="Företagsnamn"
      />
      <p className="text-xs text-gray-400 mt-1">{content.address}</p>
      {content.phone && <p className="text-xs text-gray-400">{content.phone}</p>}
      {content.email && <p className="text-xs text-gray-400">{content.email}</p>}
      <p className="text-xs text-gray-500 mt-2 underline">{content.unsubscribeText}</p>
    </div>
  );
}

function ProductPreview({ block, content }: { block: Block; content: ProductContent }) {
  return (
    <div className="p-4 flex gap-3">
      <CanvasImage
        url={content.imageUrl}
        alt={content.name}
        blockId={block.id}
        field="imageUrl"
        className="w-24 h-24 rounded flex-shrink-0"
        placeholderText="Produkt"
      />
      <div className="flex-1 min-w-0">
        <InlineText
          value={content.name}
          blockId={block.id}
          field="name"
          as="h3"
          className="text-sm font-bold text-gray-900"
          placeholder="Produktnamn"
        />
        {content.description && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{content.description}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-bold text-gray-900">{content.price}</span>
          {content.badge && (
            <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
              {content.badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductGridPreview({
  block,
  content,
}: {
  block: Block;
  content: ProductGridContent;
}) {
  return (
    <div className="p-4">
      {content.heading && (
        <InlineText
          value={content.heading}
          blockId={block.id}
          field="heading"
          as="h3"
          className="text-base font-bold text-gray-900 mb-3"
          placeholder="Rubrik"
        />
      )}
      <div
        className={`grid gap-3 ${content.columns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}
      >
        {content.products.map((product, i) => (
          <div key={i} className="border border-gray-200 rounded p-2">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-24 object-contain rounded mb-1"
              />
            ) : (
              <div className="w-full h-24 bg-gray-100 rounded mb-1 flex items-center justify-center text-gray-400 text-xs">
                Bild
              </div>
            )}
            <p className="text-xs font-bold text-gray-900 truncate">{product.name}</p>
            <p className="text-xs font-bold text-gray-700 mt-0.5">{product.price}</p>
            {product.badge && (
              <span className="inline-block px-1.5 py-0.5 bg-orange-100 text-orange-800 text-[10px] rounded-full font-medium mt-0.5">
                {product.badge}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── jabs.se-uttrycket (proffskanalen) ──────────────────────────────────

function HeroJabsPreview({ block, content, t }: { block: Block; content: HeroContent; t: JabsTheme }) {
  return (
    <div style={{ textAlign: content.textAlign, backgroundColor: t.surface }}>
      <CanvasImage
        url={content.imageUrl}
        alt={content.imageAlt}
        blockId={block.id}
        field="imageUrl"
        className="w-full h-48"
        placeholderText="Hero-bild"
      />
      <div className="px-7 pt-7 pb-8">
        <InlineText
          value={content.title}
          blockId={block.id}
          field="title"
          as="h2"
          className="text-3xl font-bold leading-tight"
          placeholder="Rubrik"
        />
        <InlineText
          value={content.subtitle || ''}
          blockId={block.id}
          field="subtitle"
          as="p"
          className="text-sm mt-2 mb-1"
          placeholder="Underrubrik"
        />
        {content.ctaText && (
          <span
            className="inline-block mt-4 px-6 py-3 text-xs font-bold tracking-wide"
            style={{ backgroundColor: content.ctaColor || t.accent, color: t.accentInk, borderRadius: 3 }}
          >
            {content.ctaText}
          </span>
        )}
      </div>
    </div>
  );
}

function TextJabsPreview({ block, content, t }: { block: Block; content: TextContent; t: JabsTheme }) {
  return (
    <div className="px-7 py-7" style={{ backgroundColor: t.surface, textAlign: content.textAlign }}>
      {content.heading !== undefined && (
        <div style={{ borderLeft: `4px solid ${t.link}`, paddingLeft: 12, marginBottom: 14 }}>
          <InlineText
            value={content.heading || ''}
            blockId={block.id}
            field="heading"
            as="div"
            className="text-xl font-bold leading-tight"
            placeholder="Rubrik"
          />
        </div>
      )}
      <div
        className="text-sm leading-relaxed"
        style={{ color: t.body }}
        dangerouslySetInnerHTML={{ __html: content.body }}
      />
    </div>
  );
}

function ImageTextJabsPreview({ block, content, t }: { block: Block; content: ImageTextContent; t: JabsTheme }) {
  return (
    <div
      className={`flex gap-4 px-7 py-7 items-center ${content.imagePosition === 'right' ? 'flex-row-reverse' : ''}`}
      style={{ backgroundColor: t.surface }}
    >
      <div className="w-1/2">
        <CanvasImage
          url={content.imageUrl}
          alt={content.imageAlt}
          blockId={block.id}
          field="imageUrl"
          className="w-full h-32"
          placeholderText="Bild"
        />
      </div>
      <div className="w-1/2">
        <InlineText
          value={content.heading || ''}
          blockId={block.id}
          field="heading"
          as="h3"
          className="text-base font-bold mb-1"
          placeholder="Rubrik"
        />
        <div
          className="text-xs leading-relaxed"
          style={{ color: t.body }}
          dangerouslySetInnerHTML={{ __html: content.body }}
        />
        {content.ctaText && (
          <span className="inline-block mt-2 text-sm font-bold" style={{ color: t.link }}>
            {content.ctaText} &rarr;
          </span>
        )}
      </div>
    </div>
  );
}

function CampaignJabsPreview({ block, content, t }: { block: Block; content: CampaignContent; t: JabsTheme }) {
  const hasImage = !!content.backgroundImageUrl;
  return (
    <div className={`flex ${hasImage ? '' : 'justify-center'}`} style={{ backgroundColor: t.featuredBg }}>
        {hasImage && (
          <div className="w-[45%]">
            <CanvasImage
              url={content.backgroundImageUrl || ''}
              alt={content.heading}
              blockId={block.id}
              field="backgroundImageUrl"
              className="w-full h-full min-h-[140px]"
              placeholderText="Bild"
            />
          </div>
        )}
        <div
          className={`${hasImage ? 'flex-1' : 'w-full text-center'} px-7 py-6`}
          style={{ color: t.featuredInk }}
        >
          <InlineText
            value={content.heading}
            blockId={block.id}
            field="heading"
            as="h2"
            className="text-lg font-bold mb-2"
            placeholder="Kampanjrubrik"
          />
          <div style={{ color: t.featuredBody }}>
            <InlineText
              value={content.body || ''}
              blockId={block.id}
              field="body"
              as="p"
              className="text-sm mb-3"
              placeholder="Kampanjtext"
            />
          </div>
          <span
            className="inline-block px-5 py-2.5 text-xs font-bold"
            style={{ backgroundColor: content.ctaColor || t.accent, color: t.accentInk, borderRadius: 3 }}
          >
            {content.ctaText}
          </span>
        </div>
      </div>
  );
}

function FooterJabsPreview({ block, content, t }: { block: Block; content: FooterContent; t: JabsTheme }) {
  return (
    <div className="text-center p-7" style={{ backgroundColor: t.footerBg, color: t.footerMuted }}>
      <InlineText
        value={content.companyName}
        blockId={block.id}
        field="companyName"
        as="p"
        className="text-sm font-bold"
        placeholder="Företagsnamn"
      />
      <p className="text-xs mt-1" style={{ color: t.footerMuted }}>{content.address}</p>
      {content.phone && <p className="text-xs" style={{ color: t.footerMuted }}>{content.phone}</p>}
      {content.email && <p className="text-xs" style={{ color: t.footerMuted }}>{content.email}</p>}
      {content.socialLinks && content.socialLinks.length > 0 && (
        <p className="text-xs font-bold mt-2" style={{ color: t.footerInk }}>
          {content.socialLinks.map((l) => l.platform).join(' · ')}
        </p>
      )}
      <p className="text-xs mt-3 underline" style={{ color: t.footerMuted }}>{content.unsubscribeText}</p>
    </div>
  );
}

function ProductJabsPreview({ block, content, t }: { block: Block; content: ProductContent; t: JabsTheme }) {
  return (
    <div className="px-7 py-5" style={{ backgroundColor: t.surface }}>
      <div className="flex gap-4 items-center">
        <div className="w-2/5 flex items-center">
          <CanvasImage
            url={content.imageUrl}
            alt={content.name}
            blockId={block.id}
            field="imageUrl"
            className="w-full h-24"
            placeholderText="Produkt"
          />
        </div>
        <div className="flex-1 min-w-0">
          {content.badge && (
            <span
              className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide mb-2"
              style={{ backgroundColor: t.accent, color: t.accentInk }}
            >
              {content.badge}
            </span>
          )}
          <InlineText
            value={content.name}
            blockId={block.id}
            field="name"
            as="h3"
            className="text-base font-bold leading-snug"
            placeholder="Produktnamn"
          />
          {content.description && (
            <p className="text-xs mt-1 line-clamp-2" style={{ color: t.muted }}>{content.description}</p>
          )}
          <p className="text-[11px] mt-2" style={{ color: t.muted }}>Pris från</p>
          <p className="text-xl font-bold" style={{ color: t.accent }}>{content.price}</p>
        </div>
      </div>
    </div>
  );
}

function ProductGridJabsPreview({ block, content, t }: { block: Block; content: ProductGridContent; t: JabsTheme }) {
  return (
    <div style={{ backgroundColor: t.surface }} className="px-7 pt-6 pb-5">
      {content.heading !== undefined && (
        <div style={{ borderLeft: `5px solid ${t.accent}`, paddingLeft: 12, marginBottom: 14 }}>
          <InlineText
            value={content.heading || ''}
            blockId={block.id}
            field="heading"
            as="h3"
            className="text-xl font-bold"
            placeholder="Rubrik"
          />
        </div>
      )}
      <div className={`grid gap-5 ${content.columns === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {content.products.map((product, i) => (
          <div key={i}>
            {product.badge && (
              <span
                className="inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide mb-1.5"
                style={{ backgroundColor: t.accent, color: t.accentInk }}
              >
                {product.badge}
              </span>
            )}
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-24 object-contain mb-2" />
            ) : (
              <div className="w-full h-24 mb-2 flex items-center justify-center text-xs" style={{ backgroundColor: t.sectionBg, color: t.muted }}>
                Bild
              </div>
            )}
            <p className="text-xs font-bold truncate" style={{ color: t.ink }}>{product.name}</p>
            <p className="text-[11px] mt-1" style={{ color: t.muted }}>Pris från</p>
            <p className="text-base font-bold" style={{ color: t.accent }}>{product.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
