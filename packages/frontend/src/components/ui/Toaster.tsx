import { useUiStore } from '../../stores/uiStore';
import type { Toast } from '../../stores/uiStore';

const TOAST_STYLE: Record<Toast['type'], string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-gray-800 text-white',
};

const TOAST_ICON: Record<Toast['type'], string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

/**
 * Global notis-yta. Monteras en gång i App och visar meddelanden
 * från useUiStore.addToast().
 */
export function Toaster() {
  const { toasts, removeToast } = useUiStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-[100] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          className={`pointer-events-auto w-full sm:w-auto sm:max-w-sm flex items-start gap-2 px-4 py-3 rounded-lg shadow-lg text-sm text-left ${TOAST_STYLE[toast.type]}`}
          title="Klicka för att stänga"
        >
          <span className="font-bold shrink-0">{TOAST_ICON[toast.type]}</span>
          <span>{toast.message}</span>
        </button>
      ))}
    </div>
  );
}
