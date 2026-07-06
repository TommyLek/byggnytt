import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Newsletter, Block, BlockType, NewsletterSettings } from '@byggnytt/shared';
import { getBlockDefaults } from '@byggnytt/shared';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface EditorState {
  newsletter: Newsletter | null;
  selectedBlockId: string | null;
  isDirty: boolean;
  saveState: SaveState;

  // Actions
  setNewsletter: (newsletter: Newsletter) => void;
  selectBlock: (blockId: string | null) => void;
  addBlock: (type: BlockType, index?: number) => void;
  removeBlock: (blockId: string) => void;
  duplicateBlock: (blockId: string) => void;
  moveBlock: (fromIndex: number, toIndex: number) => void;
  updateBlockContent: (blockId: string, content: Partial<Block['content']>) => void;
  updateBlockStyle: (blockId: string, style: Partial<Block['style']>) => void;
  updateSettings: (settings: Partial<NewsletterSettings>) => void;
  updateTitle: (title: string) => void;
  updateStatus: (status: Newsletter['status']) => void;
  setSaveState: (saveState: SaveState) => void;
  markClean: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  newsletter: null,
  selectedBlockId: null,
  isDirty: false,
  saveState: 'idle',

  setNewsletter: (newsletter) =>
    set({ newsletter, isDirty: false, selectedBlockId: null, saveState: 'idle' }),

  selectBlock: (blockId) => set({ selectedBlockId: blockId }),

  addBlock: (type, index) => {
    const { newsletter } = get();
    if (!newsletter) return;

    const defaults = getBlockDefaults(type);
    const newBlock: Block = {
      id: uuidv4(),
      type,
      order: 0,
      content: defaults.content,
      style: defaults.style,
    };

    const blocks = [...newsletter.blocks];
    const insertAt = index !== undefined ? index : blocks.length;
    blocks.splice(insertAt, 0, newBlock);

    // Uppdatera ordning
    blocks.forEach((b, i) => (b.order = i));

    set({
      newsletter: { ...newsletter, blocks },
      selectedBlockId: newBlock.id,
      isDirty: true,
    });
  },

  removeBlock: (blockId) => {
    const { newsletter, selectedBlockId } = get();
    if (!newsletter) return;

    const blocks = newsletter.blocks.filter((b) => b.id !== blockId);
    blocks.forEach((b, i) => (b.order = i));

    set({
      newsletter: { ...newsletter, blocks },
      selectedBlockId: selectedBlockId === blockId ? null : selectedBlockId,
      isDirty: true,
    });
  },

  duplicateBlock: (blockId) => {
    const { newsletter } = get();
    if (!newsletter) return;

    const blockIndex = newsletter.blocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) return;

    const original = newsletter.blocks[blockIndex];
    const duplicate: Block = {
      ...structuredClone(original),
      id: uuidv4(),
    };

    const blocks = [...newsletter.blocks];
    blocks.splice(blockIndex + 1, 0, duplicate);
    blocks.forEach((b, i) => (b.order = i));

    set({
      newsletter: { ...newsletter, blocks },
      selectedBlockId: duplicate.id,
      isDirty: true,
    });
  },

  moveBlock: (fromIndex, toIndex) => {
    const { newsletter } = get();
    if (!newsletter) return;

    const blocks = [...newsletter.blocks];
    const [moved] = blocks.splice(fromIndex, 1);
    blocks.splice(toIndex, 0, moved);
    blocks.forEach((b, i) => (b.order = i));

    set({
      newsletter: { ...newsletter, blocks },
      isDirty: true,
    });
  },

  updateBlockContent: (blockId, content) => {
    const { newsletter } = get();
    if (!newsletter) return;

    const blocks = newsletter.blocks.map((b) =>
      b.id === blockId ? { ...b, content: { ...b.content, ...content } } : b
    );

    set({
      newsletter: { ...newsletter, blocks },
      isDirty: true,
    });
  },

  updateBlockStyle: (blockId, style) => {
    const { newsletter } = get();
    if (!newsletter) return;

    const blocks = newsletter.blocks.map((b) =>
      b.id === blockId ? { ...b, style: { ...b.style, ...style } } : b
    );

    set({
      newsletter: { ...newsletter, blocks },
      isDirty: true,
    });
  },

  updateSettings: (settings) => {
    const { newsletter } = get();
    if (!newsletter) return;

    set({
      newsletter: {
        ...newsletter,
        settings: { ...newsletter.settings, ...settings },
      },
      isDirty: true,
    });
  },

  updateTitle: (title) => {
    const { newsletter } = get();
    if (!newsletter) return;

    set({
      newsletter: { ...newsletter, title },
      isDirty: true,
    });
  },

  updateStatus: (status) => {
    const { newsletter } = get();
    if (!newsletter) return;

    set({
      newsletter: { ...newsletter, status },
      isDirty: true,
    });
  },

  setSaveState: (saveState) => set({ saveState }),

  markClean: () => set({ isDirty: false, saveState: 'saved' }),
}));
