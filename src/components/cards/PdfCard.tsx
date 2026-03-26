import React, { useCallback } from 'react';
import { BaseCard } from './BaseCard';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import type { CardData } from '../../types';

export const PdfCard: React.FC<{ id: string; data: CardData }> = ({ id, data }) => {
  const updateCard = useWorkspaceStore((s) => s.updateCard);

  const pick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = (e) => updateCard(id, { pdfData: e.target?.result as string, fileName: f.name, title: f.name });
      r.readAsDataURL(f);
    };
    input.click();
  }, [id, updateCard]);

  const tag = <span style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', color: '#666', background: '#222', padding: '1px 6px', borderRadius: 3 }}>PDF</span>;

  return (
    <BaseCard id={id} title={data.title} width={data.width} cardColor={data.cardColor}
      onTitleChange={(t) => updateCard(id, { title: t })} headerExtra={tag}>
      {data.pdfData
        ? <iframe src={data.pdfData} title={data.title} style={{ width: '100%', height: 280, borderRadius: 4, border: '1px solid #2a2a2a' }} />
        : <button onClick={pick}
            style={{ width: '100%', padding: '32px 0', border: '1px dashed #2a2a2a', borderRadius: 4, background: 'transparent', color: '#444', fontSize: 11, cursor: 'pointer', fontFamily: 'IBM Plex Sans' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#444')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}>
            Click to upload PDF
          </button>
      }
    </BaseCard>
  );
};
