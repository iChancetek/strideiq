import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'strideiq_local_db';
const DB_VERSION = 2;

export interface JournalDraft {
  id: string; // Temporary or actual ID
  title: string;
  content: string;
  type?: string;
  userId?: string;
  media: any[];
  mood?: string;
  updatedAt: string;
  synced: boolean;
}

export type ActiveSession = 
  | {
      type: 'run';
      startTime: string;
      data: {
        totalPausedMs: number;
        distanceKm: number;
        steps: number;
        mode: string;
        environment: string;
        path?: [number, number][]; // Persist the coordinates trace
        mileSplits?: any[];
        lastMileActiveTime?: number;
        lastMileCompleted?: number;
        heartRate?: number;
      }; 
      lastHeartbeat: string;
    }
  | {
      type: 'fasting';
      startTime: string;
      status: 'active' | 'paused' | 'completed';
      goal: number;
    }
  | {
      type: 'meditation';
      startTime: string;
      trackId: string;
      durationMinutes: number;
    };

export interface SyncAction {
  id: string;
  type: string; // e.g., 'SAVE_JOURNAL', 'SAVE_ACTIVITY'
  payload: any;
  timestamp: string;
  retryCount: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

export const getDB = () => {
  if (typeof window === 'undefined') return null;
  
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Journal Drafts
        if (!db.objectStoreNames.contains('journals')) {
          const journalStore = db.createObjectStore('journals', { keyPath: 'id' });
          journalStore.createIndex('synced', 'synced');
          journalStore.createIndex('updatedAt', 'updatedAt');
        }

        // Active Sessions
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'type' });
        }

        // Sync Queue
        if (!db.objectStoreNames.contains('sync_queue')) {
          db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
        }

        // Daily Steps
        if (!db.objectStoreNames.contains('daily_steps')) {
          db.createObjectStore('daily_steps', { keyPath: 'date' });
        }
      },
    });
  }
  return dbPromise;
};

// --- Daily Steps Helpers ---
export async function saveDailySteps(date: string, steps: number) {
  const db = await getDB();
  if (!db) return;
  return db.put('daily_steps', { date, steps, lastUpdated: new Date().toISOString() });
}

export async function getDailySteps(date: string): Promise<number> {
  const db = await getDB();
  if (!db) return 0;
  const entry = await db.get('daily_steps', date);
  return entry?.steps || 0;
}

// --- Journal Helpers ---
export async function saveLocalJournal(entry: JournalDraft) {
  const db = await getDB();
  if (!db) return;
  return db.put('journals', entry);
}

export async function getLocalJournals() {
  const db = await getDB();
  if (!db) return [];
  return db.getAll('journals');
}

export async function deleteLocalJournal(id: string) {
  const db = await getDB();
  if (!db) return;
  return db.delete('journals', id);
}

// --- Session Helpers ---
export async function saveActiveSession(session: ActiveSession) {
  const db = await getDB();
  if (!db) return;
  return db.put('sessions', session);
}

export async function getActiveSession<T extends 'run' | 'fasting' | 'meditation'>(type: T): Promise<Extract<ActiveSession, { type: T }> | null> {
  const db = await getDB();
  if (!db) return null;
  return db.get('sessions', type) as any;
}

export async function clearActiveSession(type: 'run' | 'fasting' | 'meditation') {
  const db = await getDB();
  if (!db) return;
  return db.delete('sessions', type);
}

// --- Sync Queue Helpers ---
export async function addToSyncQueue(action: Omit<SyncAction, 'id' | 'retryCount'>) {
  const db = await getDB();
  if (!db) return;
  return db.add('sync_queue', { ...action, retryCount: 0 });
}

export async function getSyncQueue() {
  const db = await getDB();
  if (!db) return [];
  return db.getAll('sync_queue');
}

export async function removeFromSyncQueue(id: string) {
  const db = await getDB();
  if (!db) return;
  return db.delete('sync_queue', id);
}
