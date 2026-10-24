import { uid } from './store';
import type { Cents, Expense, Group, Split } from './types';

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Build a group from member names; expenses reference members by name for readability. */
function build(
  name: string,
  currency: string,
  names: string[],
  expenses: {
    description: string;
    amount: Cents;
    paidBy: string;
    among?: string[];
    exact?: Record<string, Cents>;
    daysAgo: number;
  }[],
  createdOffset: number,
): Group {
  const members = names.map((n) => ({ id: uid(), name: n }));
  const id = (n: string) => members.find((m) => m.name === n)!.id;

  return {
    id: uid(),
    name,
    currency,
    members,
    expenses: expenses.map((e): Expense => {
      const split: Split = e.exact
        ? {
            type: 'exact',
            shares: Object.fromEntries(Object.entries(e.exact).map(([n, c]) => [id(n), c])),
          }
        : { type: 'equal', among: (e.among ?? names).map(id) };
      return {
        id: uid(),
        description: e.description,
        amount: e.amount,
        paidBy: id(e.paidBy),
        split,
        date: daysAgo(e.daysAgo),
      };
    }),
    settlements: [],
    createdAt: Date.now() - createdOffset,
  };
}

/** Example groups shown on first launch so new visitors can see the app in action. */
export function sampleGroups(): Group[] {
  return [
    build(
      'Barcelona Weekend',
      'EUR',
      ['Emma', 'Liam', 'Sofia', 'Noah'],
      [
        { description: 'Airbnb (2 nights)', amount: 48000, paidBy: 'Emma', daysAgo: 12 },
        { description: 'Airport taxi', amount: 4250, paidBy: 'Noah', daysAgo: 12 },
        { description: 'Tapas dinner', amount: 13640, paidBy: 'Liam', daysAgo: 11 },
        {
          description: 'Sagrada Família tickets',
          amount: 10400,
          paidBy: 'Sofia',
          among: ['Emma', 'Sofia', 'Noah', 'Liam'],
          daysAgo: 10,
        },
      ],
      3,
    ),
    build(
      'London Flat',
      'GBP',
      ['Olivia', 'Jack', 'Amelia'],
      [
        { description: 'Electricity bill', amount: 9630, paidBy: 'Olivia', daysAgo: 20 },
        { description: 'Broadband', amount: 3500, paidBy: 'Jack', daysAgo: 18 },
        { description: 'Weekly groceries', amount: 7485, paidBy: 'Amelia', daysAgo: 5 },
        { description: 'Cleaning supplies', amount: 1820, paidBy: 'Jack', daysAgo: 2 },
      ],
      2,
    ),
    build(
      'New York Road Trip',
      'USD',
      ['Ava', 'Ethan', 'Mia', 'Lucas'],
      [
        { description: 'Rental car', amount: 31200, paidBy: 'Ethan', daysAgo: 30 },
        { description: 'Gas', amount: 8640, paidBy: 'Ava', daysAgo: 29 },
        {
          description: 'Diner breakfast',
          amount: 5800,
          paidBy: 'Mia',
          exact: { Ava: 1450, Ethan: 1200, Mia: 1625, Lucas: 1525 },
          daysAgo: 29,
        },
        { description: 'Hotel in Manhattan', amount: 38900, paidBy: 'Lucas', daysAgo: 28 },
      ],
      1,
    ),
  ];
}
