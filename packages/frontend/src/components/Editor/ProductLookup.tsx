import { useState } from 'react';
import type { ProductContent } from '@byggnytt/shared';
import { api } from '../../utils/api';
import { useEditorStore } from '../../stores/editorStore';

interface ProductLookupProps {
  onResult: (product: ProductContent) => void;
  currentSku?: string;
}

export function ProductLookup({ onResult, currentSku }: ProductLookupProps) {
  const channel = useEditorStore((s) => s.newsletter?.channel);
  const [sku, setSku] = useState(currentSku || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    const trimmed = sku.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    try {
      const product = await api.productLookup.bySku(trimmed, channel);
      onResult(product);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Uppslag misslyckades');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLookup();
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        <input
          type="text"
          value={sku}
          onChange={(e) => {
            setSku(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          className="input-field flex-1"
          placeholder="Artikelnummer..."
        />
        <button
          type="button"
          onClick={handleLookup}
          disabled={loading || !sku.trim()}
          className="px-2.5 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {loading ? '...' : 'Hämta'}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
