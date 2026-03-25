import React from 'react';
import { Handle, Position } from 'reactflow';
import { BaseCard } from './BaseCard';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import type { CardData } from '../../types';

export const ReverseImageCard: React.FC<{ id: string; data: CardData }> = ({ id, data }) => {
  const updateCard = useWorkspaceStore((s) => s.updateCard);

  const services = [
    { name: 'Google Images', url: 'https://images.google.com/' },
    { name: 'TinEye', url: 'https://tineye.com/' },
    { name: 'Yandex Images', url: 'https://yandex.com/images/' },
  ];

  const currentUrl = data.url || services[0].url;

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
            IMG
          </span>
        }
      >
        <div className="flex gap-1 mb-2">
          {services.map((s) => (
            <button
              key={s.name}
              onClick={() => updateCard(id, { url: s.url })}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                currentUrl === s.url
                  ? 'bg-wall-paperBorder/60 text-wall-paperText'
                  : 'bg-wall-paperBorder/20 text-wall-paperMuted hover:bg-wall-paperBorder/40'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
        <div className="w-full rounded-sm overflow-hidden border border-wall-paperBorder/30">
          <iframe
            src={currentUrl}
            title="Reverse Image Search"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            className="w-full sandboxed-frame"
            style={{ height: '260px' }}
          />
        </div>
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