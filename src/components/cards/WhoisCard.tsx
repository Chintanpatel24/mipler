import React, { useState } from 'react';
import { BaseCard } from './BaseCard';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { lookupWhois, type WhoisResult } from '../../utils/osintApi';
import type { CardData } from '../../types';

const tag = (label: string) => (
  <span style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', color: '#666', background: '#222', padding: '1px 6px', borderRadius: 3 }}>
    {label}
  </span>
);

export const WhoisCard: React.FC<{ id: string; data: CardData }> = ({ id, data }) => {
  const updateCard = useWorkspaceStore((s) => s.updateCard);
  const [domain, setDomain] = useState(data.url || '');
  const [result, setResult] = useState<WhoisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const isLight = data.cardColor === '#ffffff' || data.cardColor === '#f5f5f0';
  const inputBg = isLight ? '#f0f0f0' : '#161616';
  const inputColor = isLight ? '#1a1a1a' : '#ccc';
  const inputBorder = isLight ? '#ddd' : '#2a2a2a';

  const run = async () => {
    if (!domain.trim()) return;
    setLoading(true);
    try {
      const r = await lookupWhois(domain);
      setResult(r);
      updateCard(id, { url: domain, content: JSON.stringify(r, null, 2) });
    } catch (e: any) {
      setResult({ domain, error: e.message });
    }
    setLoading(false);
  };

  return (
    <BaseCard id={id} title={data.title} width={data.width} cardColor={data.cardColor}
      onTitleChange={(t) => updateCard(id, { title: t })}
      headerExtra={tag('WHOIS')}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <input
          type="text" value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run()}
          placeholder="example.com"
          style={{ flex: 1, padding: '5px 8px', background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 4, color: inputColor, fontSize: 11, outline: 'none', fontFamily: 'IBM Plex Mono, monospace' }}
        />
        <button onClick={run} disabled={loading}
          style={{ padding: '5px 10px', background: '#1e3a5f', color: '#7ab3e8', border: 'none', borderRadius: 4, fontSize: 11, cursor: loading ? 'default' : 'pointer', fontFamily: 'IBM Plex Sans', opacity: loading ? 0.6 : 1 }}>
          {loading ? '...' : 'Lookup'}
        </button>
      </div>
      {result && (
        <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', color: '#888', maxHeight: 180, overflowY: 'auto', background: '#111', borderRadius: 4, padding: 8 }}>
          {result.error
            ? <p style={{ color: '#ef4444' }}>{result.error}</p>
            : <>
              {result.registrar && <p><span style={{ color: '#555' }}>registrar: </span>{result.registrar}</p>}
              {result.createdDate && <p><span style={{ color: '#555' }}>created: </span>{result.createdDate}</p>}
              {result.expiresDate && <p><span style={{ color: '#555' }}>expires: </span>{result.expiresDate}</p>}
              {result.nameservers?.map((n, i) => <p key={i}><span style={{ color: '#555' }}>ns: </span>{n}</p>)}
              {result.raw && <pre style={{ marginTop: 4, whiteSpace: 'pre-wrap', color: '#555' }}>{result.raw}</pre>}
            </>
          }
        </div>
      )}
    </BaseCard>
  );
};
