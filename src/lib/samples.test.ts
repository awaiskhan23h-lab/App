import { describe, expect, it } from 'vitest';
import { computeBalances } from './money';
import { sampleGroups } from './samples';

describe('sampleGroups', () => {
  it('only uses USD, EUR and GBP', () => {
    expect(sampleGroups().map((g) => g.currency).sort()).toEqual(['EUR', 'GBP', 'USD']);
  });

  it('has consistent data: exact splits add up and balances net to zero', () => {
    for (const g of sampleGroups()) {
      for (const e of g.expenses) {
        if (e.split.type === 'exact') {
          expect(Object.values(e.split.shares).reduce((s, v) => s + v, 0)).toBe(e.amount);
        }
      }
      expect(Object.values(computeBalances(g)).reduce((s, v) => s + v, 0)).toBe(0);
    }
  });
});
