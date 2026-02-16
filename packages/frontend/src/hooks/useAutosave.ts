import { useEffect, useRef } from 'react';
import { useEditorStore } from '../stores/editorStore';
import { api } from '../utils/api';
import { AUTOSAVE_DEBOUNCE_MS } from '@byggnytt/shared';

export function useAutosave() {
  const { newsletter, isDirty, markClean } = useEditorStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    if (!isDirty || !newsletter || savingRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      savingRef.current = true;
      try {
        await api.newsletters.update(newsletter.id, {
          title: newsletter.title,
          blocks: newsletter.blocks,
          settings: newsletter.settings,
          status: newsletter.status,
        });
        markClean();
      } catch (err) {
        console.error('Autosave misslyckades:', err);
      } finally {
        savingRef.current = false;
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isDirty, newsletter, markClean]);
}
