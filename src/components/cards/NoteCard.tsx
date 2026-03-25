import React from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { BaseCard } from './BaseCard';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import type { CardData } from '../../types';

export const NoteCard: React.FC<{ id: string; data: CardData }> = ({ id, data }) => {
  const updateCard = useWorkspaceStore((s) => s.updateCard);

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-wall-textDim !w-2 !h-2 !border-wall-paperBorder" />
      <Handle type="target" position={Position.Left} className="!bg-wall-textDim !w-2 !h-2 !border-wall-paperBorder" />
      <BaseCard
        id={id}
        title={data.title}
        width={data.width}
        onTitleChange={(title) => updateCard(id, { title })}
      >
        <textarea
          value={data.content}
          onChange={(e) => updateCard(id, { content: e.target.value })}
          placeholder="Type your notes here... (Markdown supported)"
          className="w-full bg-transparent text-wall-paperText text-xs font-handwriting leading-relaxed resize-none border-none outline-none placeholder-wall-paperMuted/50"
          style={{ minHeight: '100px' }}
        />
      </BaseCard>
      <Handle type="source" position={Position.Bottom} className="!bg-wall-textDim !w-2 !h-2 !border-wall-paperBorder" />
      <Handle type="source" position={Position.Right} className="!bg-wall-textDim !w-2 !h-2 !border-wall-paperBorder" />
    </>
  );
};