/** All money values are integer cents to avoid floating-point drift. */
export type Cents = number;

export interface Member {
  id: string;
  name: string;
}

export type Split =
  | { type: 'equal'; among: string[] }
  | { type: 'exact'; shares: Record<string, Cents> };

export interface Expense {
  id: string;
  description: string;
  amount: Cents;
  paidBy: string;
  split: Split;
  date: string; // YYYY-MM-DD
}

export interface Settlement {
  id: string;
  from: string;
  to: string;
  amount: Cents;
  date: string;
}

export interface Group {
  id: string;
  name: string;
  currency: string;
  members: Member[];
  expenses: Expense[];
  settlements: Settlement[];
  createdAt: number;
}

export interface Transfer {
  from: string;
  to: string;
  amount: Cents;
}
