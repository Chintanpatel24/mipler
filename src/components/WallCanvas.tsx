import React, { useCallback, useRef, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type NodeTypes,
  type EdgeTypes,
  type OnMoveEnd,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { MiplerCardNode } from './MiplerCardNode';
import { RopeEdge } from './edges/RopeEdge';
import { autoSaveToLocalStorage } from '../utils/fileSystem';

const WallCanvasInner: React.FC = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setViewport,
    getWorkspaceState,
    lastModified,
  } = useWorkspaceStore();

  const reactFlowInstance = useReactFlow();
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      miplerCard: MiplerCardNode,
    }),
    []
  );

  const edgeTypes: EdgeTypes = useMemo(
    () => ({
      rope: RopeEdge,
    }),
    []
  );

  // Auto-save to localStorage every 3 seconds after last modification
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      const state = getWorkspaceState();
      autoSaveToLocalStorage(state);
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [lastModified, getWorkspaceState]);

  const handleMoveEnd: OnMoveEnd = useCallback(
    (_event, viewport) => {
      setViewport(viewport);
    },
    [setViewport]
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/mipler-card-type');
      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      useWorkspaceStore.getState().addCard(type as any, position);
    },
    [reactFlowInstance]
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'rope',
      animated: false,
      style: { stroke: '#666', strokeWidth: 1.5 },
    }),
    []
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onMoveEnd={handleMoveEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        fitView={false}
        snapToGrid
        snapGrid={[16, 16]}
        deleteKeyCode={['Backspace', 'Delete']}
        connectionLineStyle={{ stroke: '#666', strokeWidth: 1.5, strokeDasharray: '6 3' }}
        minZoom={0.1}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#1a1a1a"
        />
        <Controls
          showInteractive={false}
          position="bottom-left"
        />
        <MiniMap
          position="bottom-right"
          nodeColor={() => '#f5f5f0'}
          maskColor="rgba(0,0,0,0.7)"
          style={{ width: 140, height: 100 }}
        />
      </ReactFlow>
    </div>
  );
};

export const WallCanvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <WallCanvasInner />
    </ReactFlowProvider>
  );
};