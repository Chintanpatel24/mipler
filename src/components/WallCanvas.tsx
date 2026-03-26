import React, { useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Background, Controls, MiniMap, BackgroundVariant,
  type NodeTypes, type EdgeTypes, useReactFlow, ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { MiplerCardNode } from './MiplerCardNode';
import { RopeEdge } from './edges/RopeEdge';
import { ApiWorkspace } from './ApiWorkspace';
import { AiPanel } from './AiPanel';
import type { CardType } from '../types';

const Inner: React.FC = () => {
  const {
    nodes, edges, onNodesChange, onEdgesChange, onConnect,
    setViewport, setEdgeStyleModalOpen, showDots, undo,
    aiPanelOpen, apiWorkspaceOpen,
  } = useWorkspaceStore();

  const rf = useReactFlow();
  const nodeTypes: NodeTypes = useMemo(() => ({ miplerCard: MiplerCardNode }), []);
  const edgeTypes: EdgeTypes = useMemo(() => ({ rope: RopeEdge }), []);

  // Ctrl+Z undo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
      }
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

  // Right panel widths
  const aiWidth = 340;
  const apiWidth = 480;
  const rightPanelWidth = (aiPanelOpen ? aiWidth : 0) + (apiWorkspaceOpen ? apiWidth : 0);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
      {/* Main canvas */}
      <div style={{ flex: 1, minWidth: 0, transition: 'all 0.2s' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeDoubleClick={(_e, edge) => setEdgeStyleModalOpen(true, edge.id)}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{ type: 'rope', animated: false }}
          onMoveEnd={(_e, vp) => setViewport(vp)}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
          onDrop={onDrop}
          fitView={false}
          snapToGrid
          snapGrid={[16, 16]}
          deleteKeyCode={['Backspace', 'Delete']}
          connectionLineStyle={{ stroke: '#777', strokeWidth: 1.5, strokeDasharray: '5 3' }}
          connectionRadius={50}
          minZoom={0.05}
          maxZoom={5}
          proOptions={{ hideAttribution: true }}
          style={{ background: '#111111', width: '100%', height: '100%' }}
        >
          {showDots && (
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#2a2a2a"
              style={{ background: '#111111' }}
            />
          )}
          <Controls
            showInteractive={false}
            position="bottom-left"
            style={{ marginBottom: 10, marginLeft: 10 }}
          />
          {!apiWorkspaceOpen && !aiPanelOpen && (
            <MiniMap
              position="bottom-right"
              nodeColor={() => '#2a2a2a'}
              maskColor="rgba(0,0,0,0.7)"
              style={{
                width: 140, height: 100,
                marginBottom: 10, marginRight: 10,
                background: '#161616', border: '1px solid #222', borderRadius: 6,
              }}
            />
          )}
        </ReactFlow>
      </div>

      {/* Right side panels */}
      {(apiWorkspaceOpen || aiPanelOpen) && (
        <div style={{ display: 'flex', width: rightPanelWidth, transition: 'width 0.2s', overflow: 'hidden', flexShrink: 0 }}>
          {apiWorkspaceOpen && <ApiWorkspace />}
          {aiPanelOpen && <AiPanel />}
        </div>
      )}
    </div>
  );
};

export const WallCanvas: React.FC = () => (
  <ReactFlowProvider>
    <Inner />
  </ReactFlowProvider>
);
