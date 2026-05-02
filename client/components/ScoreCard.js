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

export default function ScoreCard({ scores }) {
  if (!scores) return null;

  const categories = [
    { key: 'quality', label: 'Code Quality', icon: '✨' },
    { key: 'security', label: 'Security', icon: '🔒' },
    { key: 'performance', label: 'Performance', icon: '⚡' },
    { key: 'bestPractices', label: 'Best Practices', icon: '📋' },
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
          <div className="scorecard-label">{cat.icon} {cat.label}</div>
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
