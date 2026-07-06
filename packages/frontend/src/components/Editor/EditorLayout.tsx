import { useEffect, useCallback, useState } from 'react';
import type { Newsletter } from '@byggnytt/shared';
import { CHANNEL_CONFIG } from '@byggnytt/shared';
import { useEditorStore } from '../../stores/editorStore';
import { useAutosave } from '../../hooks/useAutosave';
import { api } from '../../utils/api';
import { BlockPalette } from './BlockPalette';
import { Canvas } from './Canvas';
import { PropertyPanel } from './PropertyPanel';
import { PreviewPanel } from './PreviewPanel';
import { ExportDropdown } from './ExportDropdown';

interface EditorLayoutProps {
  newsletter: Newsletter;
  onBack: () => void;
}

export function EditorLayout({ newsletter, onBack }: EditorLayoutProps) {
  const {
    setNewsletter,
    newsletter: current,
    isDirty,
    markClean,
    saveState,
    setSaveState,
    updateStatus,
  } = useEditorStore();
  const [showPreview, setShowPreview] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  useAutosave();

  useEffect(() => {
    setNewsletter(newsletter);
  }, [newsletter, setNewsletter]);

  const handleSave = useCallback(async (): Promise<boolean> => {
    const state = useEditorStore.getState();
    if (!state.newsletter || !state.isDirty) return true;
    setSaveState('saving');
    try {
      await api.newsletters.update(state.newsletter.id, {
        title: state.newsletter.title,
        blocks: state.newsletter.blocks,
        settings: state.newsletter.settings,
        status: state.newsletter.status,
      });
      markClean();
      return true;
    } catch (err) {
      console.error('Spara misslyckades:', err);
      setSaveState('error');
      return false;
    }
  }, [markClean, setSaveState]);

  // Ctrl+S / Cmd+S sparar manuellt
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleSave]);

  // Varna innan fliken stängs med osparade ändringar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (useEditorStore.getState().isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Spara innan vi lämnar editorn; fråga bara om sparningen misslyckas
  const handleBack = async () => {
    const saved = await handleSave();
    if (
      saved ||
      window.confirm(
        'Ändringarna kunde inte sparas. Vill du lämna ändå? Osparade ändringar går förlorade.'
      )
    ) {
      onBack();
    }
  };

  if (!current) return null;

  const channelLabel = CHANNEL_CONFIG[current.channel].label;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="text-gray-500 hover:text-gray-700 text-sm">
            &larr; Tillbaka
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {current.title}
              <SaveIndicator isDirty={isDirty} saveState={saveState} />
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  current.channel === 'proffs'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                {channelLabel}
              </span>
              <StatusSelect value={current.status} onChange={updateStatus} />
              <span className="text-xs text-gray-400">{current.blocks.length} block</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSaveTemplate(true)}
            className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            title="Spara som mall"
          >
            Spara som mall
          </button>
          <button
            onClick={handleSave}
            disabled={!isDirty}
            title="Spara (Ctrl+S)"
            className={`px-4 py-2 text-sm rounded-md border ${
              isDirty
                ? 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700'
                : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Spara
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
          >
            Förhandsgranska
          </button>
          <div className="relative">
            <button
              onClick={() => setShowExport((prev) => !prev)}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Exportera &#9662;
            </button>
            {showExport && <ExportDropdown onClose={() => setShowExport(false)} />}
          </div>
        </div>
      </header>

      {/* Tre-kolumns editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Blockpalett */}
        <aside className="w-56 bg-white border-r border-gray-200 p-4 overflow-y-auto shrink-0">
          <BlockPalette />
        </aside>

        {/* Canvas */}
        <main className="flex-1 bg-gray-100 p-6 overflow-y-auto">
          <Canvas />
        </main>

        {/* Egenskapspanel */}
        <aside className="w-72 bg-white border-l border-gray-200 p-4 overflow-y-auto shrink-0">
          <PropertyPanel />
        </aside>
      </div>

      {/* Preview modal */}
      {showPreview && <PreviewPanel onClose={() => setShowPreview(false)} />}

      {/* Spara som mall modal */}
      {showSaveTemplate && (
        <SaveTemplateModal
          newsletterId={current.id}
          channel={current.channel}
          defaultName={`Mall - ${current.title}`}
          onClose={() => setShowSaveTemplate(false)}
        />
      )}
    </div>
  );
}

// === Spara som mall ===

function SaveTemplateModal({
  newsletterId,
  channel,
  defaultName,
  onClose,
}: {
  newsletterId: string;
  channel: 'proffs' | 'konsument';
  defaultName: string;
  onClose: () => void;
}) {
  const { newsletter, isDirty, markClean } = useEditorStore();
  const [name, setName] = useState(defaultName);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      // Spara nyhetsbrevet först om det finns osparade ändringar
      if (newsletter && isDirty) {
        await api.newsletters.update(newsletter.id, {
          title: newsletter.title,
          blocks: newsletter.blocks,
          settings: newsletter.settings,
          status: newsletter.status,
        });
        markClean();
      }
      await api.templates.create({
        name: name.trim(),
        channel,
        from_newsletter_id: newsletterId,
      });
      setResult({ type: 'success', message: 'Mall sparad!' });
      setTimeout(onClose, 1200);
    } catch (err) {
      setResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'Kunde inte spara mall',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-[420px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Spara som mall</h2>
        <p className="text-xs text-gray-500 mb-4">
          Sparar nuvarande block och inställningar som en återanvändbar mall för kanalen{' '}
          <strong>{CHANNEL_CONFIG[channel].label}</strong>.
        </p>

        <label className="block text-sm font-medium text-gray-700 mb-1">Mallnamn</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 mb-4"
          autoFocus
        />

        {result && (
          <div
            className={`text-sm mb-3 ${
              result.type === 'success' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {result.message}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
          >
            Avbryt
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className={`px-4 py-2 text-sm rounded-md font-medium ${
              name.trim() && !saving
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saving ? 'Sparar...' : 'Spara mall'}
          </button>
        </div>
      </div>
    </div>
  );
}

// === Sparindikator ===

function SaveIndicator({
  isDirty,
  saveState,
}: {
  isDirty: boolean;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
}) {
  if (saveState === 'saving') {
    return <span className="text-xs text-gray-400 ml-2">Sparar…</span>;
  }
  if (saveState === 'error') {
    return (
      <span className="text-xs text-red-500 ml-2" title="Försök spara igen med Ctrl+S">
        Kunde inte spara
      </span>
    );
  }
  if (isDirty) {
    return <span className="text-xs text-amber-500 ml-2">(osparade ändringar)</span>;
  }
  if (saveState === 'saved') {
    return <span className="text-xs text-green-600 ml-2">Sparad ✓</span>;
  }
  return null;
}

// === Statusväljare ===

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
  ready: 'bg-blue-100 text-blue-700 border-blue-200',
  sent: 'bg-green-100 text-green-700 border-green-200',
};

function StatusSelect({
  value,
  onChange,
}: {
  value: 'draft' | 'ready' | 'sent';
  onChange: (status: 'draft' | 'ready' | 'sent') => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as 'draft' | 'ready' | 'sent')}
      title="Ändra status för nyhetsbrevet"
      className={`px-2 py-0.5 rounded text-xs font-medium border cursor-pointer focus:outline-none ${
        STATUS_STYLE[value] || STATUS_STYLE.draft
      }`}
    >
      <option value="draft">Utkast</option>
      <option value="ready">Klar</option>
      <option value="sent">Skickad</option>
    </select>
  );
}
