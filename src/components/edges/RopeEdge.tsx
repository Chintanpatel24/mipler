import React, { useCallback } from 'react';
import { type EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';
import { useWorkspaceStore } from '../../store/useWorkspaceStore';
import type { EdgeData } from '../../types';

export const RopeEdge: React.FC<EdgeProps<EdgeData>> = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, data }) => {
  const setEdgeStyleModalOpen = useWorkspaceStore((s) => s.setEdgeStyleModalOpen);
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, curvature: 0.25 });
  const color = data?.color || '#888';
  const lineStyle = data?.lineStyle || 'dashed';
  const strokeWidth = data?.strokeWidth || 2;
  const dashMap: Record<string, string> = { dashed: '8 4', dotted: '3 4', solid: '0' };
  const open = useCallback((e: React.MouseEvent) => { e.stopPropagation(); setEdgeStyleModalOpen(true, id); }, [id, setEdgeStyleModalOpen]);

  return (
    <>
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={24} style={{ cursor: 'pointer' }} onDoubleClick={open} />
      <path d={edgePath} fill="none" stroke={`${color}22`} strokeWidth={strokeWidth + 3} strokeLinecap="round" />
      <path id={id} className="react-flow__edge-path" d={edgePath} markerEnd={markerEnd} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={dashMap[lineStyle]} strokeLinecap="round" style={{ ...style, cursor: 'pointer' }} onDoubleClick={open} />
      <circle cx={sourceX} cy={sourceY} r={4} fill={color} stroke="#222" strokeWidth={1.5} />
      <circle cx={targetX} cy={targetY} r={4} fill={color} stroke="#222" strokeWidth={1.5} />
      <EdgeLabelRenderer>
        <div style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, pointerEvents: 'all' }} className="nodrag nopan">
          <button onClick={open} className="w-5 h-5 rounded-full bg-wall-card border border-wall-cardBorder text-wall-textMuted hover:text-white flex items-center justify-center text-[10px] opacity-0 hover:opacity-100 transition-opacity shadow-lg" title="Edit style">✎</button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};