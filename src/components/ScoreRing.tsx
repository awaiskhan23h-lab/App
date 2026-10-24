export const scoreColor = (score: number) =>
  score >= 80 ? 'var(--good)' : score >= 60 ? 'var(--ok)' : 'var(--bad)';

export function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <svg className="ring" viewBox="0 0 120 120" role="img" aria-label={`Score ${score} out of 100`}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke={scoreColor(score)}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - score / 100)}
        transform="rotate(-90 60 60)"
      />
      <text x="60" y="58" textAnchor="middle" className="ring-score">
        {score}
      </text>
      <text x="60" y="80" textAnchor="middle" className="ring-label">
        out of 100
      </text>
    </svg>
  );
}
