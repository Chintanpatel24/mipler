import React, { useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { BaseCard } from './BaseCard';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import type { CardData } from '../../types';

export const PdfCard: React.FC<{ id: string; data: CardData }> = ({ id, data }) => {
  const updateCard = useWorkspaceStore((s) => s.updateCard);

  const handleFileSelect = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        updateCard(id, {
          pdfData: e.target?.result as string,
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
        {data.pdfData ? (
          <div className="w-full rounded-sm overflow-hidden border border-wall-paperBorder/30">
            <iframe
              src={data.pdfData}
              title={data.title}
              className="w-full sandboxed-frame"
              style={{ height: '280px' }}
            />
          </div>
        ) : (
          <button
            onClick={handleFileSelect}
            className="w-full py-8 border-2 border-dashed border-wall-paperBorder/40 rounded-sm text-wall-paperMuted text-xs hover:border-wall-paperBorder hover:text-wall-paperText transition-colors flex flex-col items-center gap-2"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Click to add PDF
          </button>
        )}
        <textarea
          value={data.content}
          onChange={(e) => updateCard(id, { content: e.target.value })}
          placeholder="Notes about this document..."
          className="w-full mt-2 bg-transparent text-wall-paperText text-xs font-handwriting resize-none border-none outline-none placeholder-wall-paperMuted/50"
          rows={2}
        />
      </BaseCard>
      <Handle type="source" position={Position.Bottom} className="!bg-wall-textDim !w-2 !h-2 !border-wall-paperBorder" />
      <Handle type="source" position={Position.Right} className="!bg-wall-textDim !w-2 !h-2 !border-wall-paperBorder" />
    </>
  );
};