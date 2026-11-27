import { Award, Crown, RotateCcw, Zap } from 'lucide-react';
import { QUIZ_SCENARIO, QUIZ_TITLE } from '../data/quizQuestions';
import type { LeaderboardEntry } from '../utils/quizLogic';

interface CompletionSummaryProps {
  player: LeaderboardEntry;
  rank: number | null;
  totalPlayers: number;
  correctCount: number;
  totalQuestions: number;
  onStartNewSession: () => void;
}

export function CompletionSummary({
  player,
  rank,
  totalPlayers,
  correctCount,
  totalQuestions,
  onStartNewSession,
}: CompletionSummaryProps) {
  return (
    <main className="w-full lg:w-[70%] bg-white text-[#1a1a1a] px-6 py-8 sm:px-10 lg:px-12 lg:py-10 flex flex-col justify-center">
      <div className="max-w-2xl w-full mx-auto">
        <header className="pb-6 border-b border-stone-200">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold leading-tight text-[#8c1f3d] [text-wrap:balance]">
            {QUIZ_TITLE}
          </h1>
          <h2 className="mt-2.5 text-base font-semibold leading-relaxed text-[#0b4f36]">
            {QUIZ_SCENARIO}
          </h2>
        </header>

        <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3">
            {rank === 1 ? (
              <Crown className="w-7 h-7 text-amber-600 shrink-0" aria-hidden="true" />
            ) : (
              <Award className="w-7 h-7 text-[#0b4f36] shrink-0" aria-hidden="true" />
            )}
            <h3 className="font-serif text-2xl font-bold text-[#0b4f36]">
              Challenge Completed
            </h3>
          </div>

          <p className="mt-3 text-base text-[#1a1a1a]">
            Well done, <strong>{player.nickname}</strong>. Your final Bordeaux AOC Cabernet
            Sauvignon winemaking score has been recorded on the live leaderboard.
          </p>

          {player.got_speed_bonus && (
            <div className="mt-5 flex items-center gap-2.5 px-4 py-3 rounded-xl border border-[#0b4f36]/25 bg-[#0b4f36]/[0.06] text-[#0b4f36] text-sm font-semibold">
              <Zap className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>+3 First Finisher Speed Bonus Earned</span>
            </div>
          )}

          <dl className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-stone-200">
            <div>
              <dt className="text-xs font-medium text-[#1a1a1a]/70">Final Score</dt>
              <dd className="mt-1 font-mono text-2xl font-bold text-[#8c1f3d] tabular-nums">
                {player.score} pts
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#1a1a1a]/70">Correct Answers</dt>
              <dd className="mt-1 font-mono text-2xl font-bold text-[#1a1a1a] tabular-nums">
                {correctCount}/{totalQuestions}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-[#1a1a1a]/70">Current Rank</dt>
              <dd className="mt-1 font-mono text-2xl font-bold text-[#0b4f36] tabular-nums">
                {rank ? `#${rank} of ${totalPlayers}` : 'Ranked'}
              </dd>
            </div>
          </dl>

          <div className="mt-8">
            <button
              type="button"
              onClick={onStartNewSession}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-stone-300 hover:border-[#8c1f3d] text-[#1a1a1a] hover:text-[#8c1f3d] font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              Join as New Student
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
