import { useEffect, useState } from 'react';
import type { Group } from './types';

const KEY = 'split-it:groups:v1';

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export const today = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Saved groups, or `firstRun()` when nothing has ever been saved on this device. */
function load(firstRun: () => Group[]): Group[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw === null ? firstRun() : (JSON.parse(raw) as Group[]);
  } catch {
    return firstRun();
  }
}

/** Groups persisted to localStorage on every change. */
export function useGroups(firstRun: () => Group[] = () => []) {
  const [groups, setGroups] = useState<Group[]>(() => load(firstRun));

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(groups));
    } catch {
      // Storage full or blocked; the app keeps working in memory.
    }
  }, [groups]);

  const updateGroup = (id: string, fn: (g: Group) => Group) =>
    setGroups((gs) => gs.map((g) => (g.id === id ? fn(g) : g)));

  return { groups, setGroups, updateGroup };
}

export function isGroupArray(data: unknown): data is Group[] {
  return (
    Array.isArray(data) &&
    data.every(
      (g) =>
        g &&
        typeof g.id === 'string' &&
        typeof g.name === 'string' &&
        Array.isArray(g.members) &&
        Array.isArray(g.expenses) &&
        Array.isArray(g.settlements),
    )
  );
}
