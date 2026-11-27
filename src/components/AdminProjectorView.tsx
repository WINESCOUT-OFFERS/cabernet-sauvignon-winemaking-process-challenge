import { QRCodeSVG } from 'qrcode.react';
import { Crown, LogOut, RotateCcw, Trophy, Users, Zap } from 'lucide-react';
import { QUIZ_SCENARIO, QUIZ_TITLE } from '../data/quizQuestions';
import {
  formatProgress,
  sortByJoinOrder,
  type LeaderboardEntry,
} from '../utils/quizLogic';

interface AdminProjectorViewProps {
  entries: LeaderboardEntry[];
  totalQuestions: number;
  isLoading: boolean;
  onOpenReset: () => void;
  onLogout: () => void;
}

export function AdminProjectorView({
  entries,
  totalQuestions,
  isLoading,
  onOpenReset,
  onLogout,
}: AdminProjectorViewProps) {
  const quizUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : '';
  const joinedOrdered = sortByJoinOrder(entries);

  return (
    <div className="min-h-screen bg-[#f7f1e6] text-[#1a1a1a] flex flex-col justify-between">
      <div className="w-full max-w-7xl mx-auto px-6 py-6 sm:px-10 lg:py-8 flex-1 flex flex-col">
        <header className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 pb-6 border-b border-[#dfd3be]">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-wide text-[#0b4f36] mb-1.5">
              Admin Projector View
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight text-[#8c1f3d] [text-wrap:balance]">
              {QUIZ_TITLE}
            </h1>
            <h2 className="mt-2 text-base sm:text-lg font-semibold leading-relaxed text-[#0b4f36]">
              {QUIZ_SCENARIO}
            </h2>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start">
            <button
              type="button"
              onClick={onOpenReset}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#8c1f3d] bg-white hover:bg-[#8c1f3d] text-[#8c1f3d] hover:text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              Reset Leaderboard
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a1a1a] hover:bg-black text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              Log Out
            </button>
          </div>
        </header>

        <div className="mt-7 grid grid-cols-1 lg:grid-cols-12 gap-7 items-start flex-1">
          <aside className="lg:col-span-4 space-y-6">
            <section
              aria-label="Join QR Code"
              className="rounded-2xl bg-white border border-[#dfd3be] p-6 flex flex-col items-center text-center"
            >
              <h2 className="font-serif text-xl font-bold text-[#0b4f36]">
                Join This Challenge
              </h2>
              <div className="mt-4 p-4 rounded-xl bg-white border border-stone-200">
                <QRCodeSVG
                  value={quizUrl || 'https://example.com'}
                  size={200}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#1a1a1a"
                />
              </div>
              <p className="mt-4 text-base font-bold text-[#1a1a1a]">
                Scan to Join: Cabernet Sauvignon Challenge
              </p>
              <p
                data-testid="projector-quiz-url"
                className="mt-1.5 text-xs font-mono text-[#1a1a1a]/75 break-all select-all"
              >
                {quizUrl}
              </p>
            </section>

            <section
              aria-label="Live Joined Players"
              className="rounded-2xl bg-white/80 border border-[#dfd3be] p-5"
            >
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#e5dac6]">
                <h2 className="font-serif text-xl font-bold text-[#0b4f36] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#8c1f3d]" aria-hidden="true" />
                  <span>Joined Players ({joinedOrdered.length})</span>
                </h2>
              </div>

              {joinedOrdered.length === 0 ? (
                <p className="mt-4 text-sm text-[#1a1a1a]/70">
                  Waiting for students to scan the QR code and enter a nickname...
                </p>
              ) : (
                <ul
                  data-testid="projector-joined-list"
                  className="mt-4 flex flex-wrap gap-2 max-h-60 overflow-y-auto"
                >
                  {joinedOrdered.map((entry) => (
                    <li key={entry.id}>
                      <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-[#f7f1e6] border border-[#0b4f36] text-[#1a1a1a] text-sm font-semibold whitespace-nowrap">
                        {entry.nickname}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </aside>

          <main className="lg:col-span-8">
            <section
              aria-label="Projector Live Leaderboard"
              className="rounded-2xl bg-white border border-[#dfd3be] p-6 sm:p-8"
            >
              <div className="flex items-center justify-between gap-4 pb-5 border-b border-[#e5dac6]">
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#0b4f36]">
                    Live Leaderboard
                  </h2>
                  <p className="mt-1 text-sm text-[#1a1a1a]/70 tabular-nums">
                    {entries.length === 1 ? '1 participant' : `${entries.length} participants`}
                    {' · '}
                    Sorted by score and completion time
                  </p>
                </div>
                <Trophy className="w-7 h-7 text-[#8c1f3d] shrink-0" aria-hidden="true" />
              </div>

              <div className="mt-6">
                {isLoading ? (
                  <div className="py-12 text-center text-base text-[#1a1a1a]/70">
                    Loading live standings...
                  </div>
                ) : entries.length === 0 ? (
                  <div className="py-14 px-6 text-center rounded-xl border border-dashed border-[#d7c8af] bg-[#f7f1e6]/50">
                    <p className="text-lg font-semibold text-[#1a1a1a]">No participants yet</p>
                    <p className="mt-1.5 text-sm text-[#1a1a1a]/70">
                      Students will appear here live as soon as they join the challenge.
                    </p>
                  </div>
                ) : (
                  <ol className="space-y-3" data-testid="projector-leaderboard-list">
                    {entries.map((entry, index) => {
                      const rank = index + 1;
                      const isFirst = index === 0;
                      const isLast = entries.length > 1 && index === entries.length - 1;
                      const progressText = formatProgress(entry, totalQuestions);

                      return (
                        <li
                          key={entry.id}
                          className={`rounded-xl px-5 py-4 flex items-center justify-between gap-4 ${
                            isFirst
                              ? 'bg-[#f7f1e6] border-2 border-[#d6b36a]'
                              : 'bg-[#f7f1e6]/55 border border-[#e3d7c3]'
                          }`}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            {isFirst ? (
                              <span
                                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 border border-amber-400 text-amber-800 shrink-0"
                                title="1st Place"
                              >
                                <Crown className="w-5 h-5" aria-hidden="true" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-[#dfd3be] text-[#1a1a1a] text-base font-mono font-bold tabular-nums shrink-0">
                                #{rank}
                              </span>
                            )}

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2.5">
                                <span className="text-lg sm:text-xl font-bold text-[#1a1a1a] truncate">
                                  {entry.nickname}
                                </span>
                                {isFirst && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold whitespace-nowrap">
                                    <Crown className="w-3.5 h-3.5" aria-hidden="true" />
                                    1st Place
                                  </span>
                                )}
                                {isLast && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-stone-200 text-[#1a1a1a] border border-stone-300 text-xs font-medium whitespace-nowrap">
                                    Last Place
                                  </span>
                                )}
                                {entry.got_speed_bonus && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#0b4f36] text-white text-xs font-semibold whitespace-nowrap">
                                    <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                                    +3 First Finisher
                                  </span>
                                )}
                              </div>

                              <div className="mt-1 text-sm font-mono tabular-nums font-medium text-[#1a1a1a]/75">
                                Progress: {progressText}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-mono text-2xl sm:text-3xl font-bold text-[#8c1f3d] tabular-nums leading-none">
                              {entry.score}
                            </div>
                            <div className="mt-1 text-xs font-medium text-[#1a1a1a]/70">
                              {entry.score === 1 ? 'point' : 'points'}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
