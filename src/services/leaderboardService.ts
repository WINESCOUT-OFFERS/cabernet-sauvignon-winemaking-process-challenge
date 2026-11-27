import {
  LEADERBOARD_TABLE,
  isSupabaseConfigured,
  supabase,
} from '../supabaseClient';
import {
  computeSubmissionUpdate,
  sortLeaderboard,
  type LeaderboardEntry,
} from '../utils/quizLogic';

const LOCAL_STORAGE_KEY = 'cabernet_challenge_leaderboard_v1';
const LOCAL_INIT_KEY = 'cabernet_challenge_initialized_v1';
const BROADCAST_CHANNEL_NAME = 'cabernet_challenge_leaderboard_channel';

const localListeners = new Set<() => void>();

function createInitialSeedEntries(): LeaderboardEntry[] {
  const now = Date.now();
  return [
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
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
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

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured) {
    return sortLeaderboard(readLocalEntries());
  }

  const { data, error } = await supabase.from(LEADERBOARD_TABLE).select('*');
  if (error) {
    throw new Error(error.message || 'Failed to load leaderboard');
  }
  return sortLeaderboard((data ?? []) as LeaderboardEntry[]);
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
      ? entries.some((item) => item.got_speed_bonus === true)
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
    writeLocalEntries([]);
    return;
  }

  const { error } = await supabase
    .from(LEADERBOARD_TABLE)
    .delete()
    .not('id', 'is', null);

  if (error) {
    throw new Error(error.message || 'Failed to reset leaderboard');
  }
}

export function subscribeToLeaderboard(
  onLeaderboardUpdate: (entries: LeaderboardEntry[]) => void,
): () => void {
  let isActive = true;

  const refresh = async () => {
    try {
      const latest = await fetchLeaderboard();
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
