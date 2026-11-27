import { useState, type FormEvent } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ResetModalProps {
  isOpen: boolean;
  isResetting: boolean;
  onClose: () => void;
  onConfirmReset: () => Promise<void>;
}

export function ResetModal({
  isOpen,
  isResetting,
  onClose,
  onConfirmReset,
}: ResetModalProps) {
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await onConfirmReset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset leaderboard.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-modal-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white text-[#1a1a1a] border border-stone-200 shadow-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#8c1f3d] shrink-0" aria-hidden="true" />
            <h3 id="reset-modal-title" className="font-serif text-xl font-bold text-[#0b4f36]">
              Reset Leaderboard
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close reset confirmation dialog"
            className="p-1 rounded-lg text-stone-500 hover:text-[#1a1a1a] hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-3 text-sm text-[#1a1a1a]/80">
          Are you sure you want to clear all scores?
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <p role="alert" className="text-xs font-medium text-red-700">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl border border-stone-300 text-sm font-medium text-[#1a1a1a] hover:bg-stone-50 cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isResetting}
              className="px-4 py-2 rounded-xl bg-[#8c1f3d] hover:bg-[#741832] disabled:opacity-60 text-white text-sm font-semibold cursor-pointer whitespace-nowrap"
            >
              {isResetting ? 'Clearing...' : 'Confirm Reset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
