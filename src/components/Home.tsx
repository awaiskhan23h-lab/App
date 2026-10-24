import { useState } from 'react';
import { SCENARIOS, type Category, type Scenario } from '../lib/scenarios';
import type { Session } from '../lib/store';
import { scoreColor } from './ScoreRing';

export function Home({
  sessions,
  onPick,
  onCustom,
  onReview,
  onClear,
}: {
  sessions: Session[];
  onPick: (s: Scenario) => void;
  onCustom: () => void;
  onReview: (s: Session) => void;
  onClear: () => void;
}) {
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const shown = SCENARIOS.filter((s) => filter === 'all' || s.category === filter);
  const avg = sessions.length ? Math.round(sessions.reduce((t, s) => t + s.score, 0) / sessions.length) : null;
  const best = sessions.length ? Math.max(...sessions.map((s) => s.score)) : null;

  return (
    <div className="page">
      <header className="topbar">
        <div className="logo" aria-hidden>
          🎙️
        </div>
        <div className="grow">
          <h1>Rehearse</h1>
          <p className="muted">Practise the conversation before it happens.</p>
        </div>
      </header>

      {sessions.length > 0 && (
        <div className="stats">
          <Stat label="Sessions" value={String(sessions.length)} />
          <Stat label="Average" value={String(avg)} color={scoreColor(avg!)} />
          <Stat label="Best" value={String(best)} color={scoreColor(best!)} />
        </div>
      )}

      <nav className="chips" aria-label="Filter scenarios">
        {(['all', 'work', 'personal'] as const).map((c) => (
          <button key={c} className={filter === c ? 'on' : ''} onClick={() => setFilter(c)}>
            {c === 'all' ? 'All' : c === 'work' ? 'Work' : 'Personal'}
          </button>
        ))}
      </nav>

      <div className="grid">
        <button className="card custom" onClick={onCustom}>
          <span className="emoji">✍️</span>
          <strong>Your own situation</strong>
          <span className="muted">Describe who you need to talk to and what you want to say.</span>
        </button>
        {shown.map((s) => (
          <button key={s.id} className="card" onClick={() => onPick(s)}>
            <span className="emoji">{s.emoji}</span>
            <strong>{s.title}</strong>
            <span className="muted">with {s.persona}</span>
          </button>
        ))}
      </div>

      {sessions.length > 0 && (
        <>
          <div className="section-head">
            <h3>Recent practice</h3>
            <button className="link" onClick={() => confirm('Clear all practice history?') && onClear()}>
              Clear
            </button>
          </div>
          <ul className="list">
            {sessions.slice(0, 20).map((s) => (
              <li key={s.id}>
                <button className="list-item" onClick={() => onReview(s)}>
                  <span className="emoji small">{s.emoji}</span>
                  <div className="grow">
                    <strong>{s.title}</strong>
                    <p className="muted">
                      {new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ·{' '}
                      {s.difficulty}
                    </p>
                  </div>
                  <span className="score-pill" style={{ color: scoreColor(s.score) }}>
                    {s.score}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="muted small-text center footer-note">
        Demo mode: the other person is scripted for now. Your practice stays on this device.
      </p>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="stat">
      <span className="stat-value" style={color ? { color } : undefined}>
        {value}
      </span>
      <span className="muted small-text">{label}</span>
    </div>
  );
}
