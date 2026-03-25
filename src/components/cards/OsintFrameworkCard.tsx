import React from 'react';
import { Handle, Position } from 'reactflow';
import { BaseCard } from './BaseCard';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import type { CardData } from '../../types';

export const OsintFrameworkCard: React.FC<{ id: string; data: CardData }> = ({ id, data }) => {
  const updateCard = useWorkspaceStore((s) => s.updateCard);

  const frameworkUrl = 'https://osintframework.com/';

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
          <a
            href={frameworkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-mono text-wall-paperMuted bg-wall-paperBorder/30 px-1.5 py-0.5 rounded hover:bg-wall-paperBorder/50 transition-colors"
          >
            ↗ Open
          </a>
        }
      >
        <div className="w-full rounded-sm overflow-hidden border border-wall-paperBorder/30">
          <iframe
            src={frameworkUrl}
            title="OSINT Framework"
            sandbox="allow-scripts allow-same-origin allow-popups"
            className="w-full sandboxed-frame"
            style={{ height: '280px' }}
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