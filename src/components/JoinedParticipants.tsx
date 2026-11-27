import { Users } from 'lucide-react';
import { sortByJoinOrder, type LeaderboardEntry } from '../utils/quizLogic';

interface JoinedParticipantsProps {
  entries: LeaderboardEntry[];
  currentPlayerId?: string | null;
  alignRight?: boolean;
}

export function JoinedParticipants({
  entries,
  currentPlayerId = null,
  alignRight = false,
}: JoinedParticipantsProps) {
  const ordered = sortByJoinOrder(entries);

  return (
    <section
      aria-label="Joined Participants"
      data-testid="joined-participants"
      className={`flex flex-col ${alignRight ? 'items-end text-right' : 'items-start text-left'}`}
    >
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f7f1e6] border border-[#8c1f3d] text-[#1a1a1a] text-xs font-semibold tabular-nums whitespace-nowrap">
        <Users className="w-3.5 h-3.5 text-[#8c1f3d] shrink-0" aria-hidden="true" />
        <span>Joined Players ({ordered.length})</span>
      </div>

      {ordered.length > 0 ? (
        <ul
          className={`mt-2.5 flex flex-wrap gap-1.5 max-h-28 overflow-y-auto ${
            alignRight ? 'justify-end' : 'justify-start'
          }`}
        >
          {ordered.map((entry) => {
            const isCurrent = entry.id === currentPlayerId;
            return (
              <li key={entry.id}>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f7f1e6] text-[#1a1a1a] text-xs font-medium border whitespace-nowrap ${
                    isCurrent ? 'border-[#8c1f3d] font-semibold' : 'border-[#0b4f36]'
                  }`}
                >
                  <span>{entry.nickname}</span>
                  {isCurrent && (
                    <span className="text-[11px] font-semibold text-[#8c1f3d]">(You)</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-[#1a1a1a]/65">
          Waiting for participants to join...
        </p>
      )}
    </section>
  );
}
