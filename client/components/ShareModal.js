'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ShareModal({ shareId, onClose }) {
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/review/shared/${shareId}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Failed to copy'); }
  };

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out my AI Code Review on CodeMentor AI!')}&url=${encodeURIComponent(shareUrl)}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Share Review</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Share your code review results with others
        </p>
        <div className="modal-url">
          <input readOnly value={shareUrl} />
          <button className="btn btn-primary" onClick={handleCopy}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <div className="share-buttons">
          <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="share-btn twitter">
            𝕏 Twitter
          </a>
          <a href={linkedInUrl} target="_blank" rel="noopener noreferrer" className="share-btn linkedin">
            in LinkedIn
          </a>
        </div>
        <button className="btn btn-ghost" onClick={onClose} style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
          Close
        </button>
      </div>
    </div>
  );
}
