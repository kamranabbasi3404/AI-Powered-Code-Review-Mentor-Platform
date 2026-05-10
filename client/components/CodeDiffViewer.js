import React, { useState } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import toast from 'react-hot-toast';

export default function CodeDiffViewer({ originalCode, modifiedCode, language }) {
  const [viewMode, setViewMode] = useState('diff'); // 'diff' or 'code'
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(modifiedCode).then(() => {
      setCopied(true);
      toast.success('Code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="code-diff-viewer">
      <div className="diff-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2>Updated Code (100% Fixed)</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`btn ${viewMode === 'diff' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('diff')}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            Diff View
          </button>
          <button 
            className={`btn ${viewMode === 'code' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setViewMode('code')}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            Code View
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={handleCopy}
            style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            )}
            {copied ? 'Copied!' : 'Copy Fix'}
          </button>
        </div>
      </div>

      <div className="diff-editor-container" style={{ height: '500px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
        {viewMode === 'diff' ? (
          <DiffEditor
            height="100%"
            language={language}
            original={originalCode}
            modified={modifiedCode}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              renderSideBySide: true,
              scrollBeyondLastLine: false,
              wordWrap: 'on'
            }}
          />
        ) : (
          <pre style={{ margin: 0, height: '100%', overflow: 'auto', padding: '15px', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            <code>{modifiedCode}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
