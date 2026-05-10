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
  const [code, setCode] = useState('// Write your code here\n');
  const [language, setLanguage] = useState('javascript');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(160);
  const [isLoaded, setIsLoaded] = useState(false);
  const isDraggingRef = useRef(false);
  const chatEndRef = useRef(null);
  const socketRef = useRef(null);
  const terminalRef = useRef(null);

  useEffect(() => {
    // Socket.IO needs the base server URL, not the /api path
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const socketUrl = apiUrl.replace(/\/api\/?$/, '');
    
    socketRef.current = io(socketUrl, {
      withCredentials: true
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('[Playground] Socket connection error:', err.message);
    });

    socketRef.current.on('output', (data) => {
      if (terminalRef.current) terminalRef.current.write(data);
    });

    socketRef.current.on('exit', () => {
      setIsRunning(false);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // Available languages for playground
  const PLAYGROUND_LANGUAGES = ['javascript', 'python', 'java', 'cpp'];

  useEffect(() => {
    if (!authLoading && !user) router.push('/');
  }, [user, authLoading, router]);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedCode = localStorage.getItem('playground_code');
    if (savedCode) setCode(savedCode);
    const savedLang = localStorage.getItem('playground_language');
    if (savedLang) setLanguage(savedLang);
    const savedMsgs = localStorage.getItem('playground_messages');
    if (savedMsgs) {
      try { setMessages(JSON.parse(savedMsgs)); } catch (e) {}
    }
    const savedHeight = localStorage.getItem('playground_terminal_height');
    if (savedHeight) setTerminalHeight(parseInt(savedHeight, 10));
    
    setIsLoaded(true);
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('playground_code', code);
  }, [code, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('playground_language', language);
  }, [language, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('playground_messages', JSON.stringify(messages));
  }, [messages, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('playground_terminal_height', terminalHeight.toString());
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
      const response = await apiPost('/ai/chat', {
        code,
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
    socketRef.current.emit('run_code', { code, language });
  };

  if (authLoading) return <div className="loading-container"><div className="spinner" /></div>;
  if (!user) return null;

  return (
    <div className="playground-layout">
      {/* LEFT: Code Editor */}
      <div className="playground-left">
        <div className="editor-toolbar" style={{ padding: '10px 15px' }}>
          <div className="editor-toolbar-left">
            <select 
              id="playground-language"
              name="playground-language"
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '6px', outline: 'none' }}
            >
              {PLAYGROUND_LANGUAGES.map(l => (
                <option key={l} value={l}>{l === 'cpp' ? 'C++' : l.charAt(0).toUpperCase() + l.slice(1)}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Code Playground</span>
            <button className="btn btn-primary" onClick={handleRunCode} disabled={isRunning} style={{ padding: '6px 16px', fontSize: '0.8rem' }}>
              {isRunning ? 'Running...' : 'Run Code ▶'}
            </button>
          </div>
        </div>
        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          <CodeEditor code={code} setCode={setCode} language={language} setLanguage={setLanguage} />
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
    </div>
  );
}
