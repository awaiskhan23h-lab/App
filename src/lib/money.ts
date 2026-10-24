import type { Cents, Expense, Group, Transfer } from './types';

/** Parse user input like "12.5" or "1,234.56" into cents. Returns null if invalid. */
export function parseAmount(input: string): Cents | null {
  const cleaned = input.replace(/[,\s]/g, '');
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const [whole, frac = ''] = cleaned.split('.');
  return Number(whole) * 100 + Number(frac.padEnd(2, '0'));
}

export function formatAmount(cents: Cents, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

/**
 * How much each member owes for an expense. Equal splits hand out leftover
 * cents one at a time so the shares always sum to the exact total.
 */
export function expenseShares(expense: Expense): Record<string, Cents> {
  if (expense.split.type === 'exact') return { ...expense.split.shares };

  const among = expense.split.among;
  if (among.length === 0) return {};
  const base = Math.floor(expense.amount / among.length);
  let remainder = expense.amount - base * among.length;
  const shares: Record<string, Cents> = {};
  for (const id of among) {
    shares[id] = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
  }
  return shares;
}

/** Net balance per member: positive means they are owed money, negative means they owe. */
export function computeBalances(group: Group): Record<string, Cents> {
  const balances: Record<string, Cents> = {};
  for (const m of group.members) balances[m.id] = 0;
  const add = (id: string, delta: Cents) => {
    balances[id] = (balances[id] ?? 0) + delta;
  };

  for (const e of group.expenses) {
    add(e.paidBy, e.amount);
    for (const [id, share] of Object.entries(expenseShares(e))) add(id, -share);
  }
  for (const s of group.settlements) {
    add(s.from, s.amount);
    add(s.to, -s.amount);
  }
  return balances;
}

/**
 * Greedy settle-up: repeatedly match the biggest debtor with the biggest
 * creditor. Produces at most n-1 transfers for n members with non-zero balance.
 */
export function settleUp(balances: Record<string, Cents>): Transfer[] {
  const debtors = Object.entries(balances)
    .filter(([, b]) => b < 0)
    .map(([id, b]) => ({ id, amt: -b }));
  const creditors = Object.entries(balances)
    .filter(([, b]) => b > 0)
    .map(([id, b]) => ({ id, amt: b }));

  const transfers: Transfer[] = [];
  while (debtors.length && creditors.length) {
    debtors.sort((a, b) => b.amt - a.amt);
    creditors.sort((a, b) => b.amt - a.amt);
    const d = debtors[0];
    const c = creditors[0];
    const amount = Math.min(d.amt, c.amt);
    transfers.push({ from: d.id, to: c.id, amount });
    d.amt -= amount;
    c.amt -= amount;
    if (d.amt === 0) debtors.shift();
    if (c.amt === 0) creditors.shift();
  }
  return transfers;
}

export function groupTotal(group: Group): Cents {
  return group.expenses.reduce((sum, e) => sum + e.amount, 0);
}

/** True if the member appears in any expense or settlement and so can't be removed safely. */
export function memberInUse(group: Group, memberId: string): boolean {
  return (
    group.expenses.some(
      (e) =>
        e.paidBy === memberId ||
        (e.split.type === 'equal' ? e.split.among.includes(memberId) : memberId in e.split.shares),
    ) || group.settlements.some((s) => s.from === memberId || s.to === memberId)
  );
}
