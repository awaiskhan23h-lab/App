import { useState } from 'react';
import {
  computeBalances,
  expenseShares,
  formatAmount,
  groupTotal,
  memberInUse,
  settleUp,
} from '../lib/money';
import { today, uid } from '../lib/store';
import type { Expense, Group, Transfer } from '../lib/types';
import { ExpenseForm } from './ExpenseForm';
import { Modal } from './Modal';

type Tab = 'expenses' | 'balances' | 'members';

export function GroupView({
  group,
  onChange,
  onDelete,
  onBack,
}: {
  group: Group;
  onChange: (fn: (g: Group) => Group) => void;
  onDelete: () => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<Tab>('expenses');
  const [editing, setEditing] = useState<Expense | 'new' | null>(null);
  const [settling, setSettling] = useState<Transfer | null>(null);

  const name = (id: string) => group.members.find((m) => m.id === id)?.name ?? 'Unknown';
  const fmt = (c: number) => formatAmount(c, group.currency);
  const balances = computeBalances(group);
  const transfers = settleUp(balances);

  const saveExpense = (e: Expense) => {
    onChange((g) => ({
      ...g,
      expenses: g.expenses.some((x) => x.id === e.id)
        ? g.expenses.map((x) => (x.id === e.id ? e : x))
        : [...g.expenses, e],
    }));
    setEditing(null);
  };

  // Expenses and settlements interleaved, newest first.
  const activity = [
    ...group.expenses.map((e) => ({ kind: 'expense' as const, date: e.date, item: e })),
    ...group.settlements.map((s) => ({ kind: 'settlement' as const, date: s.date, item: s })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="page">
      <header className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label="Back to groups">
          ←
        </button>
        <div className="grow">
          <h1>{group.name}</h1>
          <p className="muted">
            {group.members.length} people · {fmt(groupTotal(group))} total
          </p>
        </div>
      </header>

      <nav className="tabs">
        {(['expenses', 'balances', 'members'] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
            {t === 'balances' && transfers.length > 0 && <span className="badge">{transfers.length}</span>}
          </button>
        ))}
      </nav>

      {tab === 'expenses' && (
        <section>
          {group.members.length === 0 ? (
            <Empty text="Add some people in the Members tab first." />
          ) : activity.length === 0 ? (
            <Empty text="No expenses yet. Tap + to add the first one." />
          ) : (
            <ul className="list">
              {activity.map((a) =>
                a.kind === 'expense' ? (
                  <li key={a.item.id}>
                    <button className="list-item" onClick={() => setEditing(a.item)}>
                      <div className="date">{shortDate(a.date)}</div>
                      <div className="grow">
                        <strong>{a.item.description}</strong>
                        <p className="muted">
                          {name(a.item.paidBy)} paid · split{' '}
                          {Object.keys(expenseShares(a.item)).length} ways
                        </p>
                      </div>
                      <div className="amount">{fmt(a.item.amount)}</div>
                    </button>
                  </li>
                ) : (
                  <li key={a.item.id}>
                    <div className="list-item settlement">
                      <div className="date">{shortDate(a.date)}</div>
                      <div className="grow">
                        <strong>
                          {name(a.item.from)} paid {name(a.item.to)}
                        </strong>
                        <p className="muted">Settlement</p>
                      </div>
                      <div className="amount pos">{fmt(a.item.amount)}</div>
                      <button
                        className="icon-btn"
                        aria-label="Undo settlement"
                        title="Undo"
                        onClick={() =>
                          onChange((g) => ({
                            ...g,
                            settlements: g.settlements.filter((s) => s.id !== a.item.id),
                          }))
                        }
                      >
                        ↺
                      </button>
                    </div>
                  </li>
                ),
              )}
            </ul>
          )}
          {group.members.length > 0 && (
            <button className="fab" onClick={() => setEditing('new')} aria-label="Add expense">
              +
            </button>
          )}
        </section>
      )}

      {tab === 'balances' && (
        <section>
          <ul className="list">
            {group.members.map((m) => {
              const b = balances[m.id] ?? 0;
              return (
                <li key={m.id} className="list-item">
                  <Avatar name={m.name} />
                  <div className="grow">
                    <strong>{m.name}</strong>
                  </div>
                  <div className={`amount ${b > 0 ? 'pos' : b < 0 ? 'neg' : ''}`}>
                    {b === 0 ? 'settled' : `${b > 0 ? 'gets back' : 'owes'} ${fmt(Math.abs(b))}`}
                  </div>
                </li>
              );
            })}
          </ul>

          <h3 className="section-title">Settle up</h3>
          {transfers.length === 0 ? (
            <Empty text="Everyone is even. 🎉" />
          ) : (
            <ul className="list">
              {transfers.map((t) => (
                <li key={`${t.from}-${t.to}`} className="list-item">
                  <div className="grow">
                    <strong>{name(t.from)}</strong> → <strong>{name(t.to)}</strong>
                    <p className="muted">{fmt(t.amount)}</p>
                  </div>
                  <button className="btn primary small" onClick={() => setSettling(t)}>
                    Record
                  </button>
                </li>
              ))}
            </ul>
          )}
          {transfers.length > 0 && (
            <button className="btn ghost full" onClick={() => shareSummary(group, transfers, name)}>
              Share summary
            </button>
          )}
        </section>
      )}

      {tab === 'members' && (
        <MembersTab group={group} onChange={onChange} onDelete={onDelete} />
      )}

      {editing && (
        <ExpenseForm
          group={group}
          expense={editing === 'new' ? undefined : editing}
          onSave={saveExpense}
          onDelete={
            editing === 'new'
              ? undefined
              : () => {
                  if (!confirm('Delete this expense?')) return;
                  onChange((g) => ({ ...g, expenses: g.expenses.filter((x) => x.id !== editing.id) }));
                  setEditing(null);
                }
          }
          onClose={() => setEditing(null)}
        />
      )}

      {settling && (
        <Modal title="Record payment" onClose={() => setSettling(null)}>
          <p>
            Confirm that <strong>{name(settling.from)}</strong> paid{' '}
            <strong>{name(settling.to)}</strong> {fmt(settling.amount)}?
          </p>
          <div className="actions">
            <span className="spacer" />
            <button className="btn ghost" onClick={() => setSettling(null)}>
              Cancel
            </button>
            <button
              className="btn primary"
              onClick={() => {
                onChange((g) => ({
                  ...g,
                  settlements: [...g.settlements, { id: uid(), date: today(), ...settling }],
                }));
                setSettling(null);
              }}
            >
              Mark as paid
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function MembersTab({
  group,
  onChange,
  onDelete,
}: {
  group: Group;
  onChange: (fn: (g: Group) => Group) => void;
  onDelete: () => void;
}) {
  const [newName, setNewName] = useState('');

  const add = () => {
    const n = newName.trim();
    if (!n) return;
    onChange((g) => ({ ...g, members: [...g.members, { id: uid(), name: n }] }));
    setNewName('');
  };

  return (
    <section>
      <ul className="list">
        {group.members.map((m) => (
          <li key={m.id} className="list-item">
            <Avatar name={m.name} />
            <input
              className="inline-input grow"
              value={m.name}
              aria-label="Member name"
              onChange={(e) =>
                onChange((g) => ({
                  ...g,
                  members: g.members.map((x) => (x.id === m.id ? { ...x, name: e.target.value } : x)),
                }))
              }
            />
            <button
              className="icon-btn"
              aria-label={`Remove ${m.name}`}
              disabled={memberInUse(group, m.id)}
              title={memberInUse(group, m.id) ? 'Used in expenses, so it can’t be removed' : 'Remove'}
              onClick={() =>
                onChange((g) => ({ ...g, members: g.members.filter((x) => x.id !== m.id) }))
              }
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <form
        className="add-row"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Add a person" />
        <button className="btn primary">Add</button>
      </form>

      <h3 className="section-title">Group settings</h3>
      <div className="form">
        <label>
          Group name
          <input value={group.name} onChange={(e) => onChange((g) => ({ ...g, name: e.target.value }))} />
        </label>
        <label>
          Currency
          <select value={group.currency} onChange={(e) => onChange((g) => ({ ...g, currency: e.target.value }))}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <button
          className="btn danger"
          onClick={() => confirm(`Delete “${group.name}” and all its expenses?`) && onDelete()}
        >
          Delete group
        </button>
      </div>
    </section>
  );
}

export const CURRENCIES = ['USD', 'EUR', 'GBP'];

export function Avatar({ name }: { name: string }) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return (
    <span className="avatar" style={{ background: `hsl(${hash} 55% 50%)` }} aria-hidden>
      {name.trim()[0]?.toUpperCase() ?? '?'}
    </span>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="empty">{text}</p>;
}

function shortDate(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function shareSummary(group: Group, transfers: Transfer[], name: (id: string) => string) {
  const lines = [
    `${group.name}: settle up`,
    ...transfers.map((t) => `• ${name(t.from)} → ${name(t.to)}: ${formatAmount(t.amount, group.currency)}`),
  ];
  const text = lines.join('\n');
  if (navigator.share) {
    navigator.share({ text }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(text).then(
      () => alert('Summary copied to clipboard.'),
      () => alert(text),
    );
  }
}
