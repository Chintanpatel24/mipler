import React, { useState, useRef, useEffect } from 'react';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { sendAiMessage } from '../utils/aiApi';
import { v4 as uuidv4 } from 'uuid';

export const AiPanel: React.FC = () => {
  const { aiPanelOpen, setAiPanelOpen, aiApiKey, aiProvider, aiChatHistory, addAiMessage, clearAiChat, setApiSettingsOpen } = useWorkspaceStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiChatHistory]);

  if (!aiPanelOpen) return null;

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { id: uuidv4(), role: 'user' as const, content: input.trim(), timestamp: new Date().toISOString() };
    addAiMessage(userMsg);
    setInput('');
    setLoading(true);
    try {
      const reply = await sendAiMessage(aiChatHistory, userMsg.content, aiApiKey, aiProvider);
      addAiMessage({ id: uuidv4(), role: 'assistant', content: reply, timestamp: new Date().toISOString() });
    } catch (e: any) {
      addAiMessage({ id: uuidv4(), role: 'assistant', content: `❌ ${e.message}`, timestamp: new Date().toISOString() });
    }
    setLoading(false);
  };

  return (
    <div className="fixed top-12 right-0 bottom-0 w-80 lg:w-96 bg-wall-surface border-l border-wall-cardBorder z-30 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-wall-cardBorder">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-wall-text">🤖 AI Assistant</span>
          {!aiApiKey && <span className="text-[9px] bg-yellow-900/30 text-yellow-400 px-1.5 py-0.5 rounded">No API Key</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setApiSettingsOpen(true)} className="text-wall-textMuted hover:text-wall-text p-1 text-xs" title="API Settings">⚙</button>
          <button onClick={clearAiChat} className="text-wall-textMuted hover:text-wall-text p-1 text-xs" title="Clear chat">🗑</button>
          <button onClick={() => setAiPanelOpen(false)} className="text-wall-textMuted hover:text-wall-text p-1">✕</button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {aiChatHistory.length === 0 && (
          <div className="text-center py-8">
            <p className="text-wall-textDim text-xs mb-2">Ask the AI about your investigation</p>
            <div className="space-y-1 text-[10px] text-wall-textDim">
              <p className="bg-wall-card px-2 py-1 rounded cursor-pointer hover:bg-wall-cardHover" onClick={() => setInput('Analyze the domain example.com for OSINT')}>→ Analyze domain example.com</p>
              <p className="bg-wall-card px-2 py-1 rounded cursor-pointer hover:bg-wall-cardHover" onClick={() => setInput('What OSINT tools can I use to investigate an email?')}>→ OSINT tools for email investigation</p>
              <p className="bg-wall-card px-2 py-1 rounded cursor-pointer hover:bg-wall-cardHover" onClick={() => setInput('Help me map the infrastructure of a target domain')}>→ Map domain infrastructure</p>
            </div>
          </div>
        )}
        {aiChatHistory.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed ${
              msg.role === 'user' ? 'bg-wall-card text-wall-text border border-wall-cardBorder' : 'bg-wall-bg text-wall-text border border-wall-cardBorder'
            }`}>
              <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
              <p className="text-[9px] text-wall-textDim mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="bg-wall-bg border border-wall-cardBorder px-3 py-2 rounded-lg text-xs text-wall-textMuted animate-pulse">Thinking...</div></div>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-wall-cardBorder">
        <div className="flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={aiApiKey ? 'Ask about your investigation...' : 'Set API key in ⚙ first'}
            disabled={!aiApiKey}
            className="flex-1 px-3 py-2 bg-wall-card border border-wall-cardBorder rounded-lg text-xs text-wall-text outline-none focus:border-wall-textMuted disabled:opacity-50" />
          <button onClick={send} disabled={!input.trim() || loading || !aiApiKey}
            className="px-3 py-2 bg-wall-accent text-black rounded-lg text-xs font-medium disabled:opacity-30 hover:bg-white transition-colors">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};