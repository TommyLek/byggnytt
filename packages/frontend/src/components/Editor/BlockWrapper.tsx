import type { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BLOCK_TYPE_LABELS } from '@byggnytt/shared';
import type { Block } from '@byggnytt/shared';
import { useEditorStore } from '../../stores/editorStore';

interface BlockWrapperProps {
  block: Block;
  children: ReactNode;
}

export function BlockWrapper({ block, children }: BlockWrapperProps) {
  const { selectBlock, removeBlock, duplicateBlock, selectedBlockId } = useEditorStore();
  const isSelected = selectedBlockId === block.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group rounded-lg border-2 transition-colors ${
        isSelected
          ? 'border-blue-400 shadow-sm'
          : 'border-transparent hover:border-gray-200'
      }`}
      onClick={(e) => {
        e.stopPropagation();
        selectBlock(block.id);
      }}
    >
      {/* Toolbar */}
      <div
        className={`absolute -top-7 left-0 right-0 flex items-center justify-between text-xs z-10 transition-opacity ${
          isSelected || isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <div className="flex items-center gap-1">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="px-1.5 py-0.5 bg-gray-100 rounded cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-700 hover:bg-gray-200"
            title="Dra för att flytta"
          >
            ≡
          </button>
          <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">
            {BLOCK_TYPE_LABELS[block.type] || block.type}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              duplicateBlock(block.id);
            }}
            className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50"
            title="Duplicera"
          >
            ⊕
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeBlock(block.id);
            }}
            className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 hover:text-red-600 hover:bg-red-50"
            title="Ta bort"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Block content */}
      <div className="min-h-[40px]">{children}</div>
    </div>
  );
}
