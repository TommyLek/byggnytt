import { useState, useRef, useCallback } from 'react';
import { api } from '../../utils/api';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  height?: string;
}

export function ImageUploader({ value, onChange, height = 'h-32' }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('Endast bildfiler');
        return;
      }
      setUploading(true);
      setError(null);
      try {
        const result = await api.images.upload(file);
        onChange(result.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Uppladdning misslyckades');
      } finally {
        setUploading(false);
      }
    },
    [onChange],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  if (value) {
    return (
      <div className="relative group/upload">
        <img
          src={value}
          alt=""
          className={`w-full ${height} object-cover rounded border border-gray-200`}
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="px-2 py-1 bg-white text-gray-800 text-xs rounded hover:bg-gray-100"
          >
            Byt bild
          </button>
          <button
            type="button"
            onClick={() => onChange('')}
            className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
          >
            Ta bort
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        className={`${height} border-2 border-dashed rounded-md cursor-pointer flex flex-col items-center justify-center transition-colors ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-1" />
            <span className="text-xs text-gray-500">Laddar upp...</span>
          </div>
        ) : (
          <>
            <span className="text-2xl text-gray-400 mb-1">+</span>
            <span className="text-xs text-gray-400">Klicka eller dra bild hit</span>
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
