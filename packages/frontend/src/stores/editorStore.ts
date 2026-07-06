import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Newsletter, Block, BlockType, NewsletterSettings } from '@byggnytt/shared';
import { getBlockDefaults } from '@byggnytt/shared';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const HISTORY_LIMIT = 50;
// Snabba på varandra följande ändringar av samma fält (t.ex. tangenttryck)
// slås ihop till ett enda ångra-steg
const COALESCE_MS = 1000;

interface EditorState {
  newsletter: Newsletter | null;
  selectedBlockId: string | null;
  isDirty: boolean;
  saveState: SaveState;
  past: Newsletter[];
  future: Newsletter[];
  lastEditKey: string | null;
  lastEditAt: number;

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
  undo: () => void;
  redo: () => void;
  setSaveState: (saveState: SaveState) => void;
  markClean: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => {
  /**
   * Bygger history-delen av en state-uppdatering. Anropas INNAN newsletter
   * ändras så att nuvarande tillstånd hamnar i past. Ett editKey gör att
   * upprepade ändringar av samma fält inom COALESCE_MS blir ett ångra-steg.
   */
  const historyPatch = (editKey?: string) => {
    const s = get();
    if (!s.newsletter) return {};
    const now = Date.now();
    const coalesce =
      editKey !== undefined && s.lastEditKey === editKey && now - s.lastEditAt < COALESCE_MS;
    return {
      past: coalesce ? s.past : [...s.past.slice(-(HISTORY_LIMIT - 1)), s.newsletter],
      future: [] as Newsletter[],
      lastEditKey: editKey ?? null,
      lastEditAt: now,
    };
  };

  return {
    newsletter: null,
    selectedBlockId: null,
    isDirty: false,
    saveState: 'idle',
    past: [],
    future: [],
    lastEditKey: null,
    lastEditAt: 0,

    setNewsletter: (newsletter) =>
      set({
        newsletter,
        isDirty: false,
        selectedBlockId: null,
        saveState: 'idle',
        past: [],
        future: [],
        lastEditKey: null,
      }),

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
        ...historyPatch(),
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
        ...historyPatch(),
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
        ...historyPatch(),
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
        ...historyPatch(),
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
        ...historyPatch(`content:${blockId}`),
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
        ...historyPatch(`style:${blockId}`),
        newsletter: { ...newsletter, blocks },
        isDirty: true,
      });
    },

    updateSettings: (settings) => {
      const { newsletter } = get();
      if (!newsletter) return;

      set({
        ...historyPatch('settings'),
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
        ...historyPatch('title'),
        newsletter: { ...newsletter, title },
        isDirty: true,
      });
    },

    updateStatus: (status) => {
      const { newsletter } = get();
      if (!newsletter) return;

      set({
        ...historyPatch(),
        newsletter: { ...newsletter, status },
        isDirty: true,
      });
    },

    undo: () => {
      const { newsletter, past, future, selectedBlockId } = get();
      if (!newsletter || past.length === 0) return;

      const previous = past[past.length - 1];
      set({
        newsletter: previous,
        past: past.slice(0, -1),
        future: [newsletter, ...future].slice(0, HISTORY_LIMIT),
        selectedBlockId:
          selectedBlockId && previous.blocks.some((b) => b.id === selectedBlockId)
            ? selectedBlockId
            : null,
        isDirty: true,
        lastEditKey: null,
      });
    },

    redo: () => {
      const { newsletter, past, future, selectedBlockId } = get();
      if (!newsletter || future.length === 0) return;

      const [next, ...rest] = future;
      set({
        newsletter: next,
        past: [...past.slice(-(HISTORY_LIMIT - 1)), newsletter],
        future: rest,
        selectedBlockId:
          selectedBlockId && next.blocks.some((b) => b.id === selectedBlockId)
            ? selectedBlockId
            : null,
        isDirty: true,
        lastEditKey: null,
      });
    },

    setSaveState: (saveState) => set({ saveState }),

    markClean: () => set({ isDirty: false, saveState: 'saved' }),
  };
});
