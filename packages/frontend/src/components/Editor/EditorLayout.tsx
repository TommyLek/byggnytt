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
  const { setNewsletter, newsletter: current, isDirty, markClean } = useEditorStore();
  const [showPreview, setShowPreview] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  useAutosave();

  useEffect(() => {
    setNewsletter(newsletter);
  }, [newsletter, setNewsletter]);

  const handleSave = useCallback(async () => {
    if (!current || !isDirty) return;
    try {
      await api.newsletters.update(current.id, {
        title: current.title,
        blocks: current.blocks,
        settings: current.settings,
        status: current.status,
      });
      markClean();
    } catch (err) {
      console.error('Spara misslyckades:', err);
    }
  }, [current, isDirty, markClean]);

  if (!current) return null;

  const channelLabel = CHANNEL_CONFIG[current.channel].label;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            &larr; Tillbaka
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {current.title}
              {isDirty && <span className="text-xs text-amber-500 ml-2">(osparad)</span>}
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
              <StatusBadge status={current.status} />
              <span className="text-xs text-gray-400">
                {current.blocks.length} block
              </span>
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
            Forhandsgranska
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
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      // Spara nyhetsbrevet forst om det finns osparade andringar
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
          Sparar nuvarande block och installningar som en ateranvandbar mall for kanalen{' '}
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

// === StatusBadge ===

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    draft: { label: 'Utkast', className: 'bg-gray-100 text-gray-600' },
    ready: { label: 'Klar', className: 'bg-blue-100 text-blue-700' },
    sent: { label: 'Skickad', className: 'bg-green-100 text-green-700' },
  };

  const c = config[status] || { label: status, className: 'bg-gray-100 text-gray-600' };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.className}`}>
      {c.label}
    </span>
  );
}
