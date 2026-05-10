'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiGet, apiDelete } from '@/lib/api';
import { getGradeClass } from '@/components/ScoreCard';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [deleteReviewId, setDeleteReviewId] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [statsData, reviewsData] = await Promise.all([
          apiGet('/users/stats'),
          apiGet(`/reviews?page=${page}&limit=10`)
        ]);
        setStats(statsData);
        setReviews(reviewsData.reviews);
        setPagination(reviewsData.pagination);
      } catch (err) {
        toast.error('Failed to load dashboard');
      } finally { setLoading(false); }
    };
    fetchData();
  }, [user, page]);

  const handleDeleteClick = (id) => {
    setDeleteReviewId(id);
  };

  const confirmDelete = async () => {
    if (!deleteReviewId) return;
    try {
      await apiDelete(`/reviews/${deleteReviewId}`);
      setReviews(reviews.filter(r => r._id !== deleteReviewId));
      toast.success('Review deleted');
    } catch { toast.error('Failed to delete'); }
    setDeleteReviewId(null);
  };

  if (authLoading || loading) {
    return <div className="loading-container"><div className="spinner" /><p className="loading-text">Loading dashboard...</p></div>;
  }
  if (!user) return null;

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {stats?.user?.displayName || user.username}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Here is your code review overview</p>
        </div>
        <Link href="/review/new" className="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Review
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card animate-in">
          <div className="stat-card-label">Total Reviews</div>
          <div className="stat-card-value accent">{stats?.user?.totalReviews || 0}</div>
        </div>
        <div className="stat-card animate-in delay-1">
          <div className="stat-card-label">Average Score</div>
          <div className="stat-card-value green">{stats?.avgScores?.overall || 0}</div>
        </div>
        <div className="stat-card animate-in delay-2">
          <div className="stat-card-label">Critical Issues</div>
          <div className="stat-card-value orange">{stats?.severityCount?.critical || 0}</div>
        </div>
        <div className="stat-card animate-in delay-3">
          <div className="stat-card-label">Languages Used</div>
          <div className="stat-card-value accent">{stats?.languageBreakdown ? Object.keys(stats.languageBreakdown).length : 0}</div>
        </div>
      </div>

      <div className="reviews-section">
        <h2>Review History</h2>
        {reviews.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <h3>No reviews yet</h3>
            <p>Start your first AI code review to see results here.</p>
            <Link href="/review/new" className="btn btn-primary">Start First Review</Link>
          </div>
        ) : (
          <>
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review._id} className="review-item" onClick={() => router.push(`/review/${review._id}`)}>
                  <div className="review-item-left">
                    <span className="review-lang-badge">{review.language}</span>
                    <div>
                      <div className="review-item-title">{review.title}</div>
                      <div className="review-item-date">{formatDate(review.createdAt)}</div>
                    </div>
                  </div>
                  <div className="review-item-right">
                    <span className="review-item-score" style={{ color: review.scores.overall >= 80 ? 'var(--success)' : review.scores.overall >= 60 ? 'var(--warning)' : 'var(--danger)' }}>
                      {review.scores.overall}/100
                    </span>
                    <span className={`review-grade ${getGradeClass(review.scores.grade)}`}>{review.scores.grade}</span>
                    <button className="btn btn-icon btn-danger" onClick={(e) => { e.stopPropagation(); handleDeleteClick(review._id); }} title="Delete">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {pagination && pagination.pages > 1 && (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '1.5rem' }}>
                <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                <span style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>Page {page} of {pagination.pages}</span>
                <button className="btn btn-secondary" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {deleteReviewId && (
        <div className="modal-overlay" onClick={() => setDeleteReviewId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Review</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', marginTop: '0.5rem' }}>
              Are you sure you want to delete this review? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteReviewId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete} style={{ background: 'var(--danger)', color: '#fff', border: 'none' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
