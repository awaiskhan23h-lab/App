import { useEffect, useState } from 'react';
import type { Turn } from './feedback';
import type { Difficulty } from './scenarios';

export interface Session {
  id: string;
  scenarioId: string;
  title: string;
  emoji: string;
  difficulty: Difficulty;
  date: number;
  turns: Turn[];
  score: number;
  /** Set for custom scenarios so they can be rebuilt when reviewing. */
  custom?: { who: string; goal: string };
}

export interface Settings {
  voiceReplies: boolean;
}

const KEY = 'rehearse:v1';

interface Saved {
  sessions: Session[];
  settings: Settings;
}

const empty: Saved = { sessions: [], settings: { voiceReplies: true } };

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...empty, ...(JSON.parse(raw) as Saved) } : empty;
  } catch {
    return empty;
  }
}

/** Practice history and settings, persisted on this device. */
export function useSaved() {
  const [saved, setSaved] = useState<Saved>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(saved));
    } catch {
      // Storage full or blocked; keep working in memory.
    }
  }, [saved]);

  return {
    sessions: saved.sessions,
    settings: saved.settings,
    addSession: (s: Session) => setSaved((v) => ({ ...v, sessions: [s, ...v.sessions] })),
    clearSessions: () => setSaved((v) => ({ ...v, sessions: [] })),
    setSettings: (s: Settings) => setSaved((v) => ({ ...v, settings: s })),
  };
}
