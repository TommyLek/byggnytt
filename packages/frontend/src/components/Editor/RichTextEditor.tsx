import { useRef, useCallback, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Skriv text...',
  minHeight = '80px',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const internalValue = useRef(value);

  // Set content on mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value changes (not from our own edits)
  useEffect(() => {
    if (
      editorRef.current &&
      value !== internalValue.current &&
      document.activeElement !== editorRef.current
    ) {
      editorRef.current.innerHTML = value || '';
      internalValue.current = value;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      internalValue.current = html;
      onChange(html);
    }
  }, [onChange]);

  const execCmd = (command: string, val?: string) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    handleInput();
  };

  const handleLink = () => {
    const url = prompt('Ange URL:');
    if (url) {
      execCmd('createLink', url);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        execCmd('bold');
      }
      if (e.key === 'i') {
        e.preventDefault();
        execCmd('italic');
      }
    }
  };

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden focus-within:border-blue-500 focus-within:shadow-[0_0_0_2px_rgba(59,130,246,0.1)]">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-1.5 py-1 bg-gray-50 border-b border-gray-200">
        <ToolbarBtn onClick={() => execCmd('bold')} title="Fetstil (Ctrl+B)">
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn onClick={() => execCmd('italic')} title="Kursiv (Ctrl+I)">
          <em className="font-serif">I</em>
        </ToolbarBtn>
        <ToolbarBtn onClick={handleLink} title="Infoga länk">
          <span className="text-xs">&#128279;</span>
        </ToolbarBtn>
        <div className="w-px h-4 bg-gray-300 mx-0.5" />
        <ToolbarBtn onClick={() => execCmd('removeFormat')} title="Rensa formatering">
          <span className="text-xs text-gray-400">T</span>
        </ToolbarBtn>
      </div>
      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="rich-text-editor px-2 py-1.5 text-[13px] text-gray-700 leading-relaxed outline-none"
        style={{ minHeight }}
        data-placeholder={placeholder}
      />
    </div>
  );
}

function ToolbarBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded text-sm text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
    >
      {children}
    </button>
  );
}
