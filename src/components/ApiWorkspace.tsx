import React, { useState, useRef } from 'react';
import { useWorkspaceStore } from '../store/useWorkspaceStore';

const DEFAULT_CODE = `// Mipler API Workspace
// Write JavaScript to interact with OSINT APIs
// The AI assistant panel on the right can help

const apiKey = "YOUR_API_KEY";
const target = "example.com";

async function investigate() {
  // WHOIS lookup
  const whoisRes = await fetch(
    \`https://api.whoisjson.com/v1/\${target}\`
  );
  const whoisData = await whoisRes.json();
  console.log("WHOIS:", whoisData);

  // DNS lookup
  const dnsRes = await fetch(
    \`https://dns.google/resolve?name=\${target}&type=A\`
  );
  const dnsData = await dnsRes.json();
  console.log("DNS:", dnsData);

  return { whois: whoisData, dns: dnsData };
}

investigate().then(console.log).catch(console.error);
`;

export const ApiWorkspace: React.FC = () => {
  const { setApiWorkspaceOpen, aiPanelOpen, setAiPanelOpen } = useWorkspaceStore();
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'output'>('editor');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const runCode = async () => {
    setRunning(true);
    setActiveTab('output');
    const logs: string[] = [];
    const origConsole = { ...console };
    const capture = (...args: unknown[]) => {
      logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
      setOutput([...logs]);
    };
    console.log = capture;
    console.error = (...args) => capture('[ERR]', ...args);
    console.warn = (...args) => capture('[WARN]', ...args);
    try {
      const fn = new Function(code + '\n//# sourceURL=api-workspace.js');
      await fn();
    } catch (e: any) {
      logs.push(`[ERROR] ${e.message}`);
      setOutput([...logs]);
    }
    console.log = origConsole.log;
    console.error = origConsole.error;
    console.warn = origConsole.warn;
    setRunning(false);
    setOutput(logs.length ? logs : ['// No output']);
  };

  const handleTab = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = ta.value.substring(0, start) + '  ' + ta.value.substring(end);
      setCode(newVal);
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 2; }, 0);
    }
  };

  return (
    <div style={{
      width: 480,
      height: '100%',
      background: '#1e1e1e',
      borderLeft: '1px solid #2a2a2a',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        borderBottom: '1px solid #2a2a2a', height: 35,
        background: '#252526',
      }}>
        {/* Tabs */}
        {(['editor', 'output'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0 16px', height: '100%', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace',
              letterSpacing: '0.04em', color: activeTab === tab ? '#ccc' : '#666',
              background: activeTab === tab ? '#1e1e1e' : 'transparent',
              border: 'none', borderBottom: activeTab === tab ? '1px solid #e0e0e0' : '1px solid transparent',
              cursor: 'pointer', textTransform: 'uppercase',
            }}
          >
            {tab}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={runCode}
          disabled={running}
          style={{
            margin: '0 6px', padding: '3px 12px', fontSize: 11,
            fontFamily: 'IBM Plex Mono, monospace', letterSpacing: '0.04em',
            background: running ? '#2a2a2a' : '#0e639c', color: running ? '#666' : '#fff',
            border: 'none', borderRadius: 4, cursor: running ? 'default' : 'pointer',
          }}
        >
          {running ? 'Running...' : 'Run'}
        </button>
        <button
          onClick={() => setAiPanelOpen(!aiPanelOpen)}
          title="Toggle AI Panel"
          style={{
            padding: '3px 10px', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace',
            color: aiPanelOpen ? '#ccc' : '#555', background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          AI
        </button>
        <button
          onClick={() => setApiWorkspaceOpen(false)}
          style={{
            padding: '0 10px', height: '100%', color: '#555', background: 'none', border: 'none', cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ccc')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#555')}
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="1" y1="1" x2="8" y2="8"/><line x1="8" y1="1" x2="1" y2="8"/>
          </svg>
        </button>
      </div>

      {/* Editor */}
      {activeTab === 'editor' && (
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* Line numbers */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 42,
            background: '#1e1e1e', borderRight: '1px solid #2a2a2a',
            overflowY: 'hidden', padding: '16px 0', userSelect: 'none',
          }}>
            {code.split('\n').map((_, i) => (
              <div key={i} style={{ height: '20.8px', textAlign: 'right', paddingRight: 8, fontSize: 12, color: '#4a4a4a', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1.6 }}>
                {i + 1}
              </div>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleTab}
            className="api-workspace"
            style={{ paddingLeft: 52, position: 'absolute', inset: 0 }}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>
      )}

      {/* Output */}
      {activeTab === 'output' && (
        <div style={{ flex: 1, overflow: 'auto', padding: 16, background: '#1e1e1e', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#d4d4d4', lineHeight: 1.6 }}>
          {running && <div style={{ color: '#888', marginBottom: 8 }}>Running...</div>}
          {output.length === 0 && !running && (
            <div style={{ color: '#444' }}>// Output will appear here after running</div>
          )}
          {output.map((line, i) => (
            <div key={i} style={{ color: line.startsWith('[ERR]') ? '#f48771' : line.startsWith('[WARN]') ? '#cca700' : '#d4d4d4', marginBottom: 2 }}>
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
