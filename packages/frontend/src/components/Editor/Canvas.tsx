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
import { useEditorStore } from '../../stores/editorStore';
import { BlockWrapper } from './BlockWrapper';
import { BlockRenderer } from '../Blocks/BlockRenderer';

export function Canvas() {
  const { newsletter, moveBlock, selectBlock } = useEditorStore();
  const blocks = newsletter?.blocks ?? [];

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
      className="max-w-[600px] mx-auto bg-white rounded-lg shadow-sm min-h-[400px]"
      onClick={() => selectBlock(null)}
    >
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
