import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Coach } from '../lib/coach';
import type { Turn } from '../lib/feedback';
import type { Difficulty, Scenario } from '../lib/scenarios';
import { canListen, speak, stopSpeaking, useListener } from '../lib/speech';

export function Practice({
  scenario,
  difficulty,
  coach,
  voiceReplies,
  onFinish,
  onQuit,
}: {
  scenario: Scenario;
  difficulty: Difficulty;
  coach: Coach;
  voiceReplies: boolean;
  onFinish: (turns: Turn[]) => void;
  onQuit: () => void;
}) {
  const [turns, setTurns] = useState<Turn[]>([{ role: 'ai', text: scenario.opener }]);
  const [thinking, setThinking] = useState(false);
  const [finished, setFinished] = useState(false);
  const [draft, setDraft] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const turnsRef = useRef(turns);
  const endRef = useRef<HTMLDivElement>(null);

  const say = (text: string) => {
    if (!voiceReplies) return;
    setSpeaking(true);
    speak(text, () => setSpeaking(false));
  };

  const update = (next: Turn[]) => {
    turnsRef.current = next;
    setTurns(next);
  };

  const send = async (text: string) => {
    const clean = text.trim();
    if (!clean || thinking || finished) return;
    const withUser: Turn[] = [...turnsRef.current, { role: 'user', text: clean }];
    update(withUser);
    setDraft('');
    setThinking(true);
    try {
      const reply = await coach.reply(scenario, difficulty, withUser);
      update([...withUser, { role: 'ai', text: reply.text }]);
      say(reply.text);
      if (reply.done) setFinished(true);
    } finally {
      setThinking(false);
    }
  };

  const mic = useListener(send);

  useEffect(() => {
    say(scenario.opener);
    return stopSpeaking;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns, thinking, mic.interim]);

  const userTurns = turns.filter((t) => t.role === 'user').length;

  return (
    <div className="practice">
      <header className="practice-head">
        <button
          className="icon-btn"
          aria-label="Quit"
          onClick={() => (userTurns === 0 || confirm('Quit without feedback?')) && onQuit()}
        >
          ✕
        </button>
        <div className="grow">
          <strong>{scenario.persona}</strong>
          <p className="muted small-text">
            {scenario.title} · {difficulty}
          </p>
        </div>
        <button className="btn primary small" disabled={userTurns === 0} onClick={() => onFinish(turnsRef.current)}>
          End & score
        </button>
      </header>

      <div className="goal-banner">🎯 {scenario.goal}</div>

      <div className="chat" aria-live="polite">
        {turns.map((t, i) => (
          <div key={i} className={`bubble ${t.role}`}>
            {t.text}
          </div>
        ))}
        {mic.interim && <div className="bubble user interim">{mic.interim}</div>}
        {thinking && (
          <div className="bubble ai typing" aria-label="They are replying">
            <span />
            <span />
            <span />
          </div>
        )}
        {finished && (
          <div className="finished">
            <p>They’ve wrapped up the conversation.</p>
            <button className="btn primary" onClick={() => onFinish(turnsRef.current)}>
              See my feedback
            </button>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {!finished && (
        <footer className="composer">
          {mic.error && <p className="error small-text">{mic.error}</p>}
          {canListen && (
            <button
              className={`mic ${mic.listening ? 'on' : ''}`}
              onClick={mic.listening ? mic.stop : mic.start}
              disabled={thinking}
              aria-label={mic.listening ? 'Stop and send' : 'Tap to speak'}
            >
              {mic.listening ? '■' : '🎤'}
            </button>
          )}
          <p className="muted small-text center">
            {mic.listening
              ? 'Listening… tap again when you’ve finished'
              : speaking
                ? 'They’re speaking… tap the mic to interrupt'
                : canListen
                  ? 'Tap the mic and speak, or type below'
                  : 'Type what you would say'}
          </p>
          <form
            className="type-row"
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              send(draft);
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type your reply…"
              disabled={thinking || mic.listening}
              aria-label="Your reply"
            />
            <button className="btn primary" disabled={!draft.trim() || thinking}>
              Send
            </button>
          </form>
        </footer>
      )}
    </div>
  );
}
