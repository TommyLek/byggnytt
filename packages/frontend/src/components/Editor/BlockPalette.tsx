import type { BlockType } from '@byggnytt/shared';
import { BLOCK_TYPE_LABELS } from '@byggnytt/shared';
import { useEditorStore } from '../../stores/editorStore';

const PALETTE_BLOCKS: { type: BlockType; icon: string; description: string }[] = [
  { type: 'hero', icon: '🖼', description: 'Stor bild med rubrik och CTA' },
  { type: 'text', icon: '📝', description: 'Rubrik och brödtext' },
  { type: 'image-text', icon: '🖼📝', description: 'Bild och text sida vid sida' },
  { type: 'campaign', icon: '🎯', description: 'Kampanjbanner' },
  { type: 'product', icon: '📦', description: 'Enskild produkt med bild och pris' },
  { type: 'product-grid', icon: '📦📦', description: 'Produktrutnät (2–3 kolumner)' },
  { type: 'divider', icon: '➖', description: 'Avdelare eller mellanrum' },
  { type: 'footer', icon: '📋', description: 'Kontakt och avregistrering' },
];

interface BlockPaletteProps {
  /** Anropas efter att ett block lagts till (stänger t.ex. mobilpanelen) */
  onAdded?: () => void;
}

export function BlockPalette({ onAdded }: BlockPaletteProps) {
  const addBlock = useEditorStore((s) => s.addBlock);

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Block</h2>
      <div className="space-y-2">
        {PALETTE_BLOCKS.map(({ type, icon, description }) => (
          <button
            key={type}
            onClick={() => {
              addBlock(type);
              onAdded?.();
            }}
            className="w-full text-left p-2.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg w-7 text-center">{icon}</span>
              <div>
                <div className="text-sm font-medium text-gray-800 group-hover:text-blue-700">
                  {BLOCK_TYPE_LABELS[type]}
                </div>
                <div className="text-xs text-gray-400">{description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
