import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { BaseCard } from './BaseCard';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import { lookupDns, type DnsResult } from '../../utils/osintApi';
import type { CardData } from '../../types';

export const DnsCard: React.FC<{ id: string; data: CardData }> = ({ id, data }) => {
  const updateCard = useWorkspaceStore((s) => s.updateCard);
  const [domain, setDomain] = useState(data.url || '');
  const [result, setResult] = useState<DnsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const run = async () => { if (!domain.trim()) return; setLoading(true); try { const r = await lookupDns(domain); setResult(r); updateCard(id, { url: domain, content: JSON.stringify(r, null, 2) }); } catch (e: any) { setResult({ domain, records: [], error: e.message }); } setLoading(false); };
  return (
    <>
      <Handle type="source" position={Position.Top} id="t" className="mipler-handle" style={{ top: -7 }} />
      <Handle type="source" position={Position.Bottom} id="b" className="mipler-handle" style={{ bottom: -7 }} />
      <Handle type="source" position={Position.Left} id="l" className="mipler-handle" style={{ left: -7 }} />
      <Handle type="source" position={Position.Right} id="r" className="mipler-handle" style={{ right: -7 }} />
      <BaseCard id={id} title={data.title} width={data.width} cardColor={data.cardColor} onTitleChange={(t) => updateCard(id, { title: t })} headerExtra={<span className="text-[10px] font-mono text-black/40 bg-black/5 px-1.5 py-0.5 rounded">DNS</span>}>
        <div className="flex gap-1.5 mb-2">
          <input type="text" value={domain} onChange={(e) => setDomain(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && run()} placeholder="example.com" className="flex-1 px-2.5 py-1.5 bg-white border border-black/10 rounded text-xs outline-none focus:border-black/30" />
          <button onClick={run} disabled={loading} className="px-3 py-1.5 bg-black/5 hover:bg-black/10 text-black/60 text-xs rounded font-medium disabled:opacity-50">{loading ? '···' : 'Lookup'}</button>
        </div>
        {result && <div className="text-[10px] font-mono text-black/70 max-h-52 overflow-y-auto bg-black/3 rounded p-2">
          {result.error ? <p className="text-red-600">{result.error}</p> :
          <table className="w-full"><thead><tr className="text-black/40 border-b border-black/5"><th className="text-left py-0.5">Type</th><th className="text-left py-0.5">Value</th><th className="text-left py-0.5">TTL</th></tr></thead>
          <tbody>{result.records.map((r, i) => <tr key={i} className="border-b border-black/3"><td className="py-0.5"><span className="bg-black/5 px-1 rounded">{r.type}</span></td><td className="py-0.5 break-all">{r.value}</td><td className="py-0.5 text-black/40">{r.ttl}</td></tr>)}</tbody></table>}
        </div>}
      </BaseCard>
    </>
  );
};