import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { NewsletterSettings } from '@byggnytt/shared';
import { jabsTheme } from '@byggnytt/shared';
import { useEditorStore } from '../../stores/editorStore';
import { BlockWrapper } from './BlockWrapper';
import { BlockRenderer } from '../Blocks/BlockRenderer';

export function Canvas() {
  const { newsletter, moveBlock, selectBlock } = useEditorStore();
  const blocks = newsletter?.blocks ?? [];
  const isProffs = newsletter?.channel === 'proffs';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      moveBlock(oldIndex, newIndex);
    }
  };

  return (
    <div
      className="max-w-[600px] mx-auto bg-white rounded-lg shadow-sm min-h-[400px] overflow-hidden"
      onClick={() => selectBlock(null)}
    >
      {isProffs && newsletter && <JabsHeaderChrome settings={newsletter.settings} />}
      {blocks.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
          <div className="text-center">
            <p className="mb-2">Inga block ännu</p>
            <p className="text-xs">Klicka på ett block i paletten till vänster</p>
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="py-4 px-2 space-y-6">
              {blocks.map((block) => (
                <BlockWrapper key={block.id} block={block}>
                  <BlockRenderer block={block} />
                </BlockWrapper>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

/**
 * Fast header-chrome för proffskanalen. Visningspreview i canvas –
 * innehållet (logga, etikett, butiker) redigeras via kanalinställningarna.
 */
function JabsHeaderChrome({ settings }: { settings: NewsletterSettings }) {
  const t = jabsTheme(settings);
  const label = (settings.header_label || 'Nyhetsbrev').toUpperCase();
  const stores = settings.header_stores ?? [];

  return (
    <div style={{ backgroundColor: t.surface }}>
      <div className="text-center text-[11px] px-6 py-2.5" style={{ color: t.muted }}>
        Visas inte brevet korrekt? <span className="underline">Öppna i webbläsaren</span>
      </div>
      <div
        className="flex items-center justify-between px-7 pt-5 pb-3.5"
        style={{ borderTop: `4px solid ${t.accent}` }}
      >
        {settings.header_logo_url ? (
          <img src={settings.header_logo_url} alt={settings.sender_name} className="h-9 w-auto object-contain" />
        ) : (
          <span className="text-lg font-bold" style={{ color: t.ink }}>{settings.sender_name}</span>
        )}
        <span
          className="font-bold tracking-[2px] uppercase"
          style={{ color: t.muted, fontSize: settings.header_label_size ?? 11 }}
        >
          {label}
        </span>
      </div>
      {stores.length > 0 && (
        <div className="flex gap-2.5 px-6 py-3" style={{ borderTop: `1px solid ${t.dividerLine}` }}>
          {stores.map((st, i) => (
            <div key={i} className="flex-1 flex items-center justify-center">
              {st.logoUrl ? (
                <img src={st.logoUrl} alt={st.name} className="max-h-12 w-auto object-contain" />
              ) : (
                <span className="text-sm font-bold text-center" style={{ color: t.ink }}>{st.name}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
