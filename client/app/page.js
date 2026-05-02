'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiGet } from '@/lib/api';

export default function HomePage() {
  const { user } = useAuth();

  const handleLogin = async () => {
    try {
      const data = await apiGet('/auth/github');
      window.location.href = data.url;
    } catch {
      const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
      const redirectUri = encodeURIComponent(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/github/callback`);
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user%20user:email`;
    }
  };

  return (
    <>
      <section className="hero">
        <div className="hero-badge animate-in">⚡ AI-Powered Code Analysis</div>
        <h1 className="animate-in delay-1">
          Review Your Code<br />Like a <span>Senior Engineer</span>
        </h1>
        <p className="hero-subtitle animate-in delay-2">
          Paste your code and get instant AI-powered reviews — bugs, security issues,
          performance problems, and best practices — all in a structured, beautiful scorecard.
        </p>
        <div className="hero-buttons animate-in delay-3">
          {user ? (
            <Link href="/review/new" className="btn btn-primary btn-lg">
              🚀 Start New Review
            </Link>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={handleLogin}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              Sign in with GitHub
            </button>
          )}
          {user && (
            <Link href="/dashboard" className="btn btn-secondary btn-lg">
              📊 View Dashboard
            </Link>
          )}
        </div>
        <div className="hero-stats animate-in delay-4">
          <div className="hero-stat">
            <div className="hero-stat-value">⚡</div>
            <div className="hero-stat-label">Instant AI Reviews</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">🔒</div>
            <div className="hero-stat-label">Security Analysis</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">📊</div>
            <div className="hero-stat-label">Code Score Cards</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">🔗</div>
            <div className="hero-stat-label">Shareable Links</div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="feature-card animate-in">
          <div className="feature-icon purple">🤖</div>
          <h3>AI Code Review</h3>
          <p>Get comprehensive code analysis powered by Groq AI — bugs, security issues, and improvement suggestions in seconds.</p>
        </div>
        <div className="feature-card animate-in delay-1">
          <div className="feature-icon green">📊</div>
          <h3>Score Card</h3>
          <p>Receive a detailed scorecard with quality, security, performance, and best practices scores out of 100.</p>
        </div>
        <div className="feature-card animate-in delay-2">
          <div className="feature-icon blue">💻</div>
          <h3>VS Code Editor</h3>
          <p>Write and paste code in a professional Monaco editor with syntax highlighting for 20+ languages.</p>
        </div>
        <div className="feature-card animate-in delay-3">
          <div className="feature-icon orange">🔗</div>
          <h3>Share & Showcase</h3>
          <p>Get shareable public links for every review — share on LinkedIn, Twitter, or add to your portfolio.</p>
        </div>
      </section>
    </>
  );
}
