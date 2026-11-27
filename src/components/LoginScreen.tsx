import { useState, type FormEvent } from 'react';
import { ArrowRight, Lock, Wine } from 'lucide-react';
import { QUIZ_SCENARIO, QUIZ_TITLE } from '../data/quizQuestions';
import { validateNickname, type LeaderboardEntry } from '../utils/quizLogic';
import { JoinedParticipants } from './JoinedParticipants';

interface LoginScreenProps {
  entries: LeaderboardEntry[];
  isJoining: boolean;
  joinError: string | null;
  onJoin: (nickname: string) => Promise<void>;
  onOpenAdminLogin: () => void;
}

export function LoginScreen({
  entries,
  isJoining,
  joinError,
  onJoin,
  onOpenAdminLogin,
}: LoginScreenProps) {
  const [nickname, setNickname] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const check = validateNickname(nickname);
    if (!check.valid) {
      setValidationError(check.error || 'Please enter a valid nickname.');
      return;
    }
    setValidationError(null);
    await onJoin(check.trimmed);
  };

  const activeError = validationError || joinError;

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] flex flex-col justify-between relative">
      <header className="w-full px-6 pt-5 pb-2 flex justify-end">
        <div className="max-w-lg w-full flex justify-end">
          <JoinedParticipants entries={entries} alignRight />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-8 lg:py-12">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-7">
            <p className="text-xs font-medium tracking-wide text-[#1a1a1a]/65 mb-3">
              French Cabernet Sauvignon AOC Label Winemaking Challenge · 15 Questions
            </p>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-bold leading-[1.12] tracking-tight text-[#8c1f3d] [text-wrap:balance]">
              {QUIZ_TITLE}
            </h1>

            <h2 className="mt-5 text-base sm:text-lg font-semibold leading-relaxed text-[#0b4f36]">
              {QUIZ_SCENARIO}
            </h2>

            <form onSubmit={handleSubmit} className="mt-8 max-w-md space-y-4" noValidate>
              <div>
                <label
                  htmlFor="nickname-input"
                  className="block text-sm font-semibold text-[#1a1a1a] mb-2"
                >
                  Nickname
                </label>
                <input
                  id="nickname-input"
                  name="nickname"
                  type="text"
                  autoComplete="nickname"
                  maxLength={32}
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="Enter your name or team"
                  className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-white text-[#1a1a1a] placeholder:text-stone-400 text-base focus:outline-none focus:ring-2 focus:ring-[#8c1f3d] focus:border-[#8c1f3d] transition-colors"
                />
                {activeError && (
                  <p role="alert" className="mt-2 text-sm font-medium text-red-700">
                    {activeError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isJoining}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#8c1f3d] hover:bg-[#741832] disabled:opacity-60 text-white font-semibold text-base transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8c1f3d]"
              >
                <span>{isJoining ? 'Joining...' : 'Start Challenge'}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>

            <div className="mt-7 pt-5 border-t border-stone-200 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#1a1a1a]/75">
              <span>+1 pt per correct answer</span>
              <span aria-hidden="true">·</span>
              <span>+3 Speed Bonus for 1st Finisher</span>
              <span aria-hidden="true">·</span>
              <span>Live multiplayer leaderboard</span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden border border-stone-200 bg-[#f7f1e6] aspect-[4/3]">
              {!imageFailed ? (
                <img
                  src="/src/assets/images/bordeaux_cabernet_cellar_1795789112736.jpg"
                  alt="French oak wine barrels aging Cabernet Sauvignon in a limestone Bordeaux cellar"
                  referrerPolicy="no-referrer"
                  onError={() => setImageFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#f7f1e6] to-[#eadfce]">
                  <Wine className="w-10 h-10 text-[#8c1f3d] mb-3" aria-hidden="true" />
                  <p className="font-serif text-lg font-semibold text-[#8c1f3d]">
                    Bordeaux AOC Cellar
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="px-6 py-4 flex items-center justify-end">
        <button
          type="button"
          onClick={onOpenAdminLogin}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#1a1a1a]/65 hover:text-[#8c1f3d] hover:bg-stone-100 transition-colors cursor-pointer whitespace-nowrap"
        >
          <Lock className="w-3.5 h-3.5" aria-hidden="true" />
          Admin Login
        </button>
      </footer>
    </div>
  );
}
