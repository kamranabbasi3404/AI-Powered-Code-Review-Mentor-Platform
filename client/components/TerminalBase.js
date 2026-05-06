import { useEffect, useRef, useImperativeHandle } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export default function TerminalBase({ onInput, forwardedRef, readOnly }) {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);

  useImperativeHandle(forwardedRef, () => ({
    write: (data) => {
      if (xtermRef.current) xtermRef.current.write(data);
    },
    clear: () => {
      if (xtermRef.current) xtermRef.current.clear();
    }
  }));

  const onInputRef = useRef(onInput);
  useEffect(() => {
    onInputRef.current = onInput;
  }, [onInput]);

  const readOnlyRef = useRef(readOnly);
  useEffect(() => {
    readOnlyRef.current = readOnly;
  }, [readOnly]);

  useEffect(() => {
    if (!terminalRef.current) return;

    let term = new XTerm({
      cursorBlink: true,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 14,
      theme: { background: '#0a0a0f', foreground: '#e2e8f0', cursor: '#4f46e5' }
    });
    
    let fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    term.open(terminalRef.current);
    
    const safeFit = () => {
      try {
        if (term && term.element && term.element.clientWidth > 0 && fitAddonRef.current) {
          fitAddonRef.current.fit();
        }
      } catch (e) {
        // ignore
      }
    };
    
    let timeout = setTimeout(safeFit, 50);

    let inputBuffer = '';

    const onDataDisposable = term.onData((data) => {
      if (readOnlyRef.current) return;
      
      if (data === '\r') {
        // Enter pressed: echo newline, send buffered input + newline
        term.write('\r\n');
        if (onInputRef.current) onInputRef.current(inputBuffer + '\n');
        inputBuffer = '';
      } else if (data === '\x7F' || data === '\b') {
        // Backspace: remove last char from buffer and erase visually
        if (inputBuffer.length > 0) {
          inputBuffer = inputBuffer.slice(0, -1);
          term.write('\b \b');
        }
      } else if (data >= ' ') {
        // Printable character: echo and buffer
        inputBuffer += data;
        term.write(data);
      }
    });

    let resizeObserver = new ResizeObserver(() => {
      // Small debounce
      requestAnimationFrame(safeFit);
    });
    
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    return () => {
      clearTimeout(timeout);
      if (resizeObserver) resizeObserver.disconnect();
      if (onDataDisposable) onDataDisposable.dispose();
      
      try {
        if (term) term.dispose();
      } catch (e) {
        // ignore cleanup errors during fast refresh
      }
      
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  return <div ref={terminalRef} style={{ width: '100%', height: '100%', minHeight: '100px' }} />;
}
