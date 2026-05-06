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
      {/* === HERO === */}
      <section className="hero-split">
        <div className="hero-left animate-in">
          <div className="hero-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            AI-Powered Code Analysis
          </div>
          <h1>
            Review Your Code Like a <span>Senior Engineer</span>
          </h1>
          <p className="hero-desc">
            Paste your code and get instant AI-powered reviews — bugs, security issues,
            performance problems, and best practices — all in a structured, beautiful scorecard.
          </p>
          <div className="hero-buttons">
            {user ? (
              <>
                <Link href="/review/new" className="btn btn-primary btn-lg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Start New Review
                </Link>
                <Link href="/dashboard" className="btn btn-secondary btn-lg">View Dashboard</Link>
              </>
            ) : (
              <button className="btn btn-primary btn-lg" onClick={handleLogin}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                Sign in with GitHub — it&apos;s free
              </button>
            )}
          </div>
          <div className="hero-trust">
            <span>Powered by</span>
            <div className="hero-trust-logos">
              <span className="trust-chip">Groq AI</span>
              <span className="trust-chip">Llama 3.3</span>
              <span className="trust-chip">Monaco Editor</span>
            </div>
          </div>
        </div>

        <div className="hero-right animate-in delay-2">
          <div className="hero-visual">
            {/* Code Editor Preview */}
            <div className="visual-editor">
              <div className="visual-editor-bar">
                <div className="visual-dots"><span/><span/><span/></div>
                <span className="visual-filename">app.js</span>
              </div>
              <pre className="visual-code">
{`function fetchUsers(db) {
  const query = "SELECT * FROM users 
    WHERE id = " + req.params.id;
  const password = "admin123";
  let data = [];
  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < users.length; j++) {
      data.push(users[i]);
    }
  }
  return data;
}`}
              </pre>
            </div>

            {/* Score Card Floating */}
            <div className="visual-scorecard">
              <div className="visual-score-header">
                <span>Overall Score</span>
                <span className="visual-grade">C+</span>
              </div>
              <div className="visual-score-row">
                <span>Quality</span>
                <div className="visual-bar"><div className="visual-bar-fill" style={{width: '65%', background: 'var(--warning)'}}/></div>
                <span>65</span>
              </div>
              <div className="visual-score-row">
                <span>Security</span>
                <div className="visual-bar"><div className="visual-bar-fill" style={{width: '30%', background: 'var(--danger)'}}/></div>
                <span>30</span>
              </div>
              <div className="visual-score-row">
                <span>Performance</span>
                <div className="visual-bar"><div className="visual-bar-fill" style={{width: '45%', background: 'var(--danger)'}}/></div>
                <span>45</span>
              </div>
              <div className="visual-score-row">
                <span>Best Practices</span>
                <div className="visual-bar"><div className="visual-bar-fill" style={{width: '55%', background: 'var(--warning)'}}/></div>
                <span>55</span>
              </div>
            </div>

            {/* Issue Badge Floating */}
            <div className="visual-issue-float">
              <span className="severity-badge severity-critical">● Critical</span>
              <span>SQL Injection vulnerability detected</span>
            </div>
          </div>
        </div>
      </section>

      {/* === SECTION: AI Analysis === */}
      <section className="landing-section">
        <div className="landing-section-inner reverse">
          <div className="section-visual">
            <div className="visual-analysis-card">
              <div className="analysis-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>Security Analysis</span>
              </div>
              <div className="analysis-issue">
                <div className="analysis-issue-header">
                  <span className="severity-badge severity-critical">● Critical</span>
                  <span>SQL Injection Risk</span>
                </div>
                <p>User input directly concatenated into SQL query without parameterization.</p>
                <div className="analysis-suggestion">
                  <strong>Suggestion:</strong> Use parameterized queries or an ORM to prevent injection attacks.
                </div>
              </div>
              <div className="analysis-issue">
                <div className="analysis-issue-header">
                  <span className="severity-badge severity-warning">● Warning</span>
                  <span>Hardcoded Credentials</span>
                </div>
                <p>Password stored as plaintext in source code. Use environment variables.</p>
              </div>
            </div>
          </div>
          <div className="section-text animate-in">
            <div className="section-label">Intelligent Analysis</div>
            <h2>AI finds what <span>humans miss</span></h2>
            <p>
              Our AI engine scans every line of your code for security vulnerabilities,
              performance bottlenecks, and hidden bugs. Each issue comes with a clear
              explanation, severity level, and an actionable fix — so you learn while you improve.
            </p>
            <Link href={user ? "/review/new" : "#"} className="section-cta" onClick={!user ? handleLogin : undefined}>
              Try it now
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* === SECTION: Score Card === */}
      <section className="landing-section alt">
        <div className="landing-section-inner">
          <div className="section-text animate-in">
            <div className="section-label">Code Score Card</div>
            <h2>Quantify your <span>code quality</span></h2>
            <p>
              Every review generates a detailed score card — Quality, Security, Performance,
              and Best Practices rated out of 100 with an overall letter grade.
              Track your improvement over time and showcase your scores.
            </p>
            <Link href={user ? "/review/new" : "#"} className="section-cta" onClick={!user ? handleLogin : undefined}>
              Get your score
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>
          <div className="section-visual">
            <div className="visual-grade-card">
              <div className="grade-big">A+</div>
              <div className="grade-label">Overall Grade</div>
              <div className="grade-scores">
                <div className="grade-score-item">
                  <div className="grade-circle" style={{background: 'conic-gradient(var(--success) 95%, var(--bg-tertiary) 0)'}}>
                    <span>95</span>
                  </div>
                  <span>Quality</span>
                </div>
                <div className="grade-score-item">
                  <div className="grade-circle" style={{background: 'conic-gradient(var(--success) 92%, var(--bg-tertiary) 0)'}}>
                    <span>92</span>
                  </div>
                  <span>Security</span>
                </div>
                <div className="grade-score-item">
                  <div className="grade-circle" style={{background: 'conic-gradient(var(--success) 88%, var(--bg-tertiary) 0)'}}>
                    <span>88</span>
                  </div>
                  <span>Perf</span>
                </div>
                <div className="grade-score-item">
                  <div className="grade-circle" style={{background: 'conic-gradient(var(--success) 90%, var(--bg-tertiary) 0)'}}>
                    <span>90</span>
                  </div>
                  <span>Practices</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === SECTION: Dashboard & Sharing === */}
      <section className="landing-section">
        <div className="landing-section-inner reverse">
          <div className="section-visual">
            <div className="visual-dashboard">
              <div className="vdash-header">
                <div className="vdash-stat">
                  <span className="vdash-stat-val">24</span>
                  <span className="vdash-stat-lbl">Reviews</span>
                </div>
                <div className="vdash-stat">
                  <span className="vdash-stat-val">87</span>
                  <span className="vdash-stat-lbl">Avg Score</span>
                </div>
                <div className="vdash-stat">
                  <span className="vdash-stat-val">5</span>
                  <span className="vdash-stat-lbl">Languages</span>
                </div>
              </div>
              <div className="vdash-rows">
                <div className="vdash-row">
                  <span className="review-lang-badge">JS</span>
                  <span>Auth Middleware Review</span>
                  <span className="vdash-score" style={{color: 'var(--success)'}}>92</span>
                  <span className="review-grade grade-a">A</span>
                </div>
                <div className="vdash-row">
                  <span className="review-lang-badge">PY</span>
                  <span>FastAPI Endpoint</span>
                  <span className="vdash-score" style={{color: 'var(--success)'}}>85</span>
                  <span className="review-grade grade-b">B+</span>
                </div>
                <div className="vdash-row">
                  <span className="review-lang-badge">TS</span>
                  <span>React Hook Logic</span>
                  <span className="vdash-score" style={{color: 'var(--warning)'}}>72</span>
                  <span className="review-grade grade-c">C+</span>
                </div>
              </div>
            </div>
          </div>
          <div className="section-text animate-in">
            <div className="section-label">Dashboard & Sharing</div>
            <h2>Track progress, <span>share results</span></h2>
            <p>
              Your personal dashboard shows all past reviews, average scores, and language breakdown.
              Every review gets a unique public link — share on LinkedIn, Twitter, or add to your portfolio
              to impress recruiters.
            </p>
            <Link href={user ? "/dashboard" : "#"} className="section-cta" onClick={!user ? handleLogin : undefined}>
              View dashboard
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* === CTA === */}
      <section className="landing-cta">
        <h2 className="animate-in">Ready to level up your code?</h2>
        <p className="animate-in delay-1">Join developers who use AI to write better, more secure code every day.</p>
        <div className="animate-in delay-2">
          {user ? (
            <Link href="/review/new" className="btn btn-primary btn-lg">Start New Review</Link>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={handleLogin}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              Get started — free forever
            </button>
          )}
        </div>
      </section>
    </>
  );
}
