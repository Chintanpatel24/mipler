import React, { useCallback, useMemo, useEffect } from 'react';
import ReactFlow, { Background, Controls, MiniMap, BackgroundVariant, type NodeTypes, type EdgeTypes, useReactFlow, ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { MiplerCardNode } from './MiplerCardNode';
import { RopeEdge } from './edges/RopeEdge';
import type { CardType } from '../types';

const Inner: React.FC = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setViewport, setEdgeStyleModalOpen, showDots, undo, aiPanelOpen } = useWorkspaceStore();
  const rf = useReactFlow();
  const nodeTypes: NodeTypes = useMemo(() => ({ miplerCard: MiplerCardNode }), []);
  const edgeTypes: EdgeTypes = useMemo(() => ({ rope: RopeEdge }), []);

  // Ctrl+Z undo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/mipler-card-type');
    if (!type) return;
    const pos = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    useWorkspaceStore.getState().addCard(type as CardType, pos);
  }, [rf]);

  return (
    <div className="w-full h-full" style={{ marginRight: aiPanelOpen ? '320px' : 0, transition: 'margin-right 0.2s' }}>
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
        onEdgeDoubleClick={(_e, edge) => setEdgeStyleModalOpen(true, edge.id)}
        nodeTypes={nodeTypes} edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'rope', animated: false }}
        onMoveEnd={(_e, vp) => setViewport(vp)}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
        onDrop={onDrop}
        fitView={false} snapToGrid snapGrid={[20, 20]}
        deleteKeyCode={['Backspace', 'Delete']}
        connectionLineStyle={{ stroke: '#888', strokeWidth: 2, strokeDasharray: '6 3' }}
        connectionRadius={40}
        minZoom={0.02} maxZoom={5}
        proOptions={{ hideAttribution: true }}
      >
        {showDots && <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="#222" />}
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap position="bottom-right" nodeColor={() => '#f5f5f0'} maskColor="rgba(0,0,0,0.75)" style={{ width: 150, height: 110 }} />
      </ReactFlow>
    </div>
  );
};

export const WallCanvas: React.FC = () => <ReactFlowProvider><Inner /></ReactFlowProvider>;