import React, { useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { BaseCard } from './BaseCard';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import type { CardData } from '../../types';

export const ImageCard: React.FC<{ id: string; data: CardData }> = ({ id, data }) => {
  const updateCard = useWorkspaceStore((s) => s.updateCard);

  const handleFileSelect = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        updateCard(id, {
          imageData: e.target?.result as string,
          fileName: file.name,
          title: file.name,
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [id, updateCard]);

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
        {data.imageData ? (
          <div className="relative group">
            <img
              src={data.imageData}
              alt={data.title}
              className="w-full rounded-sm border border-wall-paperBorder/30"
              style={{ maxHeight: '300px', objectFit: 'contain' }}
            />
            <button
              onClick={handleFileSelect}
              className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white text-xs px-2 py-0.5 rounded"
            >
              Replace
            </button>
          </div>
        ) : (
          <button
            onClick={handleFileSelect}
            className="w-full py-8 border-2 border-dashed border-wall-paperBorder/40 rounded-sm text-wall-paperMuted text-xs hover:border-wall-paperBorder hover:text-wall-paperText transition-colors"
          >
            Click to add image
          </button>
        )}
        <textarea
          value={data.content}
          onChange={(e) => updateCard(id, { content: e.target.value })}
          placeholder="Caption..."
          className="w-full mt-2 bg-transparent text-wall-paperText text-xs font-handwriting resize-none border-none outline-none placeholder-wall-paperMuted/50"
          rows={2}
        />
      </BaseCard>
      <Handle type="source" position={Position.Bottom} className="!bg-wall-textDim !w-2 !h-2 !border-wall-paperBorder" />
      <Handle type="source" position={Position.Right} className="!bg-wall-textDim !w-2 !h-2 !border-wall-paperBorder" />
    </>
  );
};