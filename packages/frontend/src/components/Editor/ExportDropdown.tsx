import { useState, useEffect, useRef } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import { api } from '../../utils/api';

interface ExportDropdownProps {
  onClose: () => void;
}

export function ExportDropdown({ onClose }: ExportDropdownProps) {
  const { newsletter, isDirty, markClean } = useEditorStore();
  const [status, setStatus] = useState<{
    type: 'info' | 'success' | 'error';
    message: string;
  } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const saveIfNeeded = async () => {
    if (!newsletter || !isDirty) return;
    await api.newsletters.update(newsletter.id, {
      title: newsletter.title,
      blocks: newsletter.blocks,
      settings: newsletter.settings,
      status: newsletter.status,
    });
    markClean();
  };

  const handlePdf = async () => {
    if (!newsletter) return;
    try {
      setStatus({ type: 'info', message: 'Sparar och genererar PDF...' });
      await saveIfNeeded();
      const blob = await api.export.pdf(newsletter.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${newsletter.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus({ type: 'success', message: 'PDF nedladdad!' });
      setTimeout(onClose, 1500);
    } catch (err) {
      setStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'PDF-generering misslyckades',
      });
    }
  };

  const handleCopyMjml = async () => {
    if (!newsletter) return;
    try {
      setStatus({ type: 'info', message: 'Genererar mail-HTML...' });
      const res = await api.render.mjml(newsletter.blocks, newsletter.settings);
      await navigator.clipboard.writeText(res.html);
      setStatus({ type: 'success', message: 'Mail-HTML kopierad till urklipp!' });
      setTimeout(onClose, 1500);
    } catch {
      setStatus({ type: 'error', message: 'Kunde inte kopiera mail-HTML' });
    }
  };

  const handleCopyPublicLink = async () => {
    if (!newsletter) return;
    try {
      if (isDirty) {
        setStatus({ type: 'info', message: 'Sparar forst...' });
        await saveIfNeeded();
      }
      const url = `${window.location.origin}${api.export.publicUrl(newsletter.id)}`;
      await navigator.clipboard.writeText(url);
      setStatus({ type: 'success', message: 'Publik lank kopierad!' });
      setTimeout(onClose, 1500);
    } catch {
      setStatus({ type: 'error', message: 'Kunde inte kopiera lank' });
    }
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-60 z-50"
    >
      <DropdownItem
        label="Ladda ner PDF"
        description="Genererar A4-dokument"
        onClick={handlePdf}
      />
      <DropdownItem
        label="Kopiera mail-HTML"
        description="For inklistring i mailverktyg"
        onClick={handleCopyMjml}
      />
      <DropdownItem
        label="Kopiera publik lank"
        description="Webbversion av nyhetsbrevet"
        onClick={handleCopyPublicLink}
      />
      {status && (
        <div
          className={`px-4 py-2 text-xs border-t border-gray-100 ${
            status.type === 'success'
              ? 'text-green-600'
              : status.type === 'error'
                ? 'text-red-600'
                : 'text-gray-500'
          }`}
        >
          {status.type === 'info' && (
            <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1 align-middle" />
          )}
          {status.message}
        </div>
      )}
    </div>
  );
}

function DropdownItem({
  label,
  description,
  onClick,
}: {
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
    >
      <div className="text-sm text-gray-700">{label}</div>
      <div className="text-xs text-gray-400">{description}</div>
    </button>
  );
}
