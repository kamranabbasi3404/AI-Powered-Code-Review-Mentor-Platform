'use client';

function getScoreColor(score) {
  if (score >= 80) return 'var(--success)';
  if (score >= 60) return 'var(--warning)';
  return 'var(--danger)';
}

function getBarClass(score) {
  if (score >= 80) return 'high';
  if (score >= 60) return 'mid';
  return 'low';
}

function getGradeClass(grade) {
  if (!grade) return '';
  const letter = grade.charAt(0).toUpperCase();
  if (letter === 'A') return 'grade-a';
  if (letter === 'B') return 'grade-b';
  if (letter === 'C') return 'grade-c';
  return 'grade-d';
}

function CircleProgress({ value, size = 80, stroke = 6 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle className="progress-ring-bg" cx={size/2} cy={size/2} r={radius} />
        <circle
          className="progress-ring-fill"
          cx={size/2} cy={size/2} r={radius}
          stroke={getScoreColor(value)}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="progress-ring-text" style={{ color: getScoreColor(value) }}>
        {value}
      </div>
    </div>
  );
}

const CategoryIcon = ({ type }) => {
  const icons = {
    quality: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    security: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
    performance: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
    bestPractices: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  };
  return icons[type] || null;
};

export default function ScoreCard({ scores }) {
  if (!scores) return null;

  const categories = [
    { key: 'quality', label: 'Code Quality' },
    { key: 'security', label: 'Security' },
    { key: 'performance', label: 'Performance' },
    { key: 'bestPractices', label: 'Best Practices' },
  ];

  return (
    <div className="scorecard">
      <div className="scorecard-item overall animate-in">
        <div>
          <div className="scorecard-label">Overall Score</div>
          <CircleProgress value={scores.overall} size={100} stroke={8} />
        </div>
        <div>
          <div className="scorecard-label">Grade</div>
          <div className="scorecard-grade">{scores.grade}</div>
        </div>
      </div>
      {categories.map((cat, i) => (
        <div key={cat.key} className={`scorecard-item animate-in delay-${i+1}`}>
          <div className="scorecard-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
            <CategoryIcon type={cat.key} /> {cat.label}
          </div>
          <div className="scorecard-value" style={{ color: getScoreColor(scores[cat.key]) }}>
            {scores[cat.key]}
          </div>
          <div className="score-bar">
            <div
              className={`score-bar-fill ${getBarClass(scores[cat.key])}`}
              style={{ width: `${scores[cat.key]}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export { getGradeClass };
