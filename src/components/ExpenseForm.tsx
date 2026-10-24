import { useState, type FormEvent } from 'react';
import { formatAmount, parseAmount } from '../lib/money';
import { today, uid } from '../lib/store';
import type { Cents, Expense, Group } from '../lib/types';
import { Modal } from './Modal';

const centsToInput = (c: Cents) => (c / 100).toFixed(2);

export function ExpenseForm({
  group,
  expense,
  onSave,
  onDelete,
  onClose,
}: {
  group: Group;
  expense?: Expense;
  onSave: (e: Expense) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const memberIds = group.members.map((m) => m.id);
  const [description, setDescription] = useState(expense?.description ?? '');
  const [amount, setAmount] = useState(expense ? centsToInput(expense.amount) : '');
  const [paidBy, setPaidBy] = useState(expense?.paidBy ?? memberIds[0]);
  const [date, setDate] = useState(expense?.date ?? today());
  const [mode, setMode] = useState<'equal' | 'exact'>(expense?.split.type ?? 'equal');
  const [among, setAmong] = useState<string[]>(
    expense?.split.type === 'equal' ? expense.split.among : memberIds,
  );
  const [exact, setExact] = useState<Record<string, string>>(() =>
    expense?.split.type === 'exact'
      ? Object.fromEntries(
          Object.entries(expense.split.shares).map(([id, c]) => [id, centsToInput(c)]),
        )
      : {},
  );
  const [error, setError] = useState('');

  const total = parseAmount(amount);
  const exactSum = memberIds.reduce((s, id) => s + (parseAmount(exact[id] || '0') ?? 0), 0);

  const toggle = (id: string) =>
    setAmong((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return setError('Add a description.');
    if (total === null || total <= 0) return setError('Enter a valid amount.');

    let split: Expense['split'];
    if (mode === 'equal') {
      if (among.length === 0) return setError('Pick at least one person to split with.');
      split = { type: 'equal', among: memberIds.filter((id) => among.includes(id)) };
    } else {
      const shares: Record<string, Cents> = {};
      for (const id of memberIds) {
        const v = exact[id]?.trim();
        if (!v) continue;
        const c = parseAmount(v);
        if (c === null) return setError('One of the exact amounts is invalid.');
        if (c > 0) shares[id] = c;
      }
      if (exactSum !== total)
        return setError(
          `Exact amounts add up to ${formatAmount(exactSum, group.currency)}, not ${formatAmount(total, group.currency)}.`,
        );
      split = { type: 'exact', shares };
    }

    onSave({
      id: expense?.id ?? uid(),
      description: description.trim(),
      amount: total,
      paidBy,
      split,
      date,
    });
  };

  return (
    <Modal title={expense ? 'Edit expense' : 'Add expense'} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <label>
          Description
          <input
            autoFocus
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Dinner, taxi, groceries…"
          />
        </label>
        <div className="row">
          <label>
            Amount ({group.currency})
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </label>
          <label>
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>
        <label>
          Paid by
          <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            {group.members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        <div className="segmented" role="tablist">
          <button type="button" className={mode === 'equal' ? 'on' : ''} onClick={() => setMode('equal')}>
            Split equally
          </button>
          <button type="button" className={mode === 'exact' ? 'on' : ''} onClick={() => setMode('exact')}>
            Exact amounts
          </button>
        </div>

        {mode === 'equal' ? (
          <div className="checklist">
            {group.members.map((m) => (
              <label key={m.id} className="check">
                <input type="checkbox" checked={among.includes(m.id)} onChange={() => toggle(m.id)} />
                <span>{m.name}</span>
                {among.includes(m.id) && total ? (
                  <span className="muted">
                    {formatAmount(Math.floor(total / among.length), group.currency)}
                  </span>
                ) : null}
              </label>
            ))}
          </div>
        ) : (
          <div className="checklist">
            {group.members.map((m) => (
              <label key={m.id} className="check">
                <span>{m.name}</span>
                <input
                  className="small"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={exact[m.id] ?? ''}
                  onChange={(e) => setExact({ ...exact, [m.id]: e.target.value })}
                />
              </label>
            ))}
            <p className={`muted ${total !== null && exactSum !== total ? 'warn' : ''}`}>
              {formatAmount(exactSum, group.currency)} of{' '}
              {formatAmount(total ?? 0, group.currency)} assigned
            </p>
          </div>
        )}

        {error && <p className="error">{error}</p>}
        <div className="actions">
          {onDelete && (
            <button type="button" className="btn danger" onClick={onDelete}>
              Delete
            </button>
          )}
          <span className="spacer" />
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary">Save</button>
        </div>
      </form>
    </Modal>
  );
}
