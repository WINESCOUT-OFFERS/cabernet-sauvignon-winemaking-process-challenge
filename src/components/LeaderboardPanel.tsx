import { Crown, RotateCcw, Trophy, Zap } from 'lucide-react';
import { formatProgress, type LeaderboardEntry } from '../utils/quizLogic';
import { JoinedParticipants } from './JoinedParticipants';

interface LeaderboardPanelProps {
  entries: LeaderboardEntry[];
  currentPlayerId: string | null;
  totalQuestions: number;
  isLoading: boolean;
  onOpenReset: () => void;
}

export function LeaderboardPanel({
  entries,
  currentPlayerId,
  totalQuestions,
  isLoading,
  onOpenReset,
}: LeaderboardPanelProps) {
  return (
    <aside
      aria-label="Live Leaderboard"
      className="w-full lg:w-[30%] bg-[#f7f1e6] text-[#1a1a1a] border-t lg:border-t-0 lg:border-l border-[#e3d7c3] flex flex-col justify-between min-h-[360px] lg:min-h-screen"
    >
      <div className="p-6 lg:p-7 flex-1 flex flex-col">
        <div className="hidden lg:block pb-5 mb-5 border-b border-[#dfd3be]">
          <JoinedParticipants entries={entries} currentPlayerId={currentPlayerId} />
        </div>

        <div className="flex items-baseline justify-between gap-4 pb-4 border-b border-[#dfd3be]">
          <div>
            <h2 className="font-serif text-2xl font-bold text-[#0b4f36] tracking-tight">
              Live Leaderboard
            </h2>
            <p className="mt-1 text-xs text-[#1a1a1a]/70 tabular-nums">
              {entries.length === 1 ? '1 participant' : `${entries.length} participants`}
              {' · '}
              Real-time rankings
            </p>
          </div>
          <Trophy className="w-5 h-5 text-[#8c1f3d] shrink-0" aria-hidden="true" />
        </div>

        <div className="mt-5 flex-1">
          {isLoading ? (
            <div className="py-10 text-center text-sm text-[#1a1a1a]/70">
              Loading standings...
            </div>
          ) : entries.length === 0 ? (
            <div className="py-10 px-4 text-center border border-dashed border-[#d7c8af] rounded-xl bg-white/40">
              <p className="text-sm font-medium text-[#1a1a1a]">No participants yet</p>
              <p className="mt-1 text-xs text-[#1a1a1a]/70">
                Standings appear here the moment a student joins.
              </p>
            </div>
          ) : (
            <ol className="space-y-2.5" data-testid="leaderboard-list">
              {entries.map((entry, index) => {
                const rank = index + 1;
                const isFirst = index === 0;
                const isLast = entries.length > 1 && index === entries.length - 1;
                const isCurrentPlayer = entry.id === currentPlayerId;
                const progressText = formatProgress(entry, totalQuestions);

                return (
                  <li
                    key={entry.id}
                    data-testid={`leaderboard-row-${rank}`}
                    className={`rounded-xl px-3.5 py-3 transition-colors ${
                      isCurrentPlayer
                        ? 'bg-white border-2 border-[#8c1f3d] shadow-xs'
                        : isFirst
                          ? 'bg-white/85 border border-[#d6b36a]'
                          : 'bg-white/55 border border-[#e3d7c3]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="pt-0.5 shrink-0 flex items-center gap-1">
                          {isFirst ? (
                            <span
                              className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 border border-amber-400 text-amber-800"
                              title="1st Place"
                            >
                              <Crown className="w-4 h-4" aria-hidden="true" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#efe5d4] text-[#1a1a1a] text-xs font-mono font-semibold tabular-nums">
                              #{rank}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-sm text-[#1a1a1a] truncate max-w-[140px]">
                              {entry.nickname}
                            </span>
                            {isCurrentPlayer && (
                              <span className="text-[11px] font-semibold text-[#8c1f3d]">
                                (You)
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[#1a1a1a]/75">
                            <span className="font-mono tabular-nums font-medium">
                              {progressText}
                            </span>
                            {isFirst && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-semibold whitespace-nowrap">
                                <Crown className="w-3 h-3" aria-hidden="true" />
                                1st Place
                              </span>
                            )}
                            {isLast && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-stone-200 text-[#1a1a1a] border border-stone-300 text-[11px] font-medium whitespace-nowrap">
                                Last Place
                              </span>
                            )}
                            {entry.got_speed_bonus && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0b4f36] text-white text-[11px] font-semibold whitespace-nowrap">
                                <Zap className="w-3 h-3" aria-hidden="true" />
                                +3 First Finisher
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono text-lg font-semibold text-[#1a1a1a] tabular-nums leading-tight">
                          {entry.score}
                        </div>
                        <div className="text-[11px] text-[#1a1a1a]/65">
                          {entry.score === 1 ? 'pt' : 'pts'}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-[#dfd3be] flex items-center justify-end">
        <button
          type="button"
          onClick={onOpenReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#1a1a1a]/75 hover:text-[#8c1f3d] hover:bg-white/70 transition-colors cursor-pointer whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Reset Leaderboard
        </button>
      </div>
    </aside>
  );
}
