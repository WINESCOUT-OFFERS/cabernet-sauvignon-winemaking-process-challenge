import type { QuizQuestion } from '../data/quizQuestions';

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  score: number;
  current_question: number;
  is_finished: boolean;
  got_speed_bonus: boolean;
  finished_at: string | null;
  created_at: string;
}

export interface SubmissionComputationInput {
  currentScore: number;
  questionNumber: number;
  totalQuestions: number;
  isCorrect: boolean;
  someoneAlreadyWonSpeedBonus: boolean;
  nowIso?: string;
}

export interface SubmissionComputationResult {
  nextScore: number;
  nextQuestion: number;
  isFinished: boolean;
  gotSpeedBonus: boolean;
  speedBonusPoints: number;
  finishedAt: string | null;
}

export const SPEED_BONUS_POINTS = 3;
export const QUIZ_STATE_NICKNAME = '__QUIZ_STATE__';
export const COUNTDOWN_DURATION_SECONDS = 10;

export interface QuizSyncState {
  isStarted: boolean;
  startedAt: string | null;
}

export function formatAdminEmail(rawUsername: string): string {
  const trimmed = rawUsername.trim().toLowerCase();
  if (!trimmed) return '';
  return trimmed.includes('@') ? trimmed : `${trimmed}@admin.local`;
}

export function validateNickname(raw: string): { valid: boolean; trimmed: string; error?: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { valid: false, trimmed, error: 'Please enter a nickname to join the challenge.' };
  }
  if (trimmed === QUIZ_STATE_NICKNAME) {
    return { valid: false, trimmed, error: 'That nickname is reserved.' };
  }
  if (trimmed.length > 32) {
    return { valid: false, trimmed, error: 'Nickname must be 32 characters or fewer.' };
  }
  return { valid: true, trimmed };
}

export function evaluateAnswer(
  question: QuizQuestion,
  selectedOptionId: string,
): { isCorrect: boolean; pointsEarned: number; correctOptionId: string } {
  const isCorrect = question.correctOptionId === selectedOptionId;
  return {
    isCorrect,
    pointsEarned: isCorrect ? 1 : 0,
    correctOptionId: question.correctOptionId,
  };
}

export function computeSubmissionUpdate({
  currentScore,
  questionNumber,
  totalQuestions,
  isCorrect,
  someoneAlreadyWonSpeedBonus,
  nowIso = new Date().toISOString(),
}: SubmissionComputationInput): SubmissionComputationResult {
  const questionPoints = isCorrect ? 1 : 0;
  const isFinalQuestion = questionNumber >= totalQuestions;

  if (isFinalQuestion) {
    const awardedBonus = !someoneAlreadyWonSpeedBonus;
    const speedBonusPoints = awardedBonus ? SPEED_BONUS_POINTS : 0;
    return {
      nextScore: currentScore + questionPoints + speedBonusPoints,
      nextQuestion: totalQuestions,
      isFinished: true,
      gotSpeedBonus: awardedBonus,
      speedBonusPoints,
      finishedAt: nowIso,
    };
  }

  return {
    nextScore: currentScore + questionPoints,
    nextQuestion: questionNumber + 1,
    isFinished: false,
    gotSpeedBonus: false,
    speedBonusPoints: 0,
    finishedAt: null,
  };
}

function parseTimestamp(value: string | null | undefined): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? Number.POSITIVE_INFINITY : ms;
}

export function sortLeaderboard(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    const aFinished = parseTimestamp(a.finished_at);
    const bFinished = parseTimestamp(b.finished_at);
    if (aFinished !== bFinished) {
      return aFinished - bFinished;
    }

    const aCreated = parseTimestamp(a.created_at);
    const bCreated = parseTimestamp(b.created_at);
    if (aCreated !== bCreated) {
      return aCreated - bCreated;
    }

    return String(a.id).localeCompare(String(b.id));
  });
}

export function sortByJoinOrder(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    const aCreated = parseTimestamp(a.created_at);
    const bCreated = parseTimestamp(b.created_at);
    if (aCreated !== bCreated) {
      return aCreated - bCreated;
    }
    return String(a.id).localeCompare(String(b.id));
  });
}

export function filterParticipants(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return entries.filter((entry) => entry.nickname !== QUIZ_STATE_NICKNAME);
}

export function extractQuizStarted(entries: LeaderboardEntry[]): boolean {
  return entries.some(
    (entry) => entry.nickname === QUIZ_STATE_NICKNAME && entry.is_finished === true,
  );
}

export function extractQuizState(entries: LeaderboardEntry[]): QuizSyncState {
  const controlRows = entries.filter((entry) => entry.nickname === QUIZ_STATE_NICKNAME);
  if (controlRows.length === 0) {
    return { isStarted: false, startedAt: null };
  }
  const activeRow = controlRows.find((row) => row.is_finished === true) ?? controlRows[0];
  return {
    isStarted: activeRow.is_finished === true,
    startedAt: activeRow.finished_at ?? null,
  };
}

export function computeCountdownSecondsRemaining(
  isStarted: boolean,
  startedAt: string | null,
  nowMs: number = Date.now(),
  durationSeconds: number = COUNTDOWN_DURATION_SECONDS,
): number {
  if (!isStarted) return durationSeconds;
  if (!startedAt) return 0;
  const startMs = Date.parse(startedAt);
  if (Number.isNaN(startMs)) return 0;
  const elapsedSeconds = Math.max(0, (nowMs - startMs) / 1000);
  return Math.max(0, Math.ceil(durationSeconds - elapsedSeconds));
}

export function formatProgress(entry: LeaderboardEntry, totalQuestions: number): string {
  if (entry.is_finished) {
    return 'Completed';
  }
  const qNum = Math.max(1, Math.min(entry.current_question || 1, totalQuestions));
  return `Q${qNum}/${totalQuestions}`;
}
