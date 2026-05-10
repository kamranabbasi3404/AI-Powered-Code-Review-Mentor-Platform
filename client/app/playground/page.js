'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CodeEditor, { LANGUAGES } from '@/components/CodeEditor';
import Terminal from '@/components/Terminal';
import { apiPost } from '@/lib/api';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

export default function PlaygroundPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [files, setFiles] = useState([{ id: '1', name: 'main.js', content: '// Write your code here\n' }]);
  const [activeFileId, setActiveFileId] = useState('1');
  const [language, setLanguage] = useState('javascript');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(160);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const isDraggingRef = useRef(false);
  const chatEndRef = useRef(null);
  const socketRef = useRef(null);
  const terminalRef = useRef(null);

  const socketInitRef = useRef(false);

  useEffect(() => {
    if (socketInitRef.current) return;
    socketInitRef.current = true;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const socketUrl = apiUrl.replace(/\/api\/?$/, '');
    
    const socket = io(socketUrl, {
      withCredentials: true
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Playground] Socket connected! ID:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('[Playground] Socket connection error:', err.message);
    });

    socket.on('output', (data) => {
      if (terminalRef.current) terminalRef.current.write(data);
    });

    socket.on('exit', () => {
      setIsRunning(false);
    });
  }, []);

  // Available languages for playground
  const PLAYGROUND_LANGUAGES = ['javascript', 'python', 'java', 'cpp'];

  const DEFAULT_FILES = {
    javascript: { name: 'main.js', content: '// Write your code here\n' },
    python: { name: 'main.py', content: '# Write your code here\n' },
    java: { name: 'Main.java', content: '// Write your code here\n' },
    cpp: { name: 'main.cpp', content: '// Write your code here\n' },
  };

  const handleLanguageChange = (newLang) => {
    if (newLang === language) return;
    const defaultFile = DEFAULT_FILES[newLang];
    const newFile = { id: Date.now().toString(), name: defaultFile.name, content: defaultFile.content };
    setFiles([newFile]);
    setActiveFileId(newFile.id);
    setLanguage(newLang);
  };

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  // Load state from sessionStorage on mount
  useEffect(() => {
    const savedFiles = sessionStorage.getItem('playground_files');
    if (savedFiles) {
      try {
        const parsed = JSON.parse(savedFiles);
        if (parsed && parsed.length > 0) setFiles(parsed);
      } catch(e) {}
    } else {
      const savedCode = sessionStorage.getItem('playground_code');
      if (savedCode) setFiles([{ id: '1', name: 'main.js', content: savedCode }]);
    }
    
    const savedActiveId = sessionStorage.getItem('playground_active_file');
    if (savedActiveId) setActiveFileId(savedActiveId);
    
    const savedLang = sessionStorage.getItem('playground_language');
    if (savedLang) setLanguage(savedLang);
    
    const savedMsgs = sessionStorage.getItem('playground_messages');
    if (savedMsgs) {
      try { setMessages(JSON.parse(savedMsgs)); } catch (e) {}
    }
    const savedHeight = sessionStorage.getItem('playground_terminal_height');
    if (savedHeight) setTerminalHeight(parseInt(savedHeight, 10));
    
    setIsLoaded(true);
  }, []);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    sessionStorage.setItem('playground_files', JSON.stringify(files));
    sessionStorage.setItem('playground_active_file', activeFileId);
  }, [files, activeFileId, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    sessionStorage.setItem('playground_language', language);
  }, [language, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    sessionStorage.setItem('playground_messages', JSON.stringify(messages));
  }, [messages, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    sessionStorage.setItem('playground_terminal_height', terminalHeight.toString());
  }, [terminalHeight, isLoaded]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = 'row-resize';
    
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight > 100 && newHeight < window.innerHeight - 200) {
        setTerminalHeight(newHeight);
      }
    };
    
    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = 'default';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const activeFile = files.find(f => f.id === activeFileId) || files[0];
      const response = await apiPost('/ai/chat', {
        code: activeFile.content,
        language,
        chatHistory: [...messages, userMsg]
      });
      setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
    } catch (error) {
      toast.error('Failed to get response');
      setMessages(prev => prev.slice(0, -1)); // remove the user msg on failure
    } finally {
      setIsTyping(false);
    }
  };

  const handleRunCode = () => {
    if (isRunning) return;
    setIsRunning(true);
    if (terminalRef.current) {
      terminalRef.current.clear();
      terminalRef.current.write('Running code...\r\n');
    }
    const activeFile = files.find(f => f.id === activeFileId) || files[0];
    
    if (!socketRef.current || !socketRef.current.connected) {
      if (terminalRef.current) terminalRef.current.write('\r\n\x1b[31mError: Not connected to server. Please refresh the page.\x1b[0m\r\n');
      setIsRunning(false);
      return;
    }
    
    console.log('[Playground] Emitting run_code', { 
      socketId: socketRef.current.id, 
      connected: socketRef.current.connected, 
      language, 
      filesCount: files.length 
    });
    socketRef.current.emit('run_code', { code: activeFile.content, files, language });
  };

  if (authLoading) return <div className="loading-container"><div className="spinner" /></div>;
  if (!user) return null;

  const activeFile = files.find(f => f.id === activeFileId) || files[0];

  const handleCreateFile = () => {
    setShowNewFileModal(true);
    setNewFileName('');
  };

  const confirmCreateFile = () => {
    const name = newFileName.trim();
    if (!name) {
      toast.error('File name cannot be empty');
      return;
    }
    if (files.some(f => f.name === name)) {
      toast.error('File already exists');
      return;
    }
    const newFile = { id: Date.now().toString(), name, content: '' };
    setFiles([...files, newFile]);
    setActiveFileId(newFile.id);
    setShowNewFileModal(false);
  };

  const handleDeleteFile = (e, id) => {
    e.stopPropagation();
    if (files.length === 1) return toast.error('Cannot delete the last file');
    const newFiles = files.filter(f => f.id !== id);
    setFiles(newFiles);
    if (activeFileId === id) setActiveFileId(newFiles[0].id);
  };

  const setCode = (newContent) => {
    setFiles(files.map(f => f.id === activeFileId ? { ...f, content: newContent } : f));
  };

  return (
    <div className="playground-layout">
      {/* LEFT: Workspace (Sidebar + Editor) */}
      <div className="playground-left" style={{ flexDirection: 'row' }}>
        
        {/* Workspace Sidebar */}
        <div style={{ width: '220px', borderRight: '1px solid var(--border)', background: 'var(--bg-tertiary)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 15px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>EXPLORER</span>
            <button onClick={handleCreateFile} className="btn-icon" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', padding: '4px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {files.map(f => (
              <div 
                key={f.id} 
                onClick={() => setActiveFileId(f.id)}
                style={{ 
                  padding: '6px 15px', 
                  fontSize: '0.85rem', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  background: f.id === activeFileId ? 'var(--bg-glass)' : 'transparent',
                  color: f.id === activeFileId ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderLeft: f.id === activeFileId ? '2px solid var(--accent-light)' : '2px solid transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</span>
                </div>
                {files.length > 1 && (
                  <button onClick={(e) => handleDeleteFile(e, f.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: '2px', cursor: 'pointer' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Editor & Terminal Column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div className="editor-toolbar" style={{ padding: '10px 15px' }}>
            <div className="editor-toolbar-left">
              <select 
                id="playground-language"
                name="playground-language"
                value={language} 
                onChange={(e) => handleLanguageChange(e.target.value)}
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '6px', outline: 'none' }}
              >
                {PLAYGROUND_LANGUAGES.map(l => (
                  <option key={l} value={l}>{l === 'cpp' ? 'C++' : l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{activeFile.name}</span>
              <button className="btn btn-primary" onClick={handleRunCode} disabled={isRunning} style={{ padding: '6px 16px', fontSize: '0.8rem' }}>
                {isRunning ? 'Running...' : 'Run Code ▶'}
              </button>
            </div>
          </div>
          <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
            <CodeEditor code={activeFile.content} setCode={setCode} language={language} setLanguage={setLanguage} />
          </div>
        
        
        {/* Resizer */}
        <div 
          onMouseDown={handleMouseDown}
          style={{ height: '6px', cursor: 'row-resize', background: 'var(--border)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onMouseEnter={(e) => e.target.style.background = 'var(--accent)'}
          onMouseLeave={(e) => e.target.style.background = 'var(--border)'}
        >
          <div style={{ width: '40px', height: '2px', background: 'rgba(255,255,255,0.4)', borderRadius: '2px' }} />
        </div>
        
        {/* Terminal Area */}
        <div style={{ height: `${terminalHeight}px`, background: '#0a0a0f', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 15px', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Interactive Terminal</span>
            {isRunning && <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />}
          </div>
          <div style={{ flex: 1, padding: '10px', overflow: 'hidden' }}>
            <Terminal 
              ref={terminalRef} 
              readOnly={!isRunning}
              onInput={(data) => {
                if (isRunning && socketRef.current) {
                  socketRef.current.emit('input', data);
                }
              }} 
            />
          </div>
        </div>
        </div>
      </div>
      
      {/* RIGHT: AI Mentor Chat */}
      <div className="playground-right">
        <div className="chat-header">
          <h3 className="chat-title">
            <span style={{ color: 'var(--accent-light)' }}>✨</span> AI Mentor
          </h3>
        </div>
        
        <div className="chat-messages">
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '20px', fontSize: '0.9rem' }}>
              <p>Hello! I am your AI Mentor.</p>
              <p style={{ marginTop: '10px' }}>Ask me any questions about your code, logic, or concepts. I will guide you without writing the code for you.</p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-bubble ${msg.role}`}>
              {msg.content}
            </div>
          ))}
          {isTyping && (
            <div className="chat-bubble assistant" style={{ color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '24px' }}>
                <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        
        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <input 
              id="mentor-chat-input"
              name="mentor-chat-input"
              type="text" 
              className="chat-input"
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask for guidance..." 
            />
            <button className="btn btn-primary chat-send-btn" onClick={handleSend} disabled={!input.trim() || isTyping}>
              Send
            </button>
          </div>
        </div>
      </div>

      {showNewFileModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 style={{ marginBottom: '15px' }}>Enter file name:</h2>
            <div className="modal-url">
              <input 
                type="text" 
                value={newFileName} 
                onChange={(e) => setNewFileName(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && confirmCreateFile()}
                placeholder="e.g. utils.js"
                autoFocus
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="share-buttons" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setShowNewFileModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmCreateFile}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
