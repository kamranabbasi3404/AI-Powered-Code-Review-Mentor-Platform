'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ScoreCard from '@/components/ScoreCard';
import IssueCard from '@/components/IssueCard';
import ShareModal from '@/components/ShareModal';
import CodeDiffViewer from '@/components/CodeDiffViewer';
import { apiGet } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ReviewDetailPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [filter, setFilter] = useState('all');
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (!review) return;
    const codeToCopy = review.updatedCode || review.code;
    navigator.clipboard.writeText(codeToCopy).then(() => {
      setCopied(true);
      toast.success('Code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    if (!authLoading && !user) { router.push('/'); return; }
    if (!user) return;
    apiGet(`/reviews/${id}`)
      .then(setReview)
      .catch(() => { toast.error('Review not found'); router.push('/dashboard'); })
      .finally(() => setLoading(false));
  }, [id, user, authLoading, router]);

  if (authLoading || loading) {
    return <div className="loading-container"><div className="spinner" /><p className="loading-text">Loading review...</p></div>;
  }
  if (!review) return null;

  const filteredIssues = filter === 'all' ? review.issues : review.issues.filter(i => i.severity === filter);
  const criticalCount = review.issues.filter(i => i.severity === 'critical').length;
  const warningCount = review.issues.filter(i => i.severity === 'warning').length;
  const infoCount = review.issues.filter(i => i.severity === 'info').length;

  return (
    <div className="review-results">
      <div className="review-results-header">
        <div>
          <h1>{review.title}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            {review.language.toUpperCase()} · {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setShowShare(true)}>Share</button>
          <button className="btn btn-secondary" onClick={() => router.push('/dashboard')}>Back</button>
        </div>
      </div>

      <div className="review-summary animate-in">{review.summary}</div>
      <ScoreCard scores={review.scores} />

      <div className="issues-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2>Issues Found ({review.issues.length})</h2>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className={`btn btn-icon ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('all')} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>All</button>
            {criticalCount > 0 && <button className={`btn btn-icon ${filter === 'critical' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('critical')} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>● {criticalCount}</button>}
            {warningCount > 0 && <button className={`btn btn-icon ${filter === 'warning' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('warning')} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>● {warningCount}</button>}
            {infoCount > 0 && <button className={`btn btn-icon ${filter === 'info' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter('info')} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>● {infoCount}</button>}
          </div>
        </div>
        <div className="issues-list">
          {filteredIssues.map((issue, i) => <IssueCard key={i} issue={issue} />)}
          {filteredIssues.length === 0 && <div className="empty-state"><p>No issues matching this filter</p></div>}
        </div>
      </div>

      <div className="code-display" style={{ padding: 0, background: 'transparent', border: 'none' }}>
        <CodeDiffViewer 
          originalCode={review.code} 
          modifiedCode={review.updatedCode || review.code} 
          language={review.language} 
        />
      </div>

      {showShare && <ShareModal shareId={review.shareId} onClose={() => setShowShare(false)} />}
    </div>
  );
}
