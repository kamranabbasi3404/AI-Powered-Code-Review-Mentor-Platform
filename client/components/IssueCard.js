'use client';

const SEVERITY_MAP = {
  critical: { label: 'Critical 🔴', class: 'severity-critical' },
  warning: { label: 'Warning 🟡', class: 'severity-warning' },
  info: { label: 'Info 🔵', class: 'severity-info' },
};

const TYPE_LABELS = {
  bug: '🐛 Bug',
  security: '🔒 Security',
  performance: '⚡ Performance',
  bestPractice: '📋 Best Practice',
};

export default function IssueCard({ issue }) {
  const sev = SEVERITY_MAP[issue.severity] || SEVERITY_MAP.info;

  return (
    <div className="issue-card">
      <div className="issue-card-header">
        <span className={`severity-badge ${sev.class}`}>{sev.label}</span>
        <span className="issue-type-badge">{TYPE_LABELS[issue.type] || issue.type}</span>
        <span className="issue-title">{issue.title}</span>
      </div>
      <div className="issue-description">{issue.description}</div>
      {issue.lineNumbers && issue.lineNumbers.length > 0 && (
        <div className="issue-lines">📍 Line{issue.lineNumbers.length > 1 ? 's' : ''}: {issue.lineNumbers.join(', ')}</div>
      )}
      {issue.suggestion && (
        <div className="issue-suggestion">
          <strong>💡 Suggestion:</strong> {issue.suggestion}
        </div>
      )}
      {issue.codeExample && (
        <pre className="issue-code"><code>{issue.codeExample}</code></pre>
      )}
    </div>
  );
}
