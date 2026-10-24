import { describe, expect, it } from 'vitest';
import { computeBalances, expenseShares, parseAmount, settleUp } from './money';
import type { Group } from './types';

const group = (overrides: Partial<Group> = {}): Group => ({
  id: 'g',
  name: 'Trip',
  currency: 'USD',
  members: [
    { id: 'a', name: 'Ann' },
    { id: 'b', name: 'Bo' },
    { id: 'c', name: 'Cy' },
  ],
  expenses: [],
  settlements: [],
  createdAt: 0,
  ...overrides,
});

describe('parseAmount', () => {
  it('parses valid amounts into cents', () => {
    expect(parseAmount('12')).toBe(1200);
    expect(parseAmount('12.5')).toBe(1250);
    expect(parseAmount('1,234.56')).toBe(123456);
    expect(parseAmount('0.07')).toBe(7);
  });
  it('rejects invalid input', () => {
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('1.234')).toBeNull();
    expect(parseAmount('-5')).toBeNull();
  });
});

describe('expenseShares', () => {
  it('splits equally and distributes leftover cents', () => {
    const shares = expenseShares({
      id: 'e', description: '', amount: 1000, paidBy: 'a', date: '',
      split: { type: 'equal', among: ['a', 'b', 'c'] },
    });
    expect(Object.values(shares).reduce((s, v) => s + v, 0)).toBe(1000);
    expect(shares).toEqual({ a: 334, b: 333, c: 333 });
  });
});

describe('computeBalances + settleUp', () => {
  it('nets out expenses and settlements', () => {
    const g = group({
      expenses: [
        { id: '1', description: 'Dinner', amount: 9000, paidBy: 'a', date: '',
          split: { type: 'equal', among: ['a', 'b', 'c'] } },
        { id: '2', description: 'Taxi', amount: 3000, paidBy: 'b', date: '',
          split: { type: 'exact', shares: { b: 1000, c: 2000 } } },
      ],
    });
    const balances = computeBalances(g);
    expect(balances).toEqual({ a: 6000, b: -1000, c: -5000 });
    expect(Object.values(balances).reduce((s, v) => s + v, 0)).toBe(0);

    const transfers = settleUp(balances);
    expect(transfers).toEqual([
      { from: 'c', to: 'a', amount: 5000 },
      { from: 'b', to: 'a', amount: 1000 },
    ]);

    const settled = group({
      ...g,
      settlements: transfers.map((t, i) => ({ id: String(i), date: '', ...t })),
    });
    expect(Object.values(computeBalances(settled)).every((b) => b === 0)).toBe(true);
  });

  it('returns no transfers when everyone is even', () => {
    expect(settleUp({ a: 0, b: 0 })).toEqual([]);
  });
});
