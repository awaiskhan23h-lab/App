import { useState } from 'react';
import { customScenario, type Difficulty, type Scenario } from '../lib/scenarios';
import { canListen } from '../lib/speech';
import type { Settings } from '../lib/store';

const DIFFICULTY: { id: Difficulty; label: string; hint: string }[] = [
  { id: 'easy', label: 'Easy', hint: 'They come round quickly.' },
  { id: 'realistic', label: 'Realistic', hint: 'Some pushback, like real life.' },
  { id: 'tough', label: 'Tough', hint: 'They resist hard. Hold your ground.' },
];

export function Setup({
  scenario,
  settings,
  onSettings,
  onStart,
  onBack,
}: {
  /** null means the user is describing their own situation. */
  scenario: Scenario | null;
  settings: Settings;
  onSettings: (s: Settings) => void;
  onStart: (scenario: Scenario, difficulty: Difficulty, custom?: { who: string; goal: string }) => void;
  onBack: () => void;
}) {
  const [difficulty, setDifficulty] = useState<Difficulty>('realistic');
  const [who, setWho] = useState('');
  const [goal, setGoal] = useState('');
  const isCustom = scenario === null;

  const start = () => {
    if (isCustom) onStart(customScenario(who, goal), difficulty, { who, goal });
    else onStart(scenario, difficulty);
  };

  return (
    <div className="page">
      <header className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          ←
        </button>
        <h1 className="grow">{isCustom ? 'Your own situation' : `${scenario.emoji} ${scenario.title}`}</h1>
      </header>

      <div className="panel form">
        {isCustom ? (
          <>
            <label>
              Who are you talking to?
              <input
                autoFocus
                value={who}
                onChange={(e) => setWho(e.target.value)}
                placeholder="e.g. My landlord, my best friend, my coach"
              />
            </label>
            <label>
              What do you want to say or achieve?
              <textarea
                rows={3}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Ask for the deposit back for the broken boiler"
              />
            </label>
          </>
        ) : (
          <>
            <div>
              <p className="label">You’re talking to</p>
              <p className="big">{scenario.persona}</p>
            </div>
            <div>
              <p className="label">Your goal</p>
              <p>{scenario.goal}</p>
            </div>
          </>
        )}

        <div>
          <p className="label">Difficulty</p>
          <div className="segmented">
            {DIFFICULTY.map((d) => (
              <button
                key={d.id}
                type="button"
                className={difficulty === d.id ? 'on' : ''}
                onClick={() => setDifficulty(d.id)}
              >
                {d.label}
              </button>
            ))}
          </div>
          <p className="muted small-text hint">{DIFFICULTY.find((d) => d.id === difficulty)!.hint}</p>
        </div>

        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.voiceReplies}
            onChange={(e) => onSettings({ ...settings, voiceReplies: e.target.checked })}
          />
          <span>Read their replies out loud</span>
        </label>

        {!canListen && (
          <p className="notice">
            Your browser can’t do speech-to-text, so you’ll type your side. Chrome, Edge and Safari support speaking.
          </p>
        )}

        <button className="btn primary big-btn" onClick={start} disabled={isCustom && !who.trim()}>
          Start practising
        </button>
      </div>
    </div>
  );
}
