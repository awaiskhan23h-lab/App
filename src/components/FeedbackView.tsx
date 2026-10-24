import { useState } from 'react';
import type { Feedback, Issue, IssueKind, Turn } from '../lib/feedback';
import type { Scenario } from '../lib/scenarios';
import { ScoreRing } from './ScoreRing';

const LABEL: Record<IssueKind, string> = {
  hedge: 'Hedging',
  apology: 'Apologising',
  filler: 'Filler',
  absolute: 'Blaming',
};

function verdict(score: number) {
  if (score >= 90) return 'Outstanding. You’re ready.';
  if (score >= 75) return 'Strong. A few tweaks and you’re there.';
  if (score >= 60) return 'Good start. Tighten up your wording.';
  return 'Keep practising. You’ve got this.';
}

/** Highlights the problem phrase inside the quoted sentence. */
function Quote({ issue }: { issue: Issue }) {
  const i = issue.quote.toLowerCase().indexOf(issue.phrase);
  if (i < 0) return <>“{issue.quote}”</>;
  return (
    <>
      “{issue.quote.slice(0, i)}
      <mark>{issue.quote.slice(i, i + issue.phrase.length)}</mark>
      {issue.quote.slice(i + issue.phrase.length)}”
    </>
  );
}

export function FeedbackView({
  scenario,
  feedback,
  turns,
  onRetry,
  onHome,
}: {
  scenario: Scenario;
  feedback: Feedback;
  turns: Turn[];
  onRetry: () => void;
  onHome: () => void;
}) {
  const [showTranscript, setShowTranscript] = useState(false);
  // One example per kind of issue keeps the list short and readable.
  const examples = Object.values(
    Object.fromEntries(feedback.issues.map((i) => [i.kind, i] as const)),
  );
  const counts = feedback.issues.reduce<Partial<Record<IssueKind, number>>>(
    (c, i) => ({ ...c, [i.kind]: (c[i.kind] ?? 0) + 1 }),
    {},
  );

  return (
    <div className="page">
      <header className="topbar">
        <button className="icon-btn" onClick={onHome} aria-label="Home">
          ←
        </button>
        <div className="grow">
          <h1>Your feedback</h1>
          <p className="muted">
            {scenario.emoji} {scenario.title}
          </p>
        </div>
      </header>

      <div className="panel score-panel">
        <ScoreRing score={feedback.score} />
        <p className="verdict">{verdict(feedback.score)}</p>
        {feedback.tooShort && (
          <p className="muted small-text center">That was short, so the score is rough. Try a longer run.</p>
        )}
      </div>

      <div className="checks">
        {feedback.madeClearAsk !== null && (
          <Check ok={feedback.madeClearAsk} label={feedback.madeClearAsk ? 'Made a clear ask' : 'No clear ask'} />
        )}
        <Check ok={!counts.hedge} label={counts.hedge ? `${counts.hedge} hedge${counts.hedge > 1 ? 's' : ''}` : 'No hedging'} />
        <Check ok={(counts.apology ?? 0) <= 1} label={counts.apology ? `${counts.apology} apolog${counts.apology > 1 ? 'ies' : 'y'}` : 'No apologies'} />
        <Check ok={!counts.filler} label={counts.filler ? `${counts.filler} filler word${counts.filler > 1 ? 's' : ''}` : 'No filler'} />
        <Check ok={feedback.questionsAsked > 0} label={`${feedback.questionsAsked} question${feedback.questionsAsked === 1 ? '' : 's'} asked`} />
      </div>

      <h3 className="section-title">How to improve</h3>
      <ul className="tips">
        {feedback.tips.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      {examples.length > 0 && (
        <>
          <h3 className="section-title">What you said</h3>
          <ul className="list">
            {examples.map((i) => (
              <li key={i.kind} className="quote-item">
                <span className={`tag ${i.kind}`}>{LABEL[i.kind]}</span>
                <p>
                  <Quote issue={i} />
                </p>
              </li>
            ))}
          </ul>
        </>
      )}

      {feedback.strongestLine && (
        <>
          <h3 className="section-title">Your strongest line</h3>
          <blockquote className="strong-line">“{feedback.strongestLine}”</blockquote>
        </>
      )}

      <button className="link transcript-toggle" onClick={() => setShowTranscript((v) => !v)}>
        {showTranscript ? 'Hide' : 'Show'} full conversation
      </button>
      {showTranscript && (
        <div className="chat transcript">
          {turns.map((t, i) => (
            <div key={i} className={`bubble ${t.role}`}>
              {t.text}
            </div>
          ))}
        </div>
      )}

      <div className="actions sticky-actions">
        <button className="btn ghost" onClick={onHome}>
          Home
        </button>
        <button className="btn primary grow" onClick={onRetry}>
          Try again
        </button>
      </div>
    </div>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`check ${ok ? 'ok' : 'bad'}`}>
      {ok ? '✓' : '!'} {label}
    </span>
  );
}
