import { useState, useEffect, useCallback } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { api } from '../../utils/api';

interface PreviewPanelProps {
  onClose: () => void;
}

export function PreviewPanel({ onClose }: PreviewPanelProps) {
  const { newsletter } = useEditorStore();
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewWidth, setViewWidth] = useState<'desktop' | 'mobile'>('desktop');
  const [renderMode, setRenderMode] = useState<'web' | 'mail'>('web');

  const fetchPreview = useCallback(async () => {
    if (!newsletter) return;
    setLoading(true);
    setError(null);
    try {
      const renderFn = renderMode === 'web' ? api.render.preview : api.render.mjml;
      const res = await renderFn(newsletter.blocks, newsletter.settings, newsletter.channel);
      setHtml(res.html);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rendering misslyckades');
    } finally {
      setLoading(false);
    }
  }, [newsletter, renderMode]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const iframeWidth = viewWidth === 'desktop' ? 600 : 375;

  const openInNewWindow = () => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-[95vw] sm:w-[90vw] max-w-[900px] h-[90dvh] sm:h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 shrink-0">
          <h2 className="text-sm font-semibold text-gray-800">Förhandsgranskning</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Render mode toggle */}
            <ToggleGroup
              options={[
                { value: 'web', label: 'Webb' },
                { value: 'mail', label: 'Mail' },
              ]}
              value={renderMode}
              onChange={(v) => setRenderMode(v as 'web' | 'mail')}
            />

            {/* Width toggle */}
            <ToggleGroup
              options={[
                { value: 'desktop', label: 'Desktop' },
                { value: 'mobile', label: 'Mobil' },
              ]}
              value={viewWidth}
              onChange={(v) => setViewWidth(v as 'desktop' | 'mobile')}
            />

            <button
              onClick={fetchPreview}
              className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md border border-gray-200"
              title="Uppdatera förhandsgranskning"
            >
              Uppdatera
            </button>
            <button
              onClick={openInNewWindow}
              className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md border border-gray-200"
            >
              Nytt fönster
            </button>
            <button
              onClick={onClose}
              className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-md"
              title="Stäng"
            >
              &#10005;
            </button>
          </div>
        </div>

        {/* Preview body */}
        <div className="flex-1 overflow-auto bg-gray-100 flex justify-center p-3 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-sm text-gray-500">Renderar...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-500 text-sm mb-2">{error}</p>
                <button
                  onClick={fetchPreview}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Försök igen
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full sm:w-auto">
              <div className="text-xs text-gray-400 mb-2">
                {iframeWidth}px
                {renderMode === 'mail' && ' (mailkompatibel HTML)'}
              </div>
              <iframe
                srcDoc={html}
                style={{ width: `${iframeWidth}px`, maxWidth: '100%', minHeight: '500px' }}
                className="bg-white shadow-lg border-0 flex-1 rounded"
                title="Förhandsgranskning"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex border border-gray-200 rounded-md overflow-hidden text-xs">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 transition-colors ${
            value === opt.value
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
