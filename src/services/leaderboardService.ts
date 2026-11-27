import {
  LEADERBOARD_TABLE,
  isSupabaseConfigured,
  supabase,
} from '../supabaseClient';
import {
  QUIZ_STATE_NICKNAME,
  computeSubmissionUpdate,
  extractQuizState,
  filterParticipants,
  sortLeaderboard,
  type LeaderboardEntry,
  type QuizSyncState,
} from '../utils/quizLogic';

const LOCAL_STORAGE_KEY = 'cabernet_challenge_leaderboard_v1';
const LOCAL_INIT_KEY = 'cabernet_challenge_initialized_v1';
const BROADCAST_CHANNEL_NAME = 'cabernet_challenge_leaderboard_channel';

const localListeners = new Set<() => void>();

export interface LeaderboardSnapshot {
  participants: LeaderboardEntry[];
  quizState: QuizSyncState;
}

function createControlRow(isStarted = false): LeaderboardEntry {
  return {
    id: 'quiz-state-control',
    nickname: QUIZ_STATE_NICKNAME,
    score: 0,
    current_question: 1,
    is_finished: isStarted,
    got_speed_bonus: false,
    finished_at: null,
    created_at: new Date(0).toISOString(),
  };
}

function createInitialSeedEntries(): LeaderboardEntry[] {
  const now = Date.now();
  return [
    createControlRow(false),
    {
      id: 'seed-claire',
      nickname: 'Claire (Pauillac)',
      score: 7,
      current_question: 9,
      is_finished: false,
      got_speed_bonus: false,
      finished_at: null,
      created_at: new Date(now - 180_000).toISOString(),
    },
    {
      id: 'seed-laurent',
      nickname: 'Laurent (Médoc)',
      score: 4,
      current_question: 6,
      is_finished: false,
      got_speed_bonus: false,
      finished_at: null,
      created_at: new Date(now - 120_000).toISOString(),
    },
  ];
}

function readLocalEntries(): LeaderboardEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const initialized = window.localStorage.getItem(LOCAL_INIT_KEY);
    if (!initialized) {
      const seeded = createInitialSeedEntries();
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(seeded));
      window.localStorage.setItem(LOCAL_INIT_KEY, 'true');
      return seeded;
    }
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [createControlRow(false)];
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? (parsed as LeaderboardEntry[]) : [];
    if (!list.some((item) => item.nickname === QUIZ_STATE_NICKNAME)) {
      const withControl = [createControlRow(false), ...list];
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(withControl));
      return withControl;
    }
    return list;
  } catch {
    return [createControlRow(false)];
  }
}

function writeLocalEntries(entries: LeaderboardEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_INIT_KEY, 'true');
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage quota errors
  }
  localListeners.forEach((cb) => cb());
  if (typeof BroadcastChannel !== 'undefined') {
    const ch = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    ch.postMessage({ type: 'leaderboard-updated' });
    ch.close();
  }
}

async function ensureSupabaseControlRow(): Promise<void> {
  const { data: existing, error: selectError } = await supabase
    .from(LEADERBOARD_TABLE)
    .select('id')
    .eq('nickname', QUIZ_STATE_NICKNAME)
    .limit(1);

  if (selectError) {
    throw new Error(selectError.message || 'Failed to check quiz state');
  }

  if (!existing || existing.length === 0) {
    const { error: insertError } = await supabase.from(LEADERBOARD_TABLE).insert({
      nickname: QUIZ_STATE_NICKNAME,
      score: 0,
      current_question: 1,
      is_finished: false,
      got_speed_bonus: false,
      finished_at: null,
    });
    if (insertError) {
      throw new Error(insertError.message || 'Failed to initialize quiz state');
    }
  }
}

