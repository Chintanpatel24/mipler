import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { BaseCard } from './BaseCard';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import type { CardData } from '../../types';

export const CustomUrlCard: React.FC<{ id: string; data: CardData }> = ({ id, data }) => {
  const updateCard = useWorkspaceStore((s) => s.updateCard);
  const [urlInput, setUrlInput] = useState(data.url || '');
  const [loadedUrl, setLoadedUrl] = useState(data.url || '');

  const handleLoad = () => {
    let url = urlInput.trim();
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    setLoadedUrl(url);
    updateCard(id, { url });
  };

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-wall-textDim !w-2 !h-2 !border-wall-paperBorder" />
      <Handle type="target" position={Position.Left} className="!bg-wall-textDim !w-2 !h-2 !border-wall-paperBorder" />
      <BaseCard
        id={id}
        title={data.title}
        width={data.width}
        onTitleChange={(title) => updateCard(id, { title })}
        headerExtra={
          <span className="text-[10px] font-mono text-wall-paperMuted bg-wall-paperBorder/30 px-1.5 py-0.5 rounded">
            URL
          </span>
        }
      >
        <div className="flex gap-1 mb-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
            placeholder="https://example.com/tool"
            className="flex-1 px-2 py-1 bg-white border border-wall-paperBorder rounded text-wall-paperText text-xs outline-none focus:border-wall-paperMuted"
          />
          <button
            onClick={handleLoad}
            className="px-2 py-1 bg-wall-paperBorder/40 hover:bg-wall-paperBorder/60 text-wall-paperText text-xs rounded transition-colors"
          >
            Load
          </button>
        </div>

        {loadedUrl ? (
          <div className="w-full rounded-sm overflow-hidden border border-wall-paperBorder/30">
            <iframe
              src={loadedUrl}
              title={data.title}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              className="w-full sandboxed-frame"
              style={{ height: '260px' }}
            />
          </div>
        ) : (
          <div className="w-full py-8 border-2 border-dashed border-wall-paperBorder/40 rounded-sm text-wall-paperMuted text-xs text-center">
            Enter a URL above to load a web tool
          </div>
        )}

        <textarea
          value={data.content}
          onChange={(e) => updateCard(id, { content: e.target.value })}
          placeholder="Notes..."
          className="w-full mt-2 bg-transparent text-wall-paperText text-xs font-handwriting resize-none border-none outline-none placeholder-wall-paperMuted/50"
          rows={2}
        />
      </BaseCard>
      <Handle type="source" position={Position.Bottom} className="!bg-wall-textDim !w-2 !h-2 !border-wall-paperBorder" />
      <Handle type="source" position={Position.Right} className="!bg-wall-textDim !w-2 !h-2 !border-wall-paperBorder" />
    </>
  );
};