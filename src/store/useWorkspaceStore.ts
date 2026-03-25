import { create } from 'zustand';
import {
  type Connection,
  type EdgeChange,
  type NodeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import type { MiplerNode, MiplerEdge, CardType, CardData, WorkspaceState } from '../types';

interface WorkspaceStore {
  // State
  workspaceId: string;
  workspaceName: string;
  nodes: MiplerNode[];
  edges: MiplerEdge[];
  viewport: { x: number; y: number; zoom: number };

  // Modals
  exportModalOpen: boolean;
  importModalOpen: boolean;
  customUrlModalOpen: boolean;

  // Actions
  setNodes: (nodes: MiplerNode[]) => void;
  setEdges: (edges: MiplerEdge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;

  addCard: (type: CardType, position?: { x: number; y: number }, extra?: Partial<CardData>) => string;
  updateCard: (id: string, data: Partial<CardData>) => void;
  removeCard: (id: string) => void;

  setExportModalOpen: (open: boolean) => void;
  setImportModalOpen: (open: boolean) => void;
  setCustomUrlModalOpen: (open: boolean) => void;

  // Serialization
  getWorkspaceState: () => WorkspaceState;
  loadWorkspaceState: (state: WorkspaceState) => void;
  clearWorkspace: () => void;
  setWorkspaceName: (name: string) => void;

  // Auto-save trigger
  lastModified: number;
}

const defaultCardData = (type: CardType, extra?: Partial<CardData>): CardData => {
  const now = new Date().toISOString();
  const base: CardData = {
    cardType: type,
    title: getDefaultTitle(type),
    content: '',
    width: getDefaultWidth(type),
    height: getDefaultHeight(type),
    createdAt: now,
    updatedAt: now,
    ...extra,
  };
  return base;
};

function getDefaultTitle(type: CardType): string {
  switch (type) {
    case 'note': return 'Note';
    case 'image': return 'Image';
    case 'pdf': return 'Document';
    case 'whois': return 'WHOIS Lookup';
    case 'dns': return 'DNS Lookup';
    case 'reverse-image': return 'Reverse Image Search';
    case 'osint-framework': return 'OSINT Framework';
    case 'custom-url': return 'Web Tool';
    default: return 'Card';
  }
}

function getDefaultWidth(type: CardType): number {
  switch (type) {
    case 'note': return 280;
    case 'image': return 300;
    case 'pdf': return 350;
    case 'whois': return 340;
    case 'dns': return 340;
    case 'reverse-image': return 420;
    case 'osint-framework': return 420;
    case 'custom-url': return 420;
    default: return 280;
  }
}

function getDefaultHeight(type: CardType): number {
  switch (type) {
    case 'note': return 200;
    case 'image': return 250;
    case 'pdf': return 400;
    case 'whois': return 320;
    case 'dns': return 320;
    case 'reverse-image': return 380;
    case 'osint-framework': return 380;
    case 'custom-url': return 380;
    default: return 200;
  }
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  workspaceId: uuidv4(),
  workspaceName: 'Untitled Investigation',
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },

  exportModalOpen: false,
  importModalOpen: false,
  customUrlModalOpen: false,

  lastModified: Date.now(),

  setNodes: (nodes) => set({ nodes, lastModified: Date.now() }),
  setEdges: (edges) => set({ edges, lastModified: Date.now() }),

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
      lastModified: Date.now(),
    }));
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
      lastModified: Date.now(),
    }));
  },

  onConnect: (connection) => {
    set((state) => ({
      edges: addEdge(
        {
          ...connection,
          id: `edge-${uuidv4()}`,
          type: 'rope',
          animated: false,
          style: { stroke: '#666', strokeWidth: 1.5 },
        },
        state.edges
      ),
      lastModified: Date.now(),
    }));
  },

  setViewport: (viewport) => set({ viewport }),

  addCard: (type, position, extra) => {
    const id = `card-${uuidv4()}`;
    const pos = position || {
      x: 100 + Math.random() * 400,
      y: 100 + Math.random() * 300,
    };
    const node: MiplerNode = {
      id,
      type: 'miplerCard',
      position: pos,
      data: defaultCardData(type, extra),
      dragHandle: '.card-drag-handle',
    };
    set((state) => ({
      nodes: [...state.nodes, node],
      lastModified: Date.now(),
    }));
    return id;
  },

  updateCard: (id, data) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id
          ? { ...n, data: { ...n.data, ...data, updatedAt: new Date().toISOString() } }
          : n
      ),
      lastModified: Date.now(),
    }));
  },

  removeCard: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.source !== id && e.target !== id),
      lastModified: Date.now(),
    }));
  },

  setExportModalOpen: (open) => set({ exportModalOpen: open }),
  setImportModalOpen: (open) => set({ importModalOpen: open }),
  setCustomUrlModalOpen: (open) => set({ customUrlModalOpen: open }),

  getWorkspaceState: (): WorkspaceState => {
    const state = get();
    return {
      id: state.workspaceId,
      name: state.workspaceName,
      nodes: state.nodes,
      edges: state.edges,
      viewport: state.viewport,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  loadWorkspaceState: (ws) => {
    set({
      workspaceId: ws.id,
      workspaceName: ws.name,
      nodes: ws.nodes,
      edges: ws.edges,
      viewport: ws.viewport,
      lastModified: Date.now(),
    });
  },

  clearWorkspace: () => {
    set({
      workspaceId: uuidv4(),
      workspaceName: 'Untitled Investigation',
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      lastModified: Date.now(),
    });
  },

  setWorkspaceName: (name) => set({ workspaceName: name, lastModified: Date.now() }),
}));