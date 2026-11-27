import { useCallback, useEffect, useState } from 'react';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminProjectorView } from './components/AdminProjectorView';
import { CompletionSummary } from './components/CompletionSummary';
import { JoinedParticipants } from './components/JoinedParticipants';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { LoginScreen } from './components/LoginScreen';
import { QuizPanel } from './components/QuizPanel';
import { ResetModal } from './components/ResetModal';
import { WaitingLobby } from './components/WaitingLobby';
import { QUIZ_QUESTIONS } from './data/quizQuestions';
import {
  fetchLeaderboardState,
  joinChallenge,
  resetLeaderboard,
  startQuiz,
  submitQuestionProgress,
  subscribeToLeaderboard,
  type LeaderboardSnapshot,
} from './services/leaderboardService';
import { supabase } from './supabaseClient';
import {
  COUNTDOWN_DURATION_SECONDS,
  computeCountdownSecondsRemaining,
  evaluateAnswer,
  type LeaderboardEntry,
  type QuizSyncState,
} from './utils/quizLogic';

export default function App() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [quizState, setQuizState] = useState<QuizSyncState>({
    isStarted: false,
    startedAt: null,
  });
  const [remainingSeconds, setRemainingSeconds] = useState(COUNTDOWN_DURATION_SECONDS);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);

  const [currentPlayer, setCurrentPlayer] = useState<LeaderboardEntry | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0); // 0-based index
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [awardedSpeedBonus, setAwardedSpeedBonus] = useState(false);
  const [hasEnteredSummary, setHasEnteredSummary] = useState(false);

  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isStartingQuiz, setIsStartingQuiz] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const totalQuestions = QUIZ_QUESTIONS.length;

  const handleStartNewSession = useCallback(() => {
    setCurrentPlayer(null);
    setActiveQuestionIndex(0);
    setSelectedOptionId(null);
    setIsSubmitted(false);
    setSubmitError(null);
    setCorrectCount(0);
    setAwardedSpeedBonus(false);
    setHasEnteredSummary(false);
  }, []);

  const applyLeaderboardSnapshot = useCallback((snapshot: LeaderboardSnapshot) => {
    setLeaderboard(snapshot.participants);
    setQuizState(snapshot.quizState);
    setRemainingSeconds(
      computeCountdownSecondsRemaining(
        snapshot.quizState.isStarted,
        snapshot.quizState.startedAt,
      ),
    );
    setIsLoadingLeaderboard(false);

    setCurrentPlayer((prev) => {
      if (!prev) return null;
      const stillExists = snapshot.participants.find((item) => item.id === prev.id);
      if (!stillExists) {
        setActiveQuestionIndex(0);
        setSelectedOptionId(null);
        setIsSubmitted(false);
        setSubmitError(null);
        setCorrectCount(0);
        setAwardedSpeedBonus(false);
        setHasEnteredSummary(false);
        return null;
      }
      return stillExists;
    });
  }, []);

  const refreshLeaderboard = useCallback(async () => {
    try {
      const snapshot = await fetchLeaderboardState();
      applyLeaderboardSnapshot(snapshot);
    } catch {
      // Keep existing leaderboard state on transient error
    } finally {
      setIsLoadingLeaderboard(false);
    }
  }, [applyLeaderboardSnapshot]);

  useEffect(() => {
    void refreshLeaderboard();
    const unsubscribe = subscribeToLeaderboard((snapshot) => {
      applyLeaderboardSnapshot(snapshot);
    });
    return unsubscribe;
  }, [refreshLeaderboard, applyLeaderboardSnapshot]);

  // Real-time countdown ticker driven by __QUIZ_STATE__.finished_at
  useEffect(() => {
    const syncNow = () => {
      const next = computeCountdownSecondsRemaining(
        quizState.isStarted,
        quizState.startedAt,
      );
      setRemainingSeconds((prev) => (prev !== next ? next : prev));
      return next;
    };

    const currentRemaining = syncNow();
    if (!quizState.isStarted || currentRemaining <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      const next = syncNow();
      if (next <= 0) {
        window.clearInterval(timer);
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [quizState.isStarted, quizState.startedAt]);

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (isMounted) {
          setIsAdminAuthenticated(Boolean(data.session));
        }
      } catch {
        if (isMounted) {
          setIsAdminAuthenticated(false);
        }
      }
    };

    void verifySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      const hasSession = Boolean(session);
      setIsAdminAuthenticated(hasSession);
      if (!hasSession) {
        setIsResetModalOpen(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleJoin = useCallback(async (nickname: string) => {
    setIsJoining(true);
    setJoinError(null);
    try {
      const player = await joinChallenge(nickname);
      const snapshot = await fetchLeaderboardState();
      setLeaderboard(snapshot.participants);
      setQuizState(snapshot.quizState);
      setRemainingSeconds(
        computeCountdownSecondsRemaining(
          snapshot.quizState.isStarted,
          snapshot.quizState.startedAt,
        ),
      );
      setCurrentPlayer(player);
      setActiveQuestionIndex(0);
      setSelectedOptionId(null);
      setIsSubmitted(false);
      setSubmitError(null);
      setCorrectCount(0);
      setAwardedSpeedBonus(false);
      setHasEnteredSummary(false);
    } catch (err) {
      setJoinError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to the leaderboard. Please try again.',
      );
    } finally {
      setIsJoining(false);
    }
  }, []);

  // Support ?autostart=1 for automated testability
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' && !currentPlayer && !isJoining) {
      void handleJoin('Guest Vintner');
    }
  }, [currentPlayer, isJoining, handleJoin]);

  const handleSubmitAnswer = async () => {
    if (!currentPlayer || !selectedOptionId || isSubmitted || isSubmitting) return;
    const question = QUIZ_QUESTIONS[activeQuestionIndex];
    const evaluation = evaluateAnswer(question, selectedOptionId);

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitQuestionProgress({
        playerId: currentPlayer.id,
        currentScore: currentPlayer.score,
        questionNumber: question.number,
        totalQuestions,
        isCorrect: evaluation.isCorrect,
      });

      setCurrentPlayer(result.entry);
      if (evaluation.isCorrect) {
        setCorrectCount((prev) => prev + 1);
      }
      if (result.awardedSpeedBonus) {
        setAwardedSpeedBonus(true);
      }
      setIsSubmitted(true);
      await refreshLeaderboard();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Unable to submit answer. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    if (!isSubmitted) return;
    if (activeQuestionIndex + 1 >= totalQuestions) {
      setHasEnteredSummary(true);
      return;
    }
    setActiveQuestionIndex((prev) => prev + 1);
    setSelectedOptionId(null);
    setIsSubmitted(false);
    setSubmitError(null);
  };

  const verifyActiveAdminSession = async (): Promise<boolean> => {
    const { data } = await supabase.auth.getSession();
    return Boolean(data.session);
  };

  const handleStartQuiz = async () => {
    const hasSession = await verifyActiveAdminSession();
    if (!hasSession) {
      setIsAdminAuthenticated(false);
      return;
    }
    setIsStartingQuiz(true);
    try {
      const startedAt = await startQuiz();
      setQuizState({ isStarted: true, startedAt });
      setRemainingSeconds(computeCountdownSecondsRemaining(true, startedAt));
      await refreshLeaderboard();
    } finally {
      setIsStartingQuiz(false);
    }
  };

  const handleConfirmReset = async () => {
    const hasSession = await verifyActiveAdminSession();
    if (!hasSession) {
      setIsAdminAuthenticated(false);
      setIsResetModalOpen(false);
      throw new Error('Admin session required to reset the leaderboard.');
    }

    setIsResetting(true);
    try {
      await resetLeaderboard();
      setLeaderboard([]);
      setQuizState({ isStarted: false, startedAt: null });
      setRemainingSeconds(COUNTDOWN_DURATION_SECONDS);
      handleStartNewSession();
      await refreshLeaderboard();
    } finally {
      setIsResetting(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setIsAdminAuthenticated(false);
      setIsResetModalOpen(false);
    }
  };

  const currentRankIndex = currentPlayer
    ? leaderboard.findIndex((item) => item.id === currentPlayer.id)
    : -1;
  const currentRank = currentRankIndex >= 0 ? currentRankIndex + 1 : null;
  const isLiveQuizActive = quizState.isStarted && remainingSeconds === 0;

  return (
    <>
      {isAdminAuthenticated && !currentPlayer ? (
        <AdminProjectorView
          entries={leaderboard}
          totalQuestions={totalQuestions}
          isLoading={isLoadingLeaderboard}
          isQuizStarted={quizState.isStarted}
          remainingSeconds={remainingSeconds}
          isStartingQuiz={isStartingQuiz}
          onStartQuiz={handleStartQuiz}
          onOpenReset={() => setIsResetModalOpen(true)}
          onLogout={() => void handleAdminLogout()}
        />
      ) : !currentPlayer ? (
        <LoginScreen
          entries={leaderboard}
          isJoining={isJoining}
          joinError={joinError}
          onJoin={handleJoin}
          onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        />
      ) : (
        <div className="min-h-screen flex flex-col lg:flex-row bg-white">
          <div className="lg:hidden px-6 pt-5 pb-3 border-b border-stone-200 flex justify-end bg-white">
            <JoinedParticipants
              entries={leaderboard}
              currentPlayerId={currentPlayer.id}
              alignRight
            />
          </div>
          {!isLiveQuizActive ? (
            <WaitingLobby
              currentPlayer={currentPlayer}
              participants={leaderboard}
              isQuizStarted={quizState.isStarted}
              remainingSeconds={remainingSeconds}
            />
          ) : hasEnteredSummary ? (
            <CompletionSummary
              player={currentPlayer}
              rank={currentRank}
              totalPlayers={leaderboard.length}
              correctCount={correctCount}
              totalQuestions={totalQuestions}
              onStartNewSession={handleStartNewSession}
            />
          ) : (
            <QuizPanel
              nickname={currentPlayer.nickname}
              score={currentPlayer.score}
              question={QUIZ_QUESTIONS[activeQuestionIndex]}
              totalQuestions={totalQuestions}
              selectedOptionId={selectedOptionId}
              isSubmitted={isSubmitted}
              isSubmitting={isSubmitting}
              submitError={submitError}
              awardedSpeedBonus={awardedSpeedBonus}
              onSelectOption={setSelectedOptionId}
              onSubmitAnswer={handleSubmitAnswer}
              onNextQuestion={handleNextQuestion}
            />
          )}

          <LeaderboardPanel
            entries={leaderboard}
            currentPlayerId={currentPlayer.id}
            totalQuestions={totalQuestions}
            isLoading={isLoadingLeaderboard}
          />
        </div>
      )}

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={() => {
          setIsAdminLoginOpen(false);
          setIsAdminAuthenticated(true);
        }}
      />

      {isAdminAuthenticated && (
        <ResetModal
          isOpen={isResetModalOpen}
          isResetting={isResetting}
          onClose={() => setIsResetModalOpen(false)}
          onConfirmReset={handleConfirmReset}
        />
      )}
    </>
  );
}
