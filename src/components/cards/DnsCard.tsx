import React, { useState } from 'react';
import { BaseCard } from './BaseCard';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { lookupDns, type DnsResult } from '../../utils/osintApi';
import type { CardData } from '../../types';

export const DnsCard: React.FC<{ id: string; data: CardData }> = ({ id, data }) => {
  const updateCard = useWorkspaceStore((s) => s.updateCard);
  const [domain, setDomain] = useState(data.url || '');
  const [result, setResult] = useState<DnsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const isLight = data.cardColor === '#ffffff' || data.cardColor === '#f5f5f0';
  const inputBg = isLight ? '#f0f0f0' : '#161616';
  const inputColor = isLight ? '#1a1a1a' : '#ccc';
  const inputBorder = isLight ? '#ddd' : '#2a2a2a';

  const run = async () => {
    if (!domain.trim()) return;
    setLoading(true);
    try {
      const r = await lookupDns(domain);
      setResult(r);
      updateCard(id, { url: domain, content: JSON.stringify(r, null, 2) });
    } catch (e: any) {
      setResult({ domain, records: [], error: e.message });
    }
    setLoading(false);
  };

  const tag = <span style={{ fontSize: 9, fontFamily: 'IBM Plex Mono, monospace', color: '#666', background: '#222', padding: '1px 6px', borderRadius: 3 }}>DNS</span>;

  return (
    <BaseCard id={id} title={data.title} width={data.width} cardColor={data.cardColor}
      onTitleChange={(t) => updateCard(id, { title: t })} headerExtra={tag}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="example.com"
          style={{ flex: 1, padding: '5px 8px', background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 4, color: inputColor, fontSize: 11, outline: 'none', fontFamily: 'IBM Plex Mono, monospace' }} />
        <button onClick={run} disabled={loading}
          style={{ padding: '5px 10px', background: '#1e3a5f', color: '#7ab3e8', border: 'none', borderRadius: 4, fontSize: 11, cursor: loading ? 'default' : 'pointer', fontFamily: 'IBM Plex Sans', opacity: loading ? 0.6 : 1 }}>
          {loading ? '...' : 'Lookup'}
        </button>
      </div>
      {result && (
        <div style={{ fontSize: 10, fontFamily: 'IBM Plex Mono, monospace', color: '#888', maxHeight: 180, overflowY: 'auto', background: '#111', borderRadius: 4, padding: 8 }}>
          {result.error
            ? <p style={{ color: '#ef4444' }}>{result.error}</p>
            : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>
                {['Type', 'Value', 'TTL'].map((h) => <th key={h} style={{ textAlign: 'left', padding: '2px 4px', color: '#555', fontWeight: 500 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {result.records.map((r, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '2px 4px' }}><span style={{ background: '#1e1e1e', padding: '1px 4px', borderRadius: 2 }}>{r.type}</span></td>
                    <td style={{ padding: '2px 4px', wordBreak: 'break-all' }}>{r.value}</td>
                    <td style={{ padding: '2px 4px', color: '#555' }}>{r.ttl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </div>
      )}
    </BaseCard>
  );
};
