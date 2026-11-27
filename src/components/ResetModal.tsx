import { useState, type FormEvent } from 'react';
import { Lock, X } from 'lucide-react';
import { verifyInstructorPin } from '../utils/quizLogic';

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
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setPin('');
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!verifyInstructorPin(pin)) {
      setError('Incorrect PIN. Enter instructor PIN 1234 to reset.');
      return;
    }
    setError(null);
    try {
      await onConfirmReset();
      setPin('');
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
            <Lock className="w-5 h-5 text-[#8c1f3d] shrink-0" aria-hidden="true" />
            <h3 id="reset-modal-title" className="font-serif text-xl font-bold text-[#0b4f36]">
              Reset Leaderboard
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close reset dialog"
            className="p-1 rounded-lg text-stone-500 hover:text-[#1a1a1a] hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-2 text-sm text-[#1a1a1a]/75">
          Enter the instructor PIN to clear all student scores from the leaderboard.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="instructor-pin-input" className="block text-sm font-semibold mb-1.5">
              Instructor PIN
            </label>
            <input
              id="instructor-pin-input"
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter 4-digit PIN"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-[#1a1a1a] font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#8c1f3d] focus:border-[#8c1f3d]"
            />
            {error && (
              <p role="alert" className="mt-2 text-xs font-medium text-red-700">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
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
