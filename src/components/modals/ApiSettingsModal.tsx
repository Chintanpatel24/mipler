import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';

export const ApiSettingsModal: React.FC = () => {
  const { apiSettingsOpen, setApiSettingsOpen, aiApiKey, setAiApiKey, aiProvider, setAiProvider } = useWorkspaceStore();

  return (
    <Modal open={apiSettingsOpen} onClose={() => setApiSettingsOpen(false)} title="⚙ API Settings" width="max-w-md">
      <div className="space-y-4">
        <div>
          <p className="text-xs text-wall-textMuted mb-2">AI Provider</p>
          <div className="flex gap-2">
            {['openai', 'anthropic'].map((p) => (
              <button key={p} onClick={() => setAiProvider(p)}
                className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${aiProvider === p ? 'bg-wall-cardHover border-wall-textMuted text-wall-text' : 'bg-wall-card border-wall-cardBorder text-wall-textMuted'}`}>
                {p === 'openai' ? '🟢 OpenAI' : '🟣 Anthropic'}
              </button>
            ))}
          </div>
        </div>

        <Input label="API Key" type="password" value={aiApiKey} onChange={(e) => setAiApiKey(e.target.value)}
          placeholder={aiProvider === 'openai' ? 'sk-...' : 'sk-ant-...'} />

        <div className="bg-wall-bg border border-wall-cardBorder rounded-lg p-3 text-[10px] text-wall-textDim space-y-1">
          <p>🔒 <strong className="text-wall-textMuted">Security:</strong></p>
          <p>• Your API key is stored only in browser memory</p>
          <p>• It is included in exports so you can restore it</p>
          <p>• The key is sent directly to the AI provider — never to our servers</p>
          <p>• Wiped completely when you close the tab</p>
        </div>

        <Button onClick={() => setApiSettingsOpen(false)} className="w-full">Done</Button>
      </div>
    </Modal>
  );
};