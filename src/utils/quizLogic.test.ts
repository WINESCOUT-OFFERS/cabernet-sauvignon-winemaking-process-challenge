import test from 'node:test';
import assert from 'node:assert/strict';
import { QUIZ_QUESTIONS } from '../data/quizQuestions';
import {
  QUIZ_STATE_NICKNAME,
  computeCountdownSecondsRemaining,
  computeSubmissionUpdate,
  evaluateAnswer,
  extractQuizStarted,
  extractQuizState,
  filterParticipants,
  formatAdminEmail,
  formatProgress,
  sortByJoinOrder,
  sortLeaderboard,
  validateNickname,
  type LeaderboardEntry,
} from './quizLogic';

test('quiz contains exactly 15 questions with valid correct options', () => {
  assert.equal(QUIZ_QUESTIONS.length, 15);
  QUIZ_QUESTIONS.forEach((q, idx) => {
    assert.equal(q.number, idx + 1);
    assert.ok(q.options.some((o) => o.id === q.correctOptionId));
  });
});

test('evaluateAnswer awards 1 point for correct and 0 for wrong', () => {
  const q1 = QUIZ_QUESTIONS[0];
  assert.deepEqual(evaluateAnswer(q1, 'C'), {
    isCorrect: true,
    pointsEarned: 1,
    correctOptionId: 'C',
  });
  assert.deepEqual(evaluateAnswer(q1, 'A'), {
    isCorrect: false,
    pointsEarned: 0,
    correctOptionId: 'C',
  });
});

test('computeSubmissionUpdate advances current_question on Q1-Q14', () => {
  const res = computeSubmissionUpdate({
    currentScore: 3,
    questionNumber: 4,
    totalQuestions: 15,
    isCorrect: true,
    someoneAlreadyWonSpeedBonus: false,
    nowIso: '2026-11-27T10:00:00.000Z',
  });

  assert.deepEqual(res, {
    nextScore: 4,
    nextQuestion: 5,
    isFinished: false,
    gotSpeedBonus: false,
    speedBonusPoints: 0,
    finishedAt: null,
  });
});

test('computeSubmissionUpdate awards +3 speed bonus on Q15 when unclaimed', () => {
  const res = computeSubmissionUpdate({
    currentScore: 12,
    questionNumber: 15,
    totalQuestions: 15,
    isCorrect: true,
    someoneAlreadyWonSpeedBonus: false,
    nowIso: '2026-11-27T10:05:00.000Z',
  });

  assert.deepEqual(res, {
    nextScore: 16,
    nextQuestion: 15,
    isFinished: true,
    gotSpeedBonus: true,
    speedBonusPoints: 3,
    finishedAt: '2026-11-27T10:05:00.000Z',
  });
});

test('computeSubmissionUpdate awards 0 speed bonus on Q15 when already claimed', () => {
  const res = computeSubmissionUpdate({
    currentScore: 14,
    questionNumber: 15,
    totalQuestions: 15,
    isCorrect: false,
    someoneAlreadyWonSpeedBonus: true,
    nowIso: '2026-11-27T10:06:00.000Z',
  });

  assert.deepEqual(res, {
    nextScore: 14,
    nextQuestion: 15,
    isFinished: true,
    gotSpeedBonus: false,
    speedBonusPoints: 0,
    finishedAt: '2026-11-27T10:06:00.000Z',
  });
});

test('sortLeaderboard ranks by highest score, then earliest finished_at, then earliest created_at', () => {
  const entries: LeaderboardEntry[] = [
    {
      id: '3',
      nickname: 'Camille',
      score: 12,
      current_question: 15,
      is_finished: true,
      got_speed_bonus: false,
      finished_at: '2026-11-27T10:02:00.000Z',
      created_at: '2026-11-27T10:00:00.000Z',
    },
    {
      id: '1',
      nickname: 'Antoine',
      score: 15,
      current_question: 15,
      is_finished: true,
      got_speed_bonus: true,
      finished_at: '2026-11-27T10:01:30.000Z',
      created_at: '2026-11-27T10:00:05.000Z',
    },
    {
      id: '2',
      nickname: 'Beatrice',
      score: 12,
      current_question: 15,
      is_finished: true,
      got_speed_bonus: false,
      finished_at: '2026-11-27T10:01:00.000Z',
      created_at: '2026-11-27T10:00:10.000Z',
    },
    {
      id: '4',
      nickname: 'Damien',
      score: 12,
      current_question: 13,
      is_finished: false,
      got_speed_bonus: false,
      finished_at: null,
      created_at: '2026-11-27T09:59:00.000Z',
    },
  ];

  const sorted = sortLeaderboard(entries);
  assert.deepEqual(
    sorted.map((e) => e.nickname),
    ['Antoine', 'Beatrice', 'Camille', 'Damien'],
  );
});

