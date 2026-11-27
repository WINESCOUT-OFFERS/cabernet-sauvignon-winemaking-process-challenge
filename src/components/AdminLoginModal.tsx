import { useState, type FormEvent } from 'react';
import { Lock, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { formatAdminEmail } from '../utils/quizLogic';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminLoginModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminLoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    setUsername('');
    setPassword('');
    setError(null);
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const email = formatAdminEmail(username);
    if (!email || !password) {
      setError('Invalid admin username or password');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !data.session) {
        setError('Invalid admin username or password');
        return;
      }

      setUsername('');
      setPassword('');
      onSuccess();
    } catch {
      setError('Invalid admin username or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-login-modal-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white text-[#1a1a1a] border border-stone-200 shadow-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-[#8c1f3d] shrink-0" aria-hidden="true" />
            <h3
              id="admin-login-modal-title"
              className="font-serif text-xl font-bold text-[#0b4f36]"
            >
              Admin Login
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close admin login dialog"
            className="p-1 rounded-lg text-stone-500 hover:text-[#1a1a1a] hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-2 text-sm text-[#1a1a1a]/75">
          Sign in to open the Admin Projector View and manage the live session.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          <div>
            <label htmlFor="admin-username-input" className="block text-sm font-semibold mb-1.5">
              Admin Username
            </label>
            <input
              id="admin-username-input"
              name="username"
              type="text"
              autoComplete="username"
              autoFocus
              disabled={isSubmitting}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter username or email"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#8c1f3d] focus:border-[#8c1f3d]"
            />
          </div>

          <div>
            <label htmlFor="admin-password-input" className="block text-sm font-semibold mb-1.5">
              Admin Password
            </label>
            <input
              id="admin-password-input"
              name="password"
              type="password"
              autoComplete="current-password"
              disabled={isSubmitting}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#8c1f3d] focus:border-[#8c1f3d]"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleClose}
              className="px-4 py-2 rounded-xl border border-stone-300 text-sm font-medium text-[#1a1a1a] hover:bg-stone-50 cursor-pointer whitespace-nowrap disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-[#8c1f3d] hover:bg-[#741832] disabled:opacity-60 text-white text-sm font-semibold cursor-pointer whitespace-nowrap"
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
