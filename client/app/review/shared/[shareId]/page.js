'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ScoreCard from '@/components/ScoreCard';
import IssueCard from '@/components/IssueCard';

export default function SharedReviewPage() {
  const { shareId } = useParams();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!review) return;
    const codeToCopy = review.updatedCode || review.code;
    navigator.clipboard.writeText(codeToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    fetch(`${API}/reviews/share/${shareId}`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then(setReview)
      .catch(() => setError('Review not found or is private'))
      .finally(() => setLoading(false));
  }, [shareId]);

  if (loading) return <div className="loading-container"><div className="spinner" /><p className="loading-text">Loading shared review...</p></div>;
  if (error) return <div className="loading-container"><p className="loading-text">{error}</p></div>;
  if (!review) return null;

  const author = review.userId;

  return (
    <div className="review-results">
      <div className="review-results-header">
        <div>
          <h1>{review.title}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            {review.language.toUpperCase()} · {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            {author && ` · by ${author.displayName || author.username}`}
          </p>
        </div>
      </div>

      <div className="review-summary animate-in">{review.summary}</div>
      <ScoreCard scores={review.scores} />

      <div className="issues-section">
        <h2>Issues Found ({review.issues.length})</h2>
        <div className="issues-list">
          {review.issues.map((issue, i) => <IssueCard key={i} issue={issue} />)}
        </div>
      </div>

      <div className="code-display">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h2>Updated Code (100% Fixed)</h2>
          <button 
            className="btn btn-secondary" 
            onClick={handleCopyCode}
            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            )}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
        <pre><code>{review.updatedCode || review.code}</code></pre>
      </div>
    </div>
  );
}
