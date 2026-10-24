import { soundsUnsure, type Turn } from './feedback';
import type { Difficulty, Scenario } from './scenarios';

export interface CoachReply {
  text: string;
  /** True when the other person has wrapped the conversation up. */
  done: boolean;
}

/**
 * Plays the other person in a conversation. The demo coach below is scripted;
 * a real AI coach (e.g. Claude behind a small server) can implement the same interface.
 */
export interface Coach {
  reply(scenario: Scenario, difficulty: Difficulty, turns: Turn[]): Promise<CoachReply>;
}

// How many user turns the persona resists, then probes, before softening.
const PHASES: Record<Difficulty, { resist: number; probe: number }> = {
  easy: { resist: 1, probe: 1 },
  realistic: { resist: 2, probe: 2 },
  tough: { resist: 3, probe: 3 },
};

const pick = (lines: string[], i: number) => lines[i % lines.length];

/** Picks the next scripted line for the conversation so far. Pure, so it's easy to test. */
export function demoReply(scenario: Scenario, difficulty: Difficulty, turns: Turn[]): CoachReply {
  const userTurns = turns.filter((t) => t.role === 'user');
  const n = userTurns.length;
  const last = userTurns[n - 1]?.text ?? '';
  const said = new Set(turns.filter((t) => t.role === 'ai').map((t) => t.text));
  const fresh = (lines: string[]) => lines.find((l) => !said.has(l)) ?? pick(lines, n);
  const d = scenario.demo;

  if (last.split(/\s+/).filter(Boolean).length < 3) {
    return { text: 'Sorry, can you say a bit more about what you mean?', done: false };
  }
  if (soundsUnsure(last) && d.exploit.some((l) => !said.has(l))) {
    return { text: fresh(d.exploit), done: false };
  }
  const askedBefore = userTurns.slice(0, -1).some((t) => scenario.askPattern?.test(t.text));
  if (scenario.askPattern?.test(last) && !askedBefore) {
    return { text: fresh(d.onAsk), done: false };
  }

  const { resist, probe } = PHASES[difficulty];
  if (n <= resist) return { text: fresh(d.resist), done: false };
  if (n <= resist + probe) return { text: fresh(d.probe), done: false };
  if (d.soften.some((l) => !said.has(l))) return { text: fresh(d.soften), done: false };
  return { text: fresh(d.close), done: true };
}

export const demoCoach: Coach = {
  async reply(scenario, difficulty, turns) {
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 700));
    return demoReply(scenario, difficulty, turns);
  },
};
