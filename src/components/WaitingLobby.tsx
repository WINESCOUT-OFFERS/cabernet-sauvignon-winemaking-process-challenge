import { Clock, Users } from 'lucide-react';
import { QUIZ_SCENARIO, QUIZ_TITLE } from '../data/quizQuestions';
import { sortByJoinOrder, type LeaderboardEntry } from '../utils/quizLogic';

interface WaitingLobbyProps {
  currentPlayer: LeaderboardEntry;
  participants: LeaderboardEntry[];
}

export function WaitingLobby({ currentPlayer, participants }: WaitingLobbyProps) {
  const ordered = sortByJoinOrder(participants);

  return (
    <main className="w-full lg:w-[70%] bg-white text-[#1a1a1a] px-6 py-8 sm:px-10 lg:px-12 lg:py-10 flex flex-col justify-between">
      <div className="max-w-3xl w-full mx-auto">
        <header className="pb-6 border-b border-stone-200">
          <p className="text-xs font-medium tracking-wide text-[#1a1a1a]/65 mb-2">
            French Cabernet Sauvignon AOC Label Winemaking Challenge · 15 Questions
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold leading-tight text-[#8c1f3d] [text-wrap:balance]">
            {QUIZ_TITLE}
          </h1>
          <h2 className="mt-2.5 text-sm sm:text-base font-semibold leading-relaxed text-[#0b4f36]">
            {QUIZ_SCENARIO}
          </h2>
          <p className="mt-4 text-xs sm:text-sm text-[#1a1a1a]/75">
            Student: <strong className="font-semibold text-[#1a1a1a]">{currentPlayer.nickname}</strong>
          </p>
        </header>

        <section
          aria-label="Waiting Lobby"
          className="mt-8 rounded-2xl border border-[#dfd3be] bg-[#f7f1e6]/60 p-6 sm:p-8"
        >
          <div className="flex items-center gap-3 text-[#0b4f36]">
            <Clock className="w-6 h-6 shrink-0" aria-hidden="true" />
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#0b4f36]">
              Waiting for instructor to start the challenge...
            </h3>
          </div>

          <p className="mt-3 text-sm sm:text-base text-[#1a1a1a]/80 leading-relaxed">
            You are checked in as <strong>{currentPlayer.nickname}</strong>. Question 1 will open
            automatically as soon as your instructor begins the session.
          </p>

          <div className="mt-6 pt-6 border-t border-[#dfd3be]">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0b4f36]">
              <Users className="w-4 h-4 text-[#8c1f3d] shrink-0" aria-hidden="true" />
              <span>Joined Players ({ordered.length})</span>
            </div>

            {ordered.length === 0 ? (
              <p className="mt-3 text-sm text-[#1a1a1a]/70">
                Waiting for participants to join...
              </p>
            ) : (
              <ul
                data-testid="lobby-joined-list"
                className="mt-3 flex flex-wrap gap-2"
              >
                {ordered.map((entry) => {
                  const isCurrent = entry.id === currentPlayer.id;
                  return (
                    <li key={entry.id}>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f7f1e6] text-[#1a1a1a] text-sm font-medium border whitespace-nowrap ${
                          isCurrent ? 'border-[#8c1f3d] font-semibold' : 'border-[#0b4f36]'
                        }`}
                      >
                        <span>{entry.nickname}</span>
                        {isCurrent && (
                          <span className="text-xs font-semibold text-[#8c1f3d]">(You)</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
