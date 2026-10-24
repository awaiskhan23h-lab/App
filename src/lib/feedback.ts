import type { Scenario } from './scenarios';

export interface Turn {
  role: 'user' | 'ai';
  text: string;
}

export type IssueKind = 'filler' | 'hedge' | 'apology' | 'absolute';

export interface Issue {
  kind: IssueKind;
  phrase: string;
  /** The user's sentence it appeared in, for quoting back. */
  quote: string;
}

export interface Feedback {
  score: number;
  madeClearAsk: boolean | null; // null when the scenario has no single ask
  questionsAsked: number;
  avgWords: number;
  issues: Issue[];
  strongestLine: string | null;
  tips: string[];
  tooShort: boolean;
}

const PATTERNS: Record<IssueKind, RegExp> = {
  filler: /\b(um+|uh+|erm+|er|you know|basically|literally|i mean)\b/gi,
  hedge:
    /\b(i think|maybe|perhaps|kind of|sort of|i guess|just|possibly|i was wondering|hopefully|a little bit|if that'?s ok(ay)?|if possible|i feel like)\b/gi,
  apology: /\b(sorry|apologi[sz]e|my bad)\b/gi,
  absolute: /\b(you always|you never|every single time|nobody ever|you constantly)\b/gi,
};

const TIP: Record<IssueKind, string> = {
  filler: 'Filler words make you sound less sure. Pausing silently sounds more confident than “um”.',
  hedge: 'Hedges like “just”, “maybe” and “I think” water down your point. Say it directly.',
  apology: 'Don’t apologise for asking. It signals that you think the request is unreasonable.',
  absolute: '“You always / you never” makes people defensive. Describe a specific moment instead.',
};

export function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function findIssues(text: string): Issue[] {
  const issues: Issue[] = [];
  for (const sentence of sentences(text)) {
    for (const kind of Object.keys(PATTERNS) as IssueKind[]) {
      for (const m of sentence.matchAll(PATTERNS[kind])) {
        issues.push({ kind, phrase: m[0].toLowerCase(), quote: sentence });
      }
    }
  }
  return issues;
}

/** True when a single message sounds unsure: the demo coach pushes harder on these. */
export function soundsUnsure(text: string): boolean {
  return findIssues(text).filter((i) => i.kind === 'hedge' || i.kind === 'apology').length >= 2;
}

const words = (t: string) => t.split(/\s+/).filter(Boolean).length;

export function analyse(turns: Turn[], scenario: Scenario): Feedback {
  const said = turns.filter((t) => t.role === 'user').map((t) => t.text);
  const issues = said.flatMap(findIssues);
  const count = (k: IssueKind) => issues.filter((i) => i.kind === k).length;

  const madeClearAsk = scenario.askPattern ? said.some((t) => scenario.askPattern!.test(t)) : null;
  const questionsAsked = said.filter((t) => t.includes('?')).length;
  const avgWords = said.length ? Math.round(said.reduce((s, t) => s + words(t), 0) / said.length) : 0;
  const tooShort = said.length < 2;

  let score = 100;
  score -= Math.min(20, count('filler') * 4);
  score -= Math.min(25, count('hedge') * 5);
  score -= Math.min(18, Math.max(0, count('apology') - 1) * 6);
  score -= Math.min(16, count('absolute') * 8);
  if (madeClearAsk === false) score -= 15;
  if (avgWords > 70) score -= 10;
  if (said.length && avgWords < 5) score -= 10;
  if (questionsAsked > 0) score += 5;
  if (said.length === 0) score = 0;
  score = Math.max(0, Math.min(100, score));

  const tips: string[] = [];
  if (madeClearAsk === false && scenario.askHint) tips.push(`You never made a clear ask. ${scenario.askHint}`);
  for (const kind of ['hedge', 'apology', 'filler', 'absolute'] as IssueKind[]) {
    if (count(kind) > (kind === 'apology' ? 1 : 0)) tips.push(TIP[kind]);
  }
  if (avgWords > 70) tips.push('Your turns were long. Make your point in two or three sentences, then stop and listen.');
  if (said.length && avgWords < 5) tips.push('Your answers were very short. Explain your reasoning so they can say yes.');
  if (questionsAsked === 0 && said.length >= 2)
    tips.push('Try asking a question. Understanding their side makes it easier to get what you want.');
  if (tips.length === 0) tips.push('Clear, calm and direct. Try the tough difficulty next.');

  // Strongest line: the longest sentence with no issues, preferring one that makes the ask.
  const clean = said
    .flatMap(sentences)
    .filter((s) => words(s) >= 5 && findIssues(s).length === 0)
    .sort(
      (a, b) =>
        Number(scenario.askPattern?.test(b) ?? 0) - Number(scenario.askPattern?.test(a) ?? 0) ||
        words(b) - words(a),
    );

  return {
    score,
    madeClearAsk,
    questionsAsked,
    avgWords,
    issues,
    strongestLine: clean[0] ?? null,
    tips,
    tooShort,
  };
}
