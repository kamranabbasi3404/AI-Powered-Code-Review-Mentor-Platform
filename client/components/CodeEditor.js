'use client';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp',
  'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'html', 'css', 'sql',
  'bash', 'json', 'yaml', 'xml', 'markdown',
];

export default function CodeEditor({ code, setCode, language, setLanguage }) {
  return (
    <MonacoEditor
      height="100%"
      language={language}
      value={code}
      onChange={(val) => setCode(val || '')}
      theme="vs-dark"
      options={{
        fontSize: 14,
        fontFamily: "'JetBrains Mono', monospace",
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        padding: { top: 16 },
        lineNumbers: 'on',
        roundedSelection: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        bracketPairColorization: { enabled: true },
        wordWrap: 'on',
        automaticLayout: true,
      }}
    />
  );
}

export { LANGUAGES };