export async function fetchLeaderboardState(): Promise<LeaderboardSnapshot> {
  if (!isSupabaseConfigured) {
    const allRows = readLocalEntries();
    return {
      participants: sortLeaderboard(filterParticipants(allRows)),
      quizState: extractQuizState(allRows),
    };
  }

  const { data, error } = await supabase.from(LEADERBOARD_TABLE).select('*');
  if (error) {
    throw new Error(error.message || 'Failed to load leaderboard');
  }

  let allRows = (data ?? []) as LeaderboardEntry[];
  if (!allRows.some((row) => row.nickname === QUIZ_STATE_NICKNAME)) {
    await ensureSupabaseControlRow();
    const { data: refreshed, error: refreshError } = await supabase
      .from(LEADERBOARD_TABLE)
      .select('*');
    if (refreshError) {
      throw new Error(refreshError.message || 'Failed to reload leaderboard');
    }
    allRows = (refreshed ?? []) as LeaderboardEntry[];
  }

  return {
    participants: sortLeaderboard(filterParticipants(allRows)),
    quizState: extractQuizState(allRows),
  };
}

export async function joinChallenge(nickname: string): Promise<LeaderboardEntry> {
  if (!isSupabaseConfigured) {
    const entries = readLocalEntries();
    const newEntry: LeaderboardEntry = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `player-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      nickname,
      score: 0,
      current_question: 1,
      is_finished: false,
      got_speed_bonus: false,
      finished_at: null,
      created_at: new Date().toISOString(),
    };
    writeLocalEntries([...entries, newEntry]);
    return newEntry;
  }

  await ensureSupabaseControlRow();

  const { data, error } = await supabase
    .from(LEADERBOARD_TABLE)
    .insert({
      nickname,
      score: 0,
      current_question: 1,
      is_finished: false,
      got_speed_bonus: false,
      finished_at: null,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Unable to join challenge');
  }

  return data as LeaderboardEntry;
}

export async function startQuiz(): Promise<string> {
  const startedAt = new Date().toISOString();

  if (!isSupabaseConfigured) {
    const entries = readLocalEntries();
    const next = entries.map((item) =>
      item.nickname === QUIZ_STATE_NICKNAME
        ? { ...item, is_finished: true, finished_at: startedAt }
        : item,
    );
    writeLocalEntries(next);
    return startedAt;
  }

  await ensureSupabaseControlRow();
  const { error } = await supabase
    .from(LEADERBOARD_TABLE)
    .update({ is_finished: true, finished_at: startedAt })
    .eq('nickname', QUIZ_STATE_NICKNAME);

  if (error) {
    throw new Error(error.message || 'Failed to start quiz');
  }
  return startedAt;
}

export interface SubmitQuestionProgressInput {
  playerId: string;
  currentScore: number;
  questionNumber: number;
  totalQuestions: number;
  isCorrect: boolean;
}

export interface SubmitQuestionProgressOutput {
  entry: LeaderboardEntry;
  awardedSpeedBonus: boolean;
}

export async function submitQuestionProgress({
  playerId,
  currentScore,
  questionNumber,
  totalQuestions,
  isCorrect,
}: SubmitQuestionProgressInput): Promise<SubmitQuestionProgressOutput> {
  const isFinalQuestion = questionNumber >= totalQuestions;

  if (!isSupabaseConfigured) {
    const entries = readLocalEntries();
    const someoneAlreadyWonSpeedBonus = isFinalQuestion
      ? filterParticipants(entries).some((item) => item.got_speed_bonus === true)
      : false;

    const computed = computeSubmissionUpdate({
      currentScore,
      questionNumber,
      totalQuestions,
      isCorrect,
      someoneAlreadyWonSpeedBonus,
    });

    let updatedEntry: LeaderboardEntry | null = null;
    const nextEntries = entries.map((item) => {
      if (item.id !== playerId) return item;
      updatedEntry = {
        ...item,
        score: computed.nextScore,
        current_question: computed.nextQuestion,
        is_finished: computed.isFinished,
        got_speed_bonus: computed.gotSpeedBonus,
        finished_at: computed.finishedAt,
      };
      return updatedEntry;
    });

    if (!updatedEntry) {
      updatedEntry = {
        id: playerId,
        nickname: 'Student',
        score: computed.nextScore,
        current_question: computed.nextQuestion,
        is_finished: computed.isFinished,
        got_speed_bonus: computed.gotSpeedBonus,
        finished_at: computed.finishedAt,
        created_at: new Date().toISOString(),
      };
      nextEntries.push(updatedEntry);
    }

    writeLocalEntries(nextEntries);
    return {
      entry: updatedEntry,
      awardedSpeedBonus: computed.gotSpeedBonus,
    };
  }

  let someoneAlreadyWonSpeedBonus = false;
  if (isFinalQuestion) {
    const { data: bonusHolders, error: bonusCheckError } = await supabase
      .from(LEADERBOARD_TABLE)
      .select('id')
      .eq('got_speed_bonus', true)
      .neq('nickname', QUIZ_STATE_NICKNAME)
      .limit(1);

    if (bonusCheckError) {
      throw new Error(bonusCheckError.message || 'Failed to verify speed bonus eligibility');
    }
    someoneAlreadyWonSpeedBonus = Boolean(bonusHolders && bonusHolders.length > 0);
  }

  const computed = computeSubmissionUpdate({
    currentScore,
    questionNumber,
    totalQuestions,
    isCorrect,
    someoneAlreadyWonSpeedBonus,
  });

  const updatePayload: Partial<LeaderboardEntry> = {
    score: computed.nextScore,
    current_question: computed.nextQuestion,
  };

  if (computed.isFinished) {
    updatePayload.is_finished = true;
    updatePayload.got_speed_bonus = computed.gotSpeedBonus;
    updatePayload.finished_at = computed.finishedAt;
  }

  const { data, error } = await supabase
    .from(LEADERBOARD_TABLE)
    .update(updatePayload)
    .eq('id', playerId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to save progress');
  }

  return {
    entry: data as LeaderboardEntry,
    awardedSpeedBonus: computed.gotSpeedBonus,
  };
}

export async function resetLeaderboard(): Promise<void> {
  if (!isSupabaseConfigured) {
    writeLocalEntries([createControlRow(false)]);
    return;
  }

  const { error: deleteError } = await supabase
    .from(LEADERBOARD_TABLE)
    .delete()
    .neq('nickname', QUIZ_STATE_NICKNAME);

  if (deleteError) {
    throw new Error(deleteError.message || 'Failed to reset leaderboard');
  }

  await ensureSupabaseControlRow();

  const { error: resetStateError } = await supabase
    .from(LEADERBOARD_TABLE)
    .update({ is_finished: false, finished_at: null, score: 0 })
    .eq('nickname', QUIZ_STATE_NICKNAME);

  if (resetStateError) {
    throw new Error(resetStateError.message || 'Failed to reset quiz state');
  }
}

export function subscribeToLeaderboard(
  onLeaderboardUpdate: (snapshot: LeaderboardSnapshot) => void,
): () => void {
  let isActive = true;

  const refresh = async () => {
    try {
      const latest = await fetchLeaderboardState();
      if (isActive) {
        onLeaderboardUpdate(latest);
      }
    } catch {
      // Transient fetch errors are surfaced via explicit actions
    }
  };

  if (!isSupabaseConfigured) {
    const handleLocalUpdate = () => {
      void refresh();
    };
    localListeners.add(handleLocalUpdate);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_KEY) {
        void refresh();
      }
    };
    window.addEventListener('storage', handleStorage);

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.onmessage = () => {
        void refresh();
      };
    }

    return () => {
      isActive = false;
      localListeners.delete(handleLocalUpdate);
      window.removeEventListener('storage', handleStorage);
      channel?.close();
    };
  }

  const channel = supabase
    .channel('leaderboard-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: LEADERBOARD_TABLE,
      },
      () => {
        void refresh();
      },
    )
    .subscribe();

  return () => {
    isActive = false;
    void supabase.removeChannel(channel);
  };
}
