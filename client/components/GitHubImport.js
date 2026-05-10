'use client';
import { useState, useEffect } from 'react';
import { apiGet } from '@/lib/api';
import toast from 'react-hot-toast';

export default function GitHubImport({ onImport, onClose }) {
  const [tab, setTab] = useState('repos'); // 'repos' | 'url'
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [contents, setContents] = useState(null);
  const [currentPath, setCurrentPath] = useState('');
  const [selectedRepo, setSelectedRepo] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [loadingFile, setLoadingFile] = useState(false);

  // PRs
  const [prs, setPrs] = useState([]);
  const [showPrs, setShowPrs] = useState(false);
  const [prFiles, setPrFiles] = useState([]);
  const [selectedPr, setSelectedPr] = useState(null);

  useEffect(() => {
    if (tab === 'repos') {
      fetchRepos();
    }
  }, [tab]);

  const fetchRepos = async () => {
    setLoading(true);
    try {
      const data = await apiGet('/github/repos');
      setRepos(data);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch repos');
    } finally {
      setLoading(false);
    }
  };

  const browseRepo = async (repoFullName, path = '') => {
    setLoading(true);
    setSelectedRepo(repoFullName);
    setCurrentPath(path);
    setSelectedFile(null);
    setFileContent('');
    setShowPrs(false);
    setPrFiles([]);
    setSelectedPr(null);

    // Build breadcrumbs
    const parts = path ? path.split('/') : [];
    const crumbs = [{ name: repoFullName.split('/')[1], path: '' }];
    parts.forEach((part, i) => {
      crumbs.push({ name: part, path: parts.slice(0, i + 1).join('/') });
    });
    setBreadcrumbs(crumbs);

    try {
      const data = await apiGet(`/github/contents?repo=${encodeURIComponent(repoFullName)}&path=${encodeURIComponent(path)}`);
      if (data.type === 'file') {
        setSelectedFile(data);
        setFileContent(data.content);
      } else {
        setContents(data.items);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to browse repo');
    } finally {
      setLoading(false);
    }
  };

  const handleUrlBrowse = () => {
    if (!repoUrl.trim()) return toast.error('Enter a repository URL');
    const match = repoUrl.match(/(?:github\.com\/)?([^\/\s]+\/[^\/\s#?]+)/);
    if (!match) return toast.error('Invalid GitHub URL. Use format: owner/repo');
    browseRepo(match[1]);
  };

  const fetchPrs = async () => {
    if (!selectedRepo) return;
    setLoading(true);
    setShowPrs(true);
    try {
      const data = await apiGet(`/github/prs?repo=${encodeURIComponent(selectedRepo)}`);
      setPrs(data);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch PRs');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrFiles = async (pr) => {
    setLoading(true);
    setSelectedPr(pr);
    try {
      const data = await apiGet(`/github/pr-files?repo=${encodeURIComponent(selectedRepo)}&pr=${pr.number}`);
      setPrFiles(data);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch PR files');
    } finally {
      setLoading(false);
    }
  };

  const loadPrFileContent = async (file) => {
    setLoadingFile(true);
    try {
      const res = await fetch(file.raw_url);
      const text = await res.text();
      setSelectedFile({ name: file.filename, path: file.filename, content: text });
      setFileContent(text);
    } catch (err) {
      toast.error('Failed to load file');
    } finally {
      setLoadingFile(false);
    }
  };

  const handleImport = () => {
    if (!fileContent) return toast.error('No file selected');
    // Detect language from extension
    const ext = (selectedFile?.name || '').split('.').pop().toLowerCase();
    const langMap = {
      js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
      py: 'python', java: 'java', cpp: 'cpp', c: 'c', cs: 'csharp',
      go: 'go', rs: 'rust', rb: 'ruby', php: 'php', swift: 'swift',
      kt: 'kotlin', sql: 'sql', html: 'html', css: 'css', scss: 'scss',
    };
    const language = langMap[ext] || 'javascript';
    onImport({ code: fileContent, language, title: selectedFile?.path || '' });
  };

  const fileIcon = (type) => type === 'dir' ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
  );

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '700px', width: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            Import from GitHub
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '15px', borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => { setTab('repos'); setContents(null); setSelectedFile(null); setSelectedRepo(''); setShowPrs(false); }} 
            style={{ padding: '8px 20px', background: 'none', border: 'none', borderBottom: tab === 'repos' ? '2px solid var(--accent)' : '2px solid transparent', color: tab === 'repos' ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>
            My Repos
          </button>
          <button onClick={() => { setTab('url'); setContents(null); setSelectedFile(null); setSelectedRepo(''); setShowPrs(false); }} 
            style={{ padding: '8px 20px', background: 'none', border: 'none', borderBottom: tab === 'url' ? '2px solid var(--accent)' : '2px solid transparent', color: tab === 'url' ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>
            Enter URL
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          
          {/* URL Input */}
          {tab === 'url' && !selectedRepo && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <input 
                type="text" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlBrowse()}
                placeholder="e.g. facebook/react or https://github.com/owner/repo"
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
              />
              <button className="btn btn-primary" onClick={handleUrlBrowse}>Browse</button>
            </div>
          )}

          {/* Repos List */}
          {tab === 'repos' && !selectedRepo && (
            loading ? (
              <div style={{ textAlign: 'center', padding: '30px' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {repos.map(repo => (
                  <div key={repo.full_name} onClick={() => browseRepo(repo.full_name)}
                    style={{ padding: '12px 15px', borderRadius: '8px', cursor: 'pointer', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{repo.name} {repo.private && <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-glass)', color: 'var(--text-muted)' }}>Private</span>}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{repo.description || 'No description'}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {repo.language && <span>{repo.language}</span>}
                      {repo.stars > 0 && <span>⭐ {repo.stars}</span>}
                    </div>
                  </div>
                ))}
                {repos.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No repositories found</div>}
              </div>
            )
          )}

          {/* File Browser */}
          {selectedRepo && !selectedFile && !showPrs && (
            <div>
              {/* Breadcrumbs + PR button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                  <button onClick={() => { setSelectedRepo(''); setContents(null); setBreadcrumbs([]); }} style={{ background: 'none', border: 'none', color: 'var(--accent-light)', cursor: 'pointer' }}>← Back</button>
                  {breadcrumbs.map((crumb, i) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {i > 0 && <span style={{ color: 'var(--text-muted)' }}>/</span>}
                      <button onClick={() => browseRepo(selectedRepo, crumb.path)} style={{ background: 'none', border: 'none', color: i === breadcrumbs.length - 1 ? 'var(--text-primary)' : 'var(--accent-light)', cursor: 'pointer', fontWeight: i === breadcrumbs.length - 1 ? 600 : 400 }}>
                        {crumb.name}
                      </button>
                    </span>
                  ))}
                </div>
                <button onClick={fetchPrs} className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Pull Requests</button>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '30px' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {contents && contents.map(item => (
                    <div key={item.path} onClick={() => {
                      if (item.type === 'dir') browseRepo(selectedRepo, item.path);
                      else browseRepo(selectedRepo, item.path);
                    }}
                      style={{ padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-glass)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {fileIcon(item.type)}
                      <span>{item.name}</span>
                      {item.type === 'file' && <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(item.size / 1024).toFixed(1)} KB</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PRs List */}
          {showPrs && !selectedPr && (
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                <button onClick={() => setShowPrs(false)} style={{ background: 'none', border: 'none', color: 'var(--accent-light)', cursor: 'pointer', fontSize: '0.85rem' }}>← Back to Files</button>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Open Pull Requests</span>
              </div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '30px' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
              ) : prs.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No open pull requests</div>
              ) : (
                prs.map(pr => (
                  <div key={pr.number} onClick={() => fetchPrFiles(pr)}
                    style={{ padding: '12px', borderRadius: '8px', cursor: 'pointer', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', marginBottom: '6px' }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <div style={{ fontWeight: 600 }}>#{pr.number} {pr.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>by {pr.user}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* PR Files */}
          {selectedPr && !selectedFile && (
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                <button onClick={() => { setSelectedPr(null); setPrFiles([]); }} style={{ background: 'none', border: 'none', color: 'var(--accent-light)', cursor: 'pointer', fontSize: '0.85rem' }}>← Back to PRs</button>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>#{selectedPr.number} {selectedPr.title}</span>
              </div>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '30px' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
              ) : (
                prFiles.map(file => (
                  <div key={file.filename} onClick={() => loadPrFileContent(file)}
                    style={{ padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-glass)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {fileIcon('file')}
                    <span>{file.filename}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--success)' }}>+{file.additions}</span>{' '}
                      <span style={{ color: 'var(--danger)' }}>-{file.deletions}</span>
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* File Preview */}
          {selectedFile && (
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                <button onClick={() => { setSelectedFile(null); setFileContent(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent-light)', cursor: 'pointer', fontSize: '0.85rem' }}>← Back</button>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedFile.name}</span>
              </div>
              <pre style={{ background: 'var(--bg-tertiary)', padding: '15px', borderRadius: '8px', overflow: 'auto', maxHeight: '300px', fontSize: '0.8rem', border: '1px solid var(--border)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {fileContent.substring(0, 3000)}{fileContent.length > 3000 ? '\n\n... (truncated for preview)' : ''}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          {selectedFile && (
            <button className="btn btn-primary" onClick={handleImport}>Import & Review</button>
          )}
        </div>
      </div>
    </div>
  );
}
