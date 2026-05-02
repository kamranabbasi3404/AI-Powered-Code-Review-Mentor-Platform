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

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    fetch(`${API}/reviews/share/${shareId}`)
      .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
      .then(setReview)
      .catch(() => setError('Review not found or is private'))
      .finally(() => setLoading(false));
  }, [shareId]);

  if (loading) return <div className="loading-container"><div className="spinner" /><p className="loading-text">Loading shared review...</p></div>;
  if (error) return <div className="loading-container"><p className="loading-text">❌ {error}</p></div>;
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
        <h2>🔍 Issues Found ({review.issues.length})</h2>
        <div className="issues-list">
          {review.issues.map((issue, i) => <IssueCard key={i} issue={issue} />)}
        </div>
      </div>

      <div className="code-display">
        <h2>📝 Submitted Code</h2>
        <pre><code>{review.code}</code></pre>
      </div>
    </div>
  );
}
