import { useEffect, useRef, useState } from 'react';
import { Avatar, CURRENCIES, GroupView } from './components/GroupView';
import { Modal } from './components/Modal';
import { computeBalances, formatAmount, groupTotal, settleUp } from './lib/money';
import { sampleGroups } from './lib/samples';
import { isGroupArray, uid, useGroups } from './lib/store';
import type { Group } from './lib/types';

/** The open group lives in the URL hash so the back button and refresh work. */
function useHashGroupId() {
  const read = () => decodeURIComponent(location.hash.replace(/^#\/?/, '')) || null;
  const [id, setId] = useState(read);
  useEffect(() => {
    const onHash = () => setId(read());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const go = (next: string | null) => {
    location.hash = next ? `/${encodeURIComponent(next)}` : '';
  };
  return [id, go] as const;
}

export default function App() {
  const { groups, setGroups, updateGroup } = useGroups(sampleGroups);
  const [openId, go] = useHashGroupId();
  const [creating, setCreating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const open = groups.find((g) => g.id === openId);
  if (open) {
    return (
      <GroupView
        group={open}
        onChange={(fn) => updateGroup(open.id, fn)}
        onDelete={() => {
          setGroups((gs) => gs.filter((g) => g.id !== open.id));
          go(null);
        }}
        onBack={() => go(null)}
      />
    );
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify(groups, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `split-it-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importData = async (file: File) => {
    try {
      const data: unknown = JSON.parse(await file.text());
      if (!isGroupArray(data)) throw new Error('bad');
      const existing = new Set(groups.map((g) => g.id));
      const fresh = data.filter((g) => !existing.has(g.id));
      setGroups([...groups, ...fresh]);
      alert(`Imported ${fresh.length} group(s).`);
    } catch {
      alert('That file isn’t a valid Split It backup.');
    }
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="logo" aria-hidden>
          ÷
        </div>
        <div className="grow">
          <h1>Split It</h1>
          <p className="muted">Shared expenses, settled simply.</p>
        </div>
      </header>

      {groups.length === 0 ? (
        <div className="hero">
          <p>Create a group for a trip, your flat, or a night out. Add what everyone paid, and Split It works out the fewest payments to make everyone even.</p>
          <button className="btn primary" onClick={() => setCreating(true)}>
            Create your first group
          </button>
          <button className="btn ghost" onClick={() => setGroups(sampleGroups())}>
            Show example groups
          </button>
        </div>
      ) : (
        <ul className="list">
          {[...groups]
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((g) => {
              const pending = settleUp(computeBalances(g)).length;
              return (
                <li key={g.id}>
                  <button className="list-item" onClick={() => go(g.id)}>
                    <Avatar name={g.name} />
                    <div className="grow">
                      <strong>{g.name}</strong>
                      <p className="muted">
                        {g.members.length} people · {g.expenses.length} expenses
                      </p>
                    </div>
                    <div className="right">
                      <div className="amount">{formatAmount(groupTotal(g), g.currency)}</div>
                      <p className={`muted small-text ${pending ? 'warn' : ''}`}>
                        {pending ? `${pending} to settle` : 'all even'}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
        </ul>
      )}

      {groups.length > 0 && (
        <button className="fab" onClick={() => setCreating(true)} aria-label="New group">
          +
        </button>
      )}

      <footer className="footer">
        <button className="link" onClick={exportData} disabled={groups.length === 0}>
          Export backup
        </button>
        <button className="link" onClick={() => fileRef.current?.click()}>
          Import backup
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importData(f);
            e.target.value = '';
          }}
        />
        <p className="muted small-text">Your data stays on this device.</p>
      </footer>

      {creating && (
        <NewGroup
          onClose={() => setCreating(false)}
          onCreate={(g) => {
            setGroups((gs) => [...gs, g]);
            setCreating(false);
            go(g.id);
          }}
        />
      )}
    </div>
  );
}

function NewGroup({ onCreate, onClose }: { onCreate: (g: Group) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState(guessCurrency());
  const [people, setPeople] = useState('');
  const [error, setError] = useState('');

  return (
    <Modal title="New group" onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return setError('Give the group a name.');
          const members = people
            .split(/[,\n]/)
            .map((p) => p.trim())
            .filter(Boolean)
            .map((n) => ({ id: uid(), name: n }));
          if (members.length < 2) return setError('Add at least two people.');
          onCreate({
            id: uid(),
            name: name.trim(),
            currency,
            members,
            expenses: [],
            settlements: [],
            createdAt: Date.now(),
          });
        }}
      >
        <label>
          Group name
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Paris getaway" />
        </label>
        <label>
          People (comma separated)
          <textarea
            rows={2}
            value={people}
            onChange={(e) => setPeople(e.target.value)}
            placeholder="Emma, Liam, Sofia"
          />
        </label>
        <label>
          Currency
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        {error && <p className="error">{error}</p>}
        <div className="actions">
          <span className="spacer" />
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn primary">Create</button>
        </div>
      </form>
    </Modal>
  );
}

/** GBP in the UK, EUR in the eurozone, USD everywhere else. */
function guessCurrency(): string {
  const region = navigator.language.split('-')[1]?.toUpperCase();
  if (region === 'GB') return 'GBP';
  const eurozone = [
    'AT', 'BE', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE',
    'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES',
  ];
  return region && eurozone.includes(region) ? 'EUR' : 'USD';
}
