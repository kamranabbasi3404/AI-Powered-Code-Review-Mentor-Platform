'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CodeEditor, { LANGUAGES } from '@/components/CodeEditor';
import GitHubImport from '@/components/GitHubImport';
import { apiPost } from '@/lib/api';
import toast from 'react-hot-toast';

export default function NewReviewPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState('// Paste your code here and click "Analyze Code"\n');
  const [language, setLanguage] = useState('javascript');
  const [title, setTitle] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showGitHub, setShowGitHub] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  // Load state from sessionStorage on mount
  useEffect(() => {
    const savedCode = sessionStorage.getItem('review_code');
    if (savedCode) setCode(savedCode);
    const savedLang = sessionStorage.getItem('review_language');
    if (savedLang) setLanguage(savedLang);
    const savedTitle = sessionStorage.getItem('review_title');
    if (savedTitle) setTitle(savedTitle);
    
    setIsLoaded(true);
  }, []);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    sessionStorage.setItem('review_code', code);
  }, [code, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    sessionStorage.setItem('review_language', language);
  }, [language, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    sessionStorage.setItem('review_title', title);
  }, [title, isLoaded]);

  const handleAnalyze = async () => {
    if (!code.trim() || code.trim() === '// Paste your code here and click "Analyze Code"') {
      toast.error('Please enter some code to review');
      return;
    }
    setAnalyzing(true);
    try {
      const review = await apiPost('/reviews', { code, language, title: title || undefined });
      toast.success('Review completed!');
      router.push(`/review/${review._id}`);
    } catch (err) {
      toast.error(err.message || 'Analysis failed');
    } finally { setAnalyzing(false); }
  };

  const handleGitHubImport = ({ code: importedCode, language: importedLang, title: importedTitle }) => {
    setCode(importedCode);
    setLanguage(importedLang);
    setTitle(importedTitle);
    setShowGitHub(false);
    toast.success('Code imported from GitHub!');
  };

  if (authLoading) return <div className="loading-container"><div className="spinner" /></div>;
  if (!user) return null;

  return (
    <div className="editor-page">
      <div className="editor-toolbar">
        <div className="editor-toolbar-left">
          <select id="review-language" name="review-language" value={language} onChange={(e) => setLanguage(e.target.value)}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
          </select>
          <input
            id="review-title"
            name="review-title"
            type="text"
            placeholder="Review title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={() => setShowGitHub(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            Import from GitHub
          </button>
          <button className="btn btn-primary" onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? (
              <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Analyzing...</>
            ) : 'Analyze Code'}
          </button>
        </div>
      </div>
      <div className="editor-container">
        <CodeEditor code={code} setCode={setCode} language={language} setLanguage={setLanguage} />
      </div>
      {analyzing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100, gap: '1rem' }}>
          <div className="spinner" style={{ width: 56, height: 56 }} />
          <p className="loading-text" style={{ fontSize: '1.1rem' }}>AI is analyzing your code...</p>
          <p className="loading-subtext">This usually takes 5-15 seconds</p>
        </div>
      )}
      {showGitHub && <GitHubImport onImport={handleGitHubImport} onClose={() => setShowGitHub(false)} />}
    </div>
  );
}
