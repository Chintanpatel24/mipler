import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';

export const CustomUrlModal: React.FC = () => {
  const { customUrlModalOpen, setCustomUrlModalOpen, addCard } = useWorkspaceStore();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');

  const handleAdd = () => {
    if (!url.trim()) return;
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    addCard('custom-url', undefined, {
      url: finalUrl,
      title: title.trim() || 'Web Tool',
    });
    setUrl('');
    setTitle('');
    setCustomUrlModalOpen(false);
  };

  return (
    <Modal
      open={customUrlModalOpen}
      onClose={() => setCustomUrlModalOpen(false)}
      title="Add Custom URL Card"
    >
      <div className="space-y-4">
        <p className="text-sm text-wall-textMuted">
          Enter a URL to load inside a sandboxed card on your wall.
        </p>

        <Input
          label="URL"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/tool"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />

        <Input
          label="Card Title (optional)"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My Tool"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => setCustomUrlModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!url.trim()}>
            Add to Wall
          </Button>
        </div>

        <p className="text-xs text-wall-textDim">
          ⚠ The URL will be loaded in a sandboxed iframe. Some sites may block iframe embedding.
        </p>
      </div>
    </Modal>
  );
};