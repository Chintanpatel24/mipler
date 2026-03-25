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

  const handleLookup = async () => {
    if (!domain.trim()) return;
    setLoading(true);
    try {
      const res = await lookupDns(domain);
      setResult(res);
      updateCard(id, {
        url: domain,
        content: JSON.stringify(res, null, 2),
      });
    } catch (err: any) {
      setResult({ domain, records: [], error: err.message });
    }
    setLoading(false);
  };

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
            DNS
          </span>
        }
      >
        <div className="flex gap-1 mb-2">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            placeholder="example.com"
            className="flex-1 px-2 py-1 bg-white border border-wall-paperBorder rounded text-wall-paperText text-xs outline-none focus:border-wall-paperMuted"
          />
          <button
            onClick={handleLookup}
            disabled={loading}
            className="px-2 py-1 bg-wall-paperBorder/40 hover:bg-wall-paperBorder/60 text-wall-paperText text-xs rounded transition-colors disabled:opacity-50"
          >
            {loading ? '...' : 'Lookup'}
          </button>
        </div>

        {result && (
          <div className="text-[10px] font-mono text-wall-paperText leading-relaxed max-h-48 overflow-y-auto">
            {result.error ? (
              <p className="text-red-600">{result.error}</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-wall-paperMuted border-b border-wall-paperBorder/30">
                    <th className="text-left py-0.5 pr-2">Type</th>
                    <th className="text-left py-0.5 pr-2">Value</th>
                    <th className="text-left py-0.5">TTL</th>
                  </tr>
                </thead>
                <tbody>
                  {result.records.map((r, i) => (
                    <tr key={i} className="border-b border-wall-paperBorder/10">
                      <td className="py-0.5 pr-2 text-wall-paperMuted">{r.type}</td>
                      <td className="py-0.5 pr-2 break-all">{r.value}</td>
                      <td className="py-0.5 text-wall-paperMuted">{r.ttl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </BaseCard>
      <Handle type="source" position={Position.Bottom} className="!bg-wall-textDim !w-2 !h-2 !border-wall-paperBorder" />
      <Handle type="source" position={Position.Right} className="!bg-wall-textDim !w-2 !h-2 !border-wall-paperBorder" />
    </>
  );
};