test('formatProgress displays Qn/15 or Completed', () => {
  assert.equal(
    formatProgress(
      {
        id: '1',
        nickname: 'Alice',
        score: 3,
        current_question: 4,
        is_finished: false,
        got_speed_bonus: false,
        finished_at: null,
        created_at: '2026-11-27T10:00:00.000Z',
      },
      15,
    ),
    'Q4/15',
  );
  assert.equal(
    formatProgress(
      {
        id: '2',
        nickname: 'Bob',
        score: 15,
        current_question: 15,
        is_finished: true,
        got_speed_bonus: true,
        finished_at: '2026-11-27T10:05:00.000Z',
        created_at: '2026-11-27T10:00:00.000Z',
      },
      15,
    ),
    'Completed',
  );
});

test('validateNickname and formatAdminEmail enforce rules', () => {
  assert.equal(validateNickname('   ').valid, false);
  assert.equal(validateNickname('  Sommelier Sam  ').valid, true);
  assert.equal(validateNickname('  Sommelier Sam  ').trimmed, 'Sommelier Sam');
  assert.equal(formatAdminEmail('admin'), 'admin@admin.local');
  assert.equal(formatAdminEmail('  WineAdmin '), 'wineadmin@admin.local');
  assert.equal(formatAdminEmail('director@chateau.fr'), 'director@chateau.fr');
  assert.equal(formatAdminEmail('   '), '');
});

test('sortByJoinOrder orders participants chronologically by created_at', () => {
  const entries: LeaderboardEntry[] = [
    {
      id: 'b',
      nickname: 'Second',
      score: 10,
      current_question: 5,
      is_finished: false,
      got_speed_bonus: false,
      finished_at: null,
      created_at: '2026-11-27T10:02:00.000Z',
    },
    {
      id: 'a',
      nickname: 'First',
      score: 1,
      current_question: 2,
      is_finished: false,
      got_speed_bonus: false,
      finished_at: null,
      created_at: '2026-11-27T10:01:00.000Z',
    },
  ];
  assert.deepEqual(
    sortByJoinOrder(entries).map((e) => e.nickname),
    ['First', 'Second'],
  );
});

test('filterParticipants and extractQuizStarted handle __QUIZ_STATE__ row cleanly', () => {
  const controlRow: LeaderboardEntry = {
    id: 'ctrl',
    nickname: QUIZ_STATE_NICKNAME,
    score: 0,
    current_question: 1,
    is_finished: false,
    got_speed_bonus: false,
    finished_at: null,
    created_at: '2026-11-27T09:00:00.000Z',
  };
  const studentRow: LeaderboardEntry = {
    id: 's1',
    nickname: 'Elena',
    score: 2,
    current_question: 3,
    is_finished: false,
    got_speed_bonus: false,
    finished_at: null,
    created_at: '2026-11-27T09:01:00.000Z',
  };

  assert.equal(validateNickname(QUIZ_STATE_NICKNAME).valid, false);
  assert.deepEqual(
    filterParticipants([controlRow, studentRow]).map((e) => e.nickname),
    ['Elena'],
  );
  assert.equal(extractQuizStarted([controlRow, studentRow]), false);
  assert.equal(
    extractQuizStarted([{ ...controlRow, is_finished: true }, studentRow]),
    true,
  );
});

test('extractQuizState and computeCountdownSecondsRemaining calculate 10->0 timer accurately', () => {
  const waitingRow: LeaderboardEntry = {
    id: 'ctrl',
    nickname: QUIZ_STATE_NICKNAME,
    score: 0,
    current_question: 1,
    is_finished: false,
    got_speed_bonus: false,
    finished_at: null,
    created_at: '2026-11-27T09:00:00.000Z',
  };

  assert.deepEqual(extractQuizState([waitingRow]), {
    isStarted: false,
    startedAt: null,
  });
  assert.equal(computeCountdownSecondsRemaining(false, null, 1000), 10);

  const startedAt = '2026-11-27T09:05:00.000Z';
  const startMs = Date.parse(startedAt);
  const startedRow: LeaderboardEntry = {
    ...waitingRow,
    is_finished: true,
    finished_at: startedAt,
  };

  assert.deepEqual(extractQuizState([startedRow]), {
    isStarted: true,
    startedAt,
  });

  assert.equal(computeCountdownSecondsRemaining(true, startedAt, startMs), 10);
  assert.equal(computeCountdownSecondsRemaining(true, startedAt, startMs + 500), 10);
  assert.equal(computeCountdownSecondsRemaining(true, startedAt, startMs + 1001), 9);
  assert.equal(computeCountdownSecondsRemaining(true, startedAt, startMs + 9500), 1);
  assert.equal(computeCountdownSecondsRemaining(true, startedAt, startMs + 10000), 0);
  assert.equal(computeCountdownSecondsRemaining(true, startedAt, startMs + 15000), 0);
});
