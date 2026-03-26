import React, { useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { BaseCard } from './BaseCard';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import type { CardData } from '../../types';

export const PdfCard: React.FC<{ id: string; data: CardData }> = ({ id, data }) => {
  const updateCard = useWorkspaceStore((s) => s.updateCard);
  const pick = useCallback(() => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf';
    input.onchange = () => { const f = input.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (e) => updateCard(id, { pdfData: e.target?.result as string, fileName: f.name, title: f.name }); r.readAsDataURL(f); };
    input.click();
  }, [id, updateCard]);
  return (
    <>
      <Handle type="source" position={Position.Top} id="t" className="mipler-handle" style={{ top: -7 }} />
      <Handle type="source" position={Position.Bottom} id="b" className="mipler-handle" style={{ bottom: -7 }} />
      <Handle type="source" position={Position.Left} id="l" className="mipler-handle" style={{ left: -7 }} />
      <Handle type="source" position={Position.Right} id="r" className="mipler-handle" style={{ right: -7 }} />
      <BaseCard id={id} title={data.title} width={data.width} cardColor={data.cardColor} onTitleChange={(t) => updateCard(id, { title: t })}>
        {data.pdfData ? <iframe src={data.pdfData} title={data.title} className="w-full rounded border border-black/10" style={{ height: 300 }} />
        : <button onClick={pick} className="w-full py-10 border-2 border-dashed border-black/15 rounded text-black/30 text-xs">Click to upload PDF</button>}
      </BaseCard>
    </>
  );
};