import { useState } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { BLOCK_TYPE_LABELS, CHANNEL_CONFIG } from '@byggnytt/shared';
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
  HeaderStore,
} from '@byggnytt/shared';
import { ImageUploader } from './ImageUploader';
import { RichTextEditor } from './RichTextEditor';
import { ProductLookup } from './ProductLookup';

export function PropertyPanel() {
  const { newsletter, selectedBlockId, updateBlockContent, updateBlockStyle, updateSettings } =
    useEditorStore();

  const selectedBlock = newsletter?.blocks.find((b) => b.id === selectedBlockId);

  if (!selectedBlock) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Egenskaper</h2>
        <p className="text-xs text-gray-400">Valj ett block for att redigera dess egenskaper</p>

        {newsletter && (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Nyhetsbrevsinstellningar</h3>
            <SettingsForm />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700">
          {BLOCK_TYPE_LABELS[selectedBlock.type] || selectedBlock.type}
        </h2>
      </div>

      <div className="space-y-4">
        <BlockContentForm block={selectedBlock} />
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Stil</h3>
          <BlockStyleForm block={selectedBlock} />
        </div>
      </div>
    </div>
  );
}

function SettingsForm() {
  const { newsletter, updateSettings, updateTitle } = useEditorStore();
  if (!newsletter) return null;

  const s = newsletter.settings;
  const channelDefaults = CHANNEL_CONFIG[newsletter.channel].defaultSettings;

  const applyChannelPreset = () => {
    updateSettings({
      color_primary: channelDefaults.color_primary,
      color_secondary: channelDefaults.color_secondary,
      color_background: channelDefaults.color_background,
      font_family: channelDefaults.font_family,
      sender_name: channelDefaults.sender_name,
    });
  };

  return (
    <div className="space-y-3">
      {/* Kanalprofil-knapp */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Kanal: <strong>{CHANNEL_CONFIG[newsletter.channel].label}</strong>
        </span>
        <button
          onClick={applyChannelPreset}
          className="text-[11px] px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded transition-colors"
          title="Aterstall farger och typografi till kanalens standardvarden"
        >
          Aterstall kanalprofil
        </button>
      </div>

      <Field label="Titel">
        <input
          type="text"
          value={newsletter.title}
          onChange={(e) => updateTitle(e.target.value)}
          className="input-field"
        />
      </Field>
      <Field label="Amnesrad">
        <input
          type="text"
          value={s.subject}
          onChange={(e) => updateSettings({ subject: e.target.value })}
          className="input-field"
        />
      </Field>
      <Field label="Forhandstext">
        <input
          type="text"
          value={s.preheader}
          onChange={(e) => updateSettings({ preheader: e.target.value })}
          className="input-field"
          placeholder="Text som syns i mailklienten"
        />
      </Field>
      <Field label="Avsandarnamn">
        <input
          type="text"
          value={s.sender_name}
          onChange={(e) => updateSettings({ sender_name: e.target.value })}
          className="input-field"
        />
      </Field>

      {/* Header (endast proffskanalen) */}
      {newsletter.channel === 'proffs' && (
        <div className="border-t border-gray-200 pt-3 space-y-3">
          <span className="text-xs font-medium text-gray-600">Header</span>
          <Field label="Huvudlogga">
            <ImageUploader
              value={s.header_logo_url ?? ''}
              onChange={(url) => updateSettings({ header_logo_url: url })}
              height="h-16"
            />
          </Field>
          <Field label="Etikett">
            <input
              type="text"
              value={s.header_label ?? CHANNEL_CONFIG.proffs.defaultSettings.header_label ?? ''}
              onChange={(e) => updateSettings({ header_label: e.target.value })}
              className="input-field"
              placeholder="Nyhetsbrev"
            />
          </Field>
          <div>
            <span className="text-xs text-gray-500">Butikslogotyper</span>
            <div className="space-y-2 mt-1">
              {(s.header_stores ?? CHANNEL_CONFIG.proffs.defaultSettings.header_stores ?? []).map(
                (st, i, arr) => {
                  const updateStore = (patch: Partial<HeaderStore>) =>
                    updateSettings({
                      header_stores: arr.map((x, idx) =>
                        idx === i ? { ...x, ...patch } : { ...x },
                      ),
                    });
                  return (
                    <div key={i} className="border border-gray-200 rounded p-2 space-y-1.5">
                      <input
                        type="text"
                        value={st.name}
                        onChange={(e) => updateStore({ name: e.target.value })}
                        className="input-field"
                        placeholder="Butiksnamn"
                      />
                      <ImageUploader
                        value={st.logoUrl}
                        onChange={(url) => updateStore({ logoUrl: url })}
                        height="h-14"
                      />
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fargschema */}
      <div className="border-t border-gray-200 pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-600">Fargschema</span>
          <div className="flex gap-1">
            {(Object.entries(CHANNEL_CONFIG) as [string, (typeof CHANNEL_CONFIG)['proffs']][]).map(
              ([key, config]) => (
                <button
                  key={key}
                  onClick={() =>
                    updateSettings({
                      color_primary: config.defaultSettings.color_primary,
                      color_secondary: config.defaultSettings.color_secondary,
                      color_background: config.defaultSettings.color_background,
                    })
                  }
                  className="flex gap-0.5 p-1 rounded hover:bg-gray-100 transition-colors"
                  title={`${config.label}-farger`}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: config.defaultSettings.color_primary }}
                  />
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: config.defaultSettings.color_secondary }}
                  />
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      <Field label="Primarfarg">
        <div className="flex gap-2">
          <input
            type="color"
            value={s.color_primary}
            onChange={(e) => updateSettings({ color_primary: e.target.value })}
            className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={s.color_primary}
            onChange={(e) => updateSettings({ color_primary: e.target.value })}
            className="input-field flex-1"
          />
        </div>
      </Field>
      <Field label="Sekundarfarg">
        <div className="flex gap-2">
          <input
            type="color"
            value={s.color_secondary}
            onChange={(e) => updateSettings({ color_secondary: e.target.value })}
            className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={s.color_secondary}
            onChange={(e) => updateSettings({ color_secondary: e.target.value })}
            className="input-field flex-1"
          />
        </div>
      </Field>
      <Field label="Bakgrundsfarg">
        <div className="flex gap-2">
          <input
            type="color"
            value={s.color_background}
            onChange={(e) => updateSettings({ color_background: e.target.value })}
            className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={s.color_background}
            onChange={(e) => updateSettings({ color_background: e.target.value })}
            className="input-field flex-1"
          />
        </div>
      </Field>
      <Field label="Typsnitt">
        <select
          value={s.font_family}
          onChange={(e) => updateSettings({ font_family: e.target.value })}
          className="input-field"
        >
          <option value="Arial, Helvetica, sans-serif">Arial</option>
          <option value="Georgia, Times New Roman, serif">Georgia</option>
          <option value="Verdana, Geneva, sans-serif">Verdana</option>
          <option value="Trebuchet MS, sans-serif">Trebuchet MS</option>
          <option value="Tahoma, Geneva, sans-serif">Tahoma</option>
        </select>
      </Field>
    </div>
  );
}

function BlockContentForm({ block }: { block: Block }) {
  const updateBlockContent = useEditorStore((s) => s.updateBlockContent);
  const update = (content: Record<string, unknown>) => updateBlockContent(block.id, content);

  switch (block.type) {
    case 'hero':
      return <HeroForm content={block.content as HeroContent} update={update} />;
    case 'text':
      return <TextForm content={block.content as TextContent} update={update} />;
    case 'image-text':
      return <ImageTextForm content={block.content as ImageTextContent} update={update} />;
    case 'campaign':
      return <CampaignForm content={block.content as CampaignContent} update={update} />;
    case 'divider':
      return <DividerForm content={block.content as DividerContent} update={update} />;
    case 'footer':
      return <FooterForm content={block.content as FooterContent} update={update} />;
    case 'product':
      return <ProductForm content={block.content as ProductContent} update={update} />;
    case 'product-grid':
      return <ProductGridForm content={block.content as ProductGridContent} update={update} />;
    default:
      return <p className="text-xs text-gray-400">Inga egenskaper tillgangliga</p>;
  }
}

// ── Block-specifika formular ───────────────────────────────────────────

function HeroForm({
  content,
  update,
}: {
  content: HeroContent;
  update: (c: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Bild">
        <ImageUploader
          value={content.imageUrl}
          onChange={(url) => update({ imageUrl: url })}
          height="h-32"
        />
      </Field>
      <Field label="Alt-text">
        <input
          type="text"
          value={content.imageAlt}
          onChange={(e) => update({ imageAlt: e.target.value })}
          className="input-field"
        />
      </Field>
      <Field label="Rubrik">
        <input
          type="text"
          value={content.title}
          onChange={(e) => update({ title: e.target.value })}
          className="input-field"
        />
      </Field>
      <Field label="Underrubrik">
        <input
          type="text"
          value={content.subtitle || ''}
          onChange={(e) => update({ subtitle: e.target.value })}
          className="input-field"
        />
      </Field>
      <Field label="CTA-text">
        <input
          type="text"
          value={content.ctaText || ''}
          onChange={(e) => update({ ctaText: e.target.value })}
          className="input-field"
        />
      </Field>
      <Field label="CTA-lank">
        <input
          type="text"
          value={content.ctaUrl || ''}
          onChange={(e) => update({ ctaUrl: e.target.value })}
          className="input-field"
        />
      </Field>
      <Field label="CTA-farg">
        <div className="flex gap-2">
          <input
            type="color"
            value={content.ctaColor || '#E87A2E'}
            onChange={(e) => update({ ctaColor: e.target.value })}
            className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={content.ctaColor || '#E87A2E'}
            onChange={(e) => update({ ctaColor: e.target.value })}
            className="input-field flex-1"
          />
        </div>
      </Field>
      <Field label="Textjustering">
        <AlignSelect value={content.textAlign} onChange={(v) => update({ textAlign: v })} />
      </Field>
    </div>
  );
}

function TextForm({
  content,
  update,
}: {
  content: TextContent;
  update: (c: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Rubrik">
        <input
          type="text"
          value={content.heading || ''}
          onChange={(e) => update({ heading: e.target.value })}
          className="input-field"
        />
      </Field>
      <Field label="Brodtext">
        <RichTextEditor
          value={content.body}
          onChange={(html) => update({ body: html })}
          placeholder="Skriv din text har..."
          minHeight="100px"
        />
      </Field>
      <Field label="Textjustering">
        <AlignSelect value={content.textAlign} onChange={(v) => update({ textAlign: v })} />
      </Field>
    </div>
  );
}

function ImageTextForm({
  content,
  update,
}: {
  content: ImageTextContent;
  update: (c: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Bild">
        <ImageUploader
          value={content.imageUrl}
          onChange={(url) => update({ imageUrl: url })}
          height="h-24"
        />
      </Field>
      <Field label="Alt-text">
        <input
          type="text"
          value={content.imageAlt}
          onChange={(e) => update({ imageAlt: e.target.value })}
          className="input-field"
        />
      </Field>
      <Field label="Bildposition">
        <select
          value={content.imagePosition}
          onChange={(e) => update({ imagePosition: e.target.value })}
          className="input-field"
        >
          <option value="left">Vanster</option>
          <option value="right">Hoger</option>
        </select>
      </Field>
      <Field label="Rubrik">
        <input
          type="text"
          value={content.heading || ''}
          onChange={(e) => update({ heading: e.target.value })}
          className="input-field"
        />
      </Field>
      <Field label="Brodtext">
        <RichTextEditor
          value={content.body}
          onChange={(html) => update({ body: html })}
          placeholder="Beskrivande text har..."
          minHeight="80px"
        />
      </Field>
      <Field label="CTA-text">
        <input
          type="text"
          value={content.ctaText || ''}
          onChange={(e) => update({ ctaText: e.target.value })}
          className="input-field"
        />
      </Field>
      <Field label="CTA-lank">
        <input
          type="text"
          value={content.ctaUrl || ''}
          onChange={(e) => update({ ctaUrl: e.target.value })}
          className="input-field"
        />
      </Field>
    </div>
  );
}

function CampaignForm({
  content,
  update,
}: {
  content: CampaignContent;
  update: (c: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Rubrik">
        <input
          type="text"
          value={content.heading}
          onChange={(e) => update({ heading: e.target.value })}
          className="input-field"
        />
      </Field>
      <Field label="Brodtext">
        <input
          type="text"
          value={content.body || ''}
          onChange={(e) => update({ body: e.target.value })}
          className="input-field"
        />
      </Field>
      <Field label="Bakgrundsbild">
        <ImageUploader
          value={content.backgroundImageUrl || ''}
          onChange={(url) => update({ backgroundImageUrl: url })}
          height="h-24"
        />
      </Field>
      <Field label="CTA-text">
        <input
          type="text"
          value={content.ctaText}
          onChange={(e) => update({ ctaText: e.target.value })}
          className="input-field"
        />
      </Field>
      <Field label="CTA-lank">
        <input
          type="text"
          value={content.ctaUrl}
          onChange={(e) => update({ ctaUrl: e.target.value })}
          className="input-field"
        />
      </Field>
      <Field label="Bakgrundsfarg">
        <ColorField
          value={content.backgroundColor}
          onChange={(v) => update({ backgroundColor: v })}
        />
      </Field>
      <Field label="Textfarg">
        <ColorField value={content.textColor} onChange={(v) => update({ textColor: v })} />
      </Field>
      <Field label="CTA-farg">
        <ColorField value={content.ctaColor} onChange={(v) => update({ ctaColor: v })} />
      </Field>
    </div>
  );
}

function DividerForm({
  content,
  update,
}: {
  content: DividerContent;
  update: (c: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Stil">
        <select
          value={content.style}
          onChange={(e) => update({ style: e.target.value })}
          className="input-field"
        >
          <option value="line">Linje</option>
          <option value="space">Mellanrum</option>
          <option value="dots">Punkter</option>
        </select>
      </Field>
      <Field label="Hojd (px)">
        <input
          type="number"
          value={content.height}
          onChange={(e) => update({ height: parseInt(e.target.value) || 1 })}
          className="input-field"
          min={1}
          max={100}
        />
      </Field>
      {content.style !== 'space' && (
        <Field label="Farg">
          <ColorField
            value={content.lineColor || '#DDDDDD'}
            onChange={(v) => update({ lineColor: v })}
          />
        </Field>
      )}
    </div>
  );
}

function FooterForm({
  content,
  update,
}: {
  content: FooterContent;
  update: (c: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Foretagsnamn">
        <input
          type="text"
          value={content.companyName}
          onChange={(e) => update({ companyName: e.target.value })}
          className="input-field"
        />
      </Field>
      <Field label="Adress">
        <input
          type="text"
          value={content.address}
          onChange={(e) => update({ address: e.target.value })}
          className="input-field"
        />
      </Field>
      <Field label="Telefon">
        <input
          type="text"
          value={content.phone || ''}
          onChange={(e) => update({ phone: e.target.value })}
          className="input-field"
        />
      </Field>
      <Field label="E-post">
        <input
          type="text"
          value={content.email || ''}
          onChange={(e) => update({ email: e.target.value })}
          className="input-field"
        />
      </Field>
      <Field label="Webbplats">
        <input
          type="text"
          value={content.websiteUrl || ''}
          onChange={(e) => update({ websiteUrl: e.target.value })}
          className="input-field"
        />
      </Field>
      <Field label="Avregistreringstext">
        <input
          type="text"
          value={content.unsubscribeText}
          onChange={(e) => update({ unsubscribeText: e.target.value })}
          className="input-field"
        />
      </Field>
      <Field label="Avregistreringslank">
        <input
          type="text"
          value={content.unsubscribeUrl}
          onChange={(e) => update({ unsubscribeUrl: e.target.value })}
          className="input-field"
        />
      </Field>
    </div>
  );
}

function ProductForm({
  content,
  update,
}: {
  content: ProductContent;
  update: (c: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Hamta fran webshop">
        <ProductLookup
          currentSku={content.sku}
          onResult={(p) => update({ ...p })}
        />
      </Field>
      <div className="border-t border-gray-200 pt-3" />
      <Field label="Produktbild">
        <ImageUploader
          value={content.imageUrl}
          onChange={(url) => update({ imageUrl: url })}
          height="h-24"
        />
      </Field>
      <Field label="Produktnamn">
        <input
          type="text"
          value={content.name}
          onChange={(e) => update({ name: e.target.value })}
          className="input-field"
        />
      </Field>
      <Field label="Artikelnummer">
        <input
          type="text"
          value={content.sku}
          onChange={(e) => update({ sku: e.target.value })}
          className="input-field"
          placeholder="t.ex. ABC-123"
        />
      </Field>
      <Field label="Pris">
        <input
          type="text"
          value={content.price}
          onChange={(e) => update({ price: e.target.value })}
          className="input-field"
          placeholder="t.ex. 1 299 kr"
        />
      </Field>
      <Field label="Produktlank">
        <input
          type="text"
          value={content.productUrl}
          onChange={(e) => update({ productUrl: e.target.value })}
          className="input-field"
        />
      </Field>
      <Field label="Badge">
        <input
          type="text"
          value={content.badge || ''}
          onChange={(e) => update({ badge: e.target.value })}
          className="input-field"
          placeholder="t.ex. Nyhet, Rea, Popular"
        />
      </Field>
      <Field label="Beskrivning">
        <textarea
          value={content.description || ''}
          onChange={(e) => update({ description: e.target.value })}
          className="input-field min-h-[60px]"
        />
      </Field>
    </div>
  );
}

function ProductGridForm({
  content,
  update,
}: {
  content: ProductGridContent;
  update: (c: Record<string, unknown>) => void;
}) {
  const updateProduct = (index: number, changes: Partial<ProductContent>) => {
    const products = content.products.map((p, i) => (i === index ? { ...p, ...changes } : p));
    update({ products });
  };

  const addProduct = () => {
    const newProduct: ProductContent = {
      sku: '',
      name: `Produkt ${content.products.length + 1}`,
      price: '0 kr',
      imageUrl: '',
      productUrl: '#',
    };
    update({ products: [...content.products, newProduct] });
  };

  const addFromWebshop = (product: ProductContent) => {
    update({ products: [...content.products, product] });
  };

  const removeProduct = (index: number) => {
    update({ products: content.products.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-3">
      <Field label="Rubrik">
        <input
          type="text"
          value={content.heading || ''}
          onChange={(e) => update({ heading: e.target.value })}
          className="input-field"
        />
      </Field>
      <Field label="Kolumner">
        <select
          value={content.columns}
          onChange={(e) => update({ columns: parseInt(e.target.value) })}
          className="input-field"
        >
          <option value={2}>2 kolumner</option>
          <option value={3}>3 kolumner</option>
        </select>
      </Field>

      <div className="border-t border-gray-200 pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase">Produkter</span>
          <button
            type="button"
            onClick={addProduct}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            + Lagg till tom
          </button>
        </div>
        <div className="mb-3">
          <Field label="Lagg till fran webshop">
            <ProductLookup onResult={addFromWebshop} />
          </Field>
        </div>
        <div className="space-y-2">
          {content.products.map((product, i) => (
            <ProductFieldset
              key={i}
              product={product}
              index={i}
              onChange={updateProduct}
              onRemove={removeProduct}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductFieldset({
  product,
  index,
  onChange,
  onRemove,
}: {
  product: ProductContent;
  index: number;
  onChange: (index: number, changes: Partial<ProductContent>) => void;
  onRemove: (index: number) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-xs font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1"
        >
          <span className="text-[10px]">{open ? '\u25BC' : '\u25B6'}</span>
          {product.name || `Produkt ${index + 1}`}
        </button>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-xs text-red-500 hover:text-red-700"
        >
          Ta bort
        </button>
      </div>
      {open && (
        <div className="p-2 space-y-2">
          <Field label="Hamta fran webshop">
            <ProductLookup
              currentSku={product.sku}
              onResult={(p) => onChange(index, { ...p })}
            />
          </Field>
          <div className="border-t border-gray-200 pt-2" />
          <Field label="Bild">
            <ImageUploader
              value={product.imageUrl}
              onChange={(url) => onChange(index, { imageUrl: url })}
              height="h-20"
            />
          </Field>
          <Field label="Namn">
            <input
              type="text"
              value={product.name}
              onChange={(e) => onChange(index, { name: e.target.value })}
              className="input-field"
            />
          </Field>
          <Field label="Pris">
            <input
              type="text"
              value={product.price}
              onChange={(e) => onChange(index, { price: e.target.value })}
              className="input-field"
            />
          </Field>
          <Field label="Lank">
            <input
              type="text"
              value={product.productUrl}
              onChange={(e) => onChange(index, { productUrl: e.target.value })}
              className="input-field"
            />
          </Field>
          <Field label="Badge">
            <input
              type="text"
              value={product.badge || ''}
              onChange={(e) => onChange(index, { badge: e.target.value })}
              className="input-field"
              placeholder="Nyhet, Rea..."
            />
          </Field>
          <Field label="Artikelnr">
            <input
              type="text"
              value={product.sku}
              onChange={(e) => onChange(index, { sku: e.target.value })}
              className="input-field"
            />
          </Field>
        </div>
      )}
    </div>
  );
}

// ── Gemensamma hjalpkomponenter ────────────────────────────────────────

function BlockStyleForm({ block }: { block: Block }) {
  const updateBlockStyle = useEditorStore((s) => s.updateBlockStyle);
  const style = block.style;

  return (
    <div className="space-y-3">
      <Field label="Bakgrundsfarg">
        <div className="flex gap-2">
          <input
            type="color"
            value={style.backgroundColor || '#ffffff'}
            onChange={(e) => updateBlockStyle(block.id, { backgroundColor: e.target.value })}
            className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={style.backgroundColor || ''}
            onChange={(e) =>
              updateBlockStyle(block.id, { backgroundColor: e.target.value || undefined })
            }
            className="input-field flex-1"
            placeholder="Ingen"
          />
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Padding top">
          <input
            type="number"
            value={style.paddingTop ?? 16}
            onChange={(e) =>
              updateBlockStyle(block.id, { paddingTop: parseInt(e.target.value) || 0 })
            }
            className="input-field"
            min={0}
          />
        </Field>
        <Field label="Padding bottom">
          <input
            type="number"
            value={style.paddingBottom ?? 16}
            onChange={(e) =>
              updateBlockStyle(block.id, { paddingBottom: parseInt(e.target.value) || 0 })
            }
            className="input-field"
            min={0}
          />
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600 mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field flex-1"
      />
    </div>
  );
}

function AlignSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: 'left' | 'center' | 'right') => void;
}) {
  return (
    <div className="flex gap-1">
      {(['left', 'center', 'right'] as const).map((align) => (
        <button
          key={align}
          onClick={() => onChange(align)}
          className={`flex-1 py-1 text-xs rounded border ${
            value === align
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
        >
          {align === 'left' ? 'Vanster' : align === 'center' ? 'Center' : 'Hoger'}
        </button>
      ))}
    </div>
  );
}
