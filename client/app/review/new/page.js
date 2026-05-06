'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CodeEditor, { LANGUAGES } from '@/components/CodeEditor';
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

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedCode = localStorage.getItem('review_code');
    if (savedCode) setCode(savedCode);
    const savedLang = localStorage.getItem('review_language');
    if (savedLang) setLanguage(savedLang);
    const savedTitle = localStorage.getItem('review_title');
    if (savedTitle) setTitle(savedTitle);
    
    setIsLoaded(true);
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('review_code', code);
  }, [code, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('review_language', language);
  }, [language, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('review_title', title);
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
        <button className="btn btn-primary" onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? (
            <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Analyzing...</>
          ) : 'Analyze Code'}
        </button>
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
    </div>
  );
}
