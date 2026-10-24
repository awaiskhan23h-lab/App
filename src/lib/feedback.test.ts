import { describe, expect, it } from 'vitest';
import { demoReply } from './coach';
import { analyse, findIssues, type Turn } from './feedback';
import { SCENARIOS } from './scenarios';

const raise = SCENARIOS.find((s) => s.id === 'raise')!;
const user = (text: string): Turn => ({ role: 'user', text });

describe('findIssues', () => {
  it('spots hedges, apologies, fillers and absolutes with the sentence they came from', () => {
    const issues = findIssues('Sorry, I was just wondering. Um, you never listen!');
    expect(issues.map((i) => i.kind).sort()).toEqual(['absolute', 'apology', 'filler', 'hedge']);
    expect(issues.find((i) => i.kind === 'absolute')!.quote).toBe('Um, you never listen!');
  });
});

describe('analyse', () => {
  it('rewards a direct, specific ask', () => {
    const fb = analyse(
      [
        user('I want to talk about my salary. I led the client renewal worth two million.'),
        user('I am asking for a raise to 72k, which matches the market rate. Can we agree that?'),
      ],
      raise,
    );
    expect(fb.madeClearAsk).toBe(true);
    expect(fb.score).toBe(100);
    expect(fb.strongestLine).toMatch(/72k/);
  });

  it('penalises a vague, apologetic attempt and explains why', () => {
    const fb = analyse(
      [user('Sorry, I was just wondering if maybe I could get a bit more money?'), user('Sorry, I guess it is fine.')],
      raise,
    );
    expect(fb.madeClearAsk).toBe(false);
    expect(fb.score).toBeLessThan(70);
    expect(fb.tips.join(' ')).toMatch(/clear ask/);
  });
});

describe('demoReply', () => {
  it('moves from resisting to closing and finishes the conversation', () => {
    const turns: Turn[] = [{ role: 'ai', text: raise.opener }];
    let done = false;
    for (let i = 0; i < 12 && !done; i++) {
      turns.push(user('I have delivered a lot this year and I would like to discuss my pay.'));
      const r = demoReply(raise, 'easy', turns);
      turns.push({ role: 'ai', text: r.text });
      done = r.done;
    }
    expect(done).toBe(true);
    expect(turns.at(-1)!.text).toBe(raise.demo.close[0]);
  });

  it('pushes back when the user sounds unsure', () => {
    const r = demoReply(raise, 'realistic', [user('Sorry, I was just maybe thinking about money.')]);
    expect(raise.demo.exploit).toContain(r.text);
  });
});
