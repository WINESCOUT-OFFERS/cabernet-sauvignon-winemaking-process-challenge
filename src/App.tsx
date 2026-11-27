import { useCallback, useEffect, useState } from 'react';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminProjectorView } from './components/AdminProjectorView';
import { CompletionSummary } from './components/CompletionSummary';
import { JoinedParticipants } from './components/JoinedParticipants';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { LoginScreen } from './components/LoginScreen';
import { QuizPanel } from './components/QuizPanel';
import { ResetModal } from './components/ResetModal';
import { QUIZ_QUESTIONS } from './data/quizQuestions';
import {
  fetchLeaderboard,
  joinChallenge,
  resetLeaderboard,
  submitQuestionProgress,
  subscribeToLeaderboard,
} from './services/leaderboardService';
import { supabase } from './supabaseClient';
import { evaluateAnswer, type LeaderboardEntry } from './utils/quizLogic';

export default function App() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
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
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const totalQuestions = QUIZ_QUESTIONS.length;

  const refreshLeaderboard = useCallback(async () => {
    try {
      const data = await fetchLeaderboard();
      setLeaderboard(data);
    } catch {
      // Keep existing leaderboard state on transient error
    } finally {
      setIsLoadingLeaderboard(false);
    }
  }, []);

  useEffect(() => {
    void refreshLeaderboard();
    const unsubscribe = subscribeToLeaderboard((updated) => {
      setLeaderboard(updated);
      setIsLoadingLeaderboard(false);
    });
    return unsubscribe;
  }, [refreshLeaderboard]);

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

  const handleJoin = useCallback(
    async (nickname: string) => {
      setIsJoining(true);
      setJoinError(null);
      try {
        const player = await joinChallenge(nickname);
        setCurrentPlayer(player);
        setActiveQuestionIndex(0);
        setSelectedOptionId(null);
        setIsSubmitted(false);
        setSubmitError(null);
        setCorrectCount(0);
        setAwardedSpeedBonus(false);
        setHasEnteredSummary(false);
        await refreshLeaderboard();
      } catch (err) {
        setJoinError(
          err instanceof Error
            ? err.message
            : 'Unable to connect to the leaderboard. Please try again.',
        );
      } finally {
        setIsJoining(false);
      }
    },
    [refreshLeaderboard],
  );

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

  const handleStartNewSession = () => {
    setCurrentPlayer(null);
    setActiveQuestionIndex(0);
    setSelectedOptionId(null);
    setIsSubmitted(false);
    setSubmitError(null);
    setCorrectCount(0);
    setAwardedSpeedBonus(false);
    setHasEnteredSummary(false);
  };

  const handleConfirmReset = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setIsAdminAuthenticated(false);
      setIsResetModalOpen(false);
      throw new Error('Admin session required to reset the leaderboard.');
    }

    setIsResetting(true);
    try {
      await resetLeaderboard();
      setLeaderboard([]);
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

  return (
    <>
      {isAdminAuthenticated ? (
        <AdminProjectorView
          entries={leaderboard}
          totalQuestions={totalQuestions}
          isLoading={isLoadingLeaderboard}
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
          {hasEnteredSummary ? (
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
