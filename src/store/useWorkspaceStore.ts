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
import type {
  MiplerNode,
  MiplerEdge,
  CardType,
  CardData,
  EdgeData,
  LineStyle,
  WorkspaceState,
  Investigation,
  AiMessage,
} from '../types';

// ── History for undo ──
interface HistoryEntry {
  nodes: MiplerNode[];
  edges: MiplerEdge[];
}

interface WorkspaceStore {
  // Multi-investigation
  investigations: Investigation[];
  activeInvestigationId: string;

  // Current canvas (derived from active investigation)
  nodes: MiplerNode[];
  edges: MiplerEdge[];
  viewport: { x: number; y: number; zoom: number };

  // Undo stack
  history: HistoryEntry[];
  historyIndex: number;

  // UI toggles
  showDots: boolean;
  exportModalOpen: boolean;
  importModalOpen: boolean;
  customUrlModalOpen: boolean;
  edgeStyleModalOpen: boolean;
  selectedEdgeId: string | null;
  aiPanelOpen: boolean;
  apiSettingsOpen: boolean;
  investigationMenuOpen: boolean;
  apiWorkspaceOpen: boolean;

  // Edge defaults
  defaultEdgeColor: string;
  defaultLineStyle: LineStyle;
  defaultStrokeWidth: number;

  // AI
  aiApiKey: string;
  llmBaseUrl: string;
  llmModel: string;
  aiProvider: string;
  aiChatHistory: AiMessage[];

  lastModified: number;

  // Node/Edge ops
  setNodes: (nodes: MiplerNode[]) => void;
  setEdges: (edges: MiplerEdge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setViewport: (vp: { x: number; y: number; zoom: number }) => void;

  // Card ops
  addCard: (type: CardType, position?: { x: number; y: number }, extra?: Partial<CardData>) => string;
  updateCard: (id: string, data: Partial<CardData>) => void;
  removeCard: (id: string) => void;
  setCardColor: (id: string, color: string) => void;

  // Edge style
  updateEdgeStyle: (id: string, data: Partial<EdgeData>) => void;
  setDefaultEdgeColor: (c: string) => void;
  setDefaultLineStyle: (s: LineStyle) => void;
  setDefaultStrokeWidth: (w: number) => void;

  // Undo
  pushHistory: () => void;
  undo: () => void;

  // Modal toggles
  setExportModalOpen: (o: boolean) => void;
  setImportModalOpen: (o: boolean) => void;
  setCustomUrlModalOpen: (o: boolean) => void;
  setEdgeStyleModalOpen: (o: boolean, edgeId?: string | null) => void;
  setAiPanelOpen: (o: boolean) => void;
  setApiSettingsOpen: (o: boolean) => void;
  setInvestigationMenuOpen: (o: boolean) => void;
  setApiWorkspaceOpen: (o: boolean) => void;
  setShowDots: (o: boolean) => void;

  // AI
  setAiApiKey: (key: string) => void;
  setAiProvider: (p: string) => void;
  setLlmBaseUrl: (u: string) => void;
  setLlmModel: (m: string) => void;
  addAiMessage: (msg: AiMessage) => void;
  clearAiChat: () => void;

  // Investigation management
  addInvestigation: () => string;
  removeInvestigation: (id: string) => void;
  switchInvestigation: (id: string) => void;
  renameInvestigation: (id: string, name: string) => void;
  combineInvestigations: () => void;
  getActiveInvestigation: () => Investigation;
  syncActiveInvestigation: () => void;

  // Serialization
  getWorkspaceState: () => WorkspaceState;
  loadWorkspaceState: (state: WorkspaceState) => void;
  importWorkspaceAsNew: (state: WorkspaceState) => void;
  clearWorkspace: () => void;
}

function getDefaultTitle(type: CardType): string {
  const t: Record<CardType, string> = {
    note: 'Note',
    image: 'Image',
    gif: 'GIF',
    video: 'Video',
    pdf: 'Document',
    whois: 'WHOIS Lookup',
    dns: 'DNS Lookup',
    'reverse-image': 'Reverse Image Search',
    'osint-framework': 'OSINT Framework',
    'custom-url': 'Web Tool',
  };
  return t[type] || 'Card';
}

function getDefaultWidth(type: CardType): number {
  const w: Record<CardType, number> = {
    note: 300,
    image: 320,
    gif: 320,
    video: 400,
    pdf: 360,
    whois: 360,
    dns: 360,
    'reverse-image': 440,
    'osint-framework': 440,
    'custom-url': 440,
  };
  return w[type] || 300;
}

const makeCardData = (type: CardType, extra?: Partial<CardData>): CardData => {
  const now = new Date().toISOString();
  return {
    cardType: type,
    title: getDefaultTitle(type),
    content: '',
    width: getDefaultWidth(type),
    cardColor: '#1e1e1e',
    createdAt: now,
    updatedAt: now,
    ...extra,
  };
};

function createInvestigation(name?: string): Investigation {
  return {
    id: uuidv4(),
    name: name || 'Untitled Investigation',
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  };
}

const dashMap: Record<LineStyle, string> = { dashed: '8 4', dotted: '2 4', solid: '0' };

// ── Helper to regenerate all IDs in an investigation ──
function regenerateIds(inv: Investigation): Investigation {
  const nodeIdMap: Record<string, string> = {};

  // Generate new IDs for all nodes
  const newNodes: MiplerNode[] = inv.nodes.map((node) => {
    const newId = `card-${uuidv4()}`;
    nodeIdMap[node.id] = newId;
    return {
      ...node,
      id: newId,
    };
  });

  // Generate new IDs for all edges and update source/target references
  const newEdges: MiplerEdge[] = inv.edges.map((edge) => {
    const newId = `edge-${uuidv4()}`;
    return {
      ...edge,
      id: newId,
      source: nodeIdMap[edge.source] || edge.source,
      target: nodeIdMap[edge.target] || edge.target,
    };
  });

  return {
    ...inv,
    id: uuidv4(),
    nodes: newNodes,
    edges: newEdges,
  };
}

const firstInv = createInvestigation();

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  investigations: [firstInv],
  activeInvestigationId: firstInv.id,
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },

  history: [],
  historyIndex: -1,

  showDots: true,
  exportModalOpen: false,
  importModalOpen: false,
  customUrlModalOpen: false,
  edgeStyleModalOpen: false,
  selectedEdgeId: null,
  aiPanelOpen: false,
  apiSettingsOpen: false,
  investigationMenuOpen: false,
  apiWorkspaceOpen: false,

  defaultEdgeColor: '#888888',
  defaultLineStyle: 'dashed',
  defaultStrokeWidth: 2,

  aiApiKey: '',
  llmBaseUrl: 'http://localhost:11434',
  llmModel: 'llama3',
  aiProvider: 'openai',
  aiChatHistory: [],

  lastModified: Date.now(),

  // ── Sync helpers ──
  syncActiveInvestigation: () => {
    const s = get();
    set({
      investigations: s.investigations.map((inv) =>
        inv.id === s.activeInvestigationId
          ? { ...inv, nodes: s.nodes, edges: s.edges, viewport: s.viewport }
          : inv
      ),
    });
  },

  getActiveInvestigation: () => {
    const s = get();
    return s.investigations.find((i) => i.id === s.activeInvestigationId) || s.investigations[0];
  },

  // ── History ──
  pushHistory: () => {
    const s = get();
    const entry: HistoryEntry = {
      nodes: JSON.parse(JSON.stringify(s.nodes)),
      edges: JSON.parse(JSON.stringify(s.edges)),
    };
    const newHistory = s.history.slice(0, s.historyIndex + 1);
    newHistory.push(entry);
    if (newHistory.length > 50) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const s = get();
    if (s.historyIndex < 0) return;
    const entry = s.history[s.historyIndex];
    if (!entry) return;
    set({
      nodes: JSON.parse(JSON.stringify(entry.nodes)),
      edges: JSON.parse(JSON.stringify(entry.edges)),
      historyIndex: s.historyIndex - 1,
      lastModified: Date.now(),
    });
    get().syncActiveInvestigation();
  },

  setNodes: (nodes) => set({ nodes, lastModified: Date.now() }),
  setEdges: (edges) => set({ edges, lastModified: Date.now() }),

  onNodesChange: (changes) => {
    set((s) => ({ nodes: applyNodeChanges(changes, s.nodes), lastModified: Date.now() }));
    get().syncActiveInvestigation();
  },

  onEdgesChange: (changes) => {
    set((s) => ({ edges: applyEdgeChanges(changes, s.edges) as MiplerEdge[], lastModified: Date.now() }));
    get().syncActiveInvestigation();
  },

  onConnect: (connection) => {
    const s = get();
    s.pushHistory();
    const edgeData: EdgeData = {
      color: s.defaultEdgeColor,
      lineStyle: s.defaultLineStyle,
      strokeWidth: s.defaultStrokeWidth,
    };
    set((state) => ({
      edges: addEdge(
        {
          ...connection,
          id: `edge-${uuidv4()}`,
          type: 'rope',
          animated: false,
          data: edgeData,
          style: {
            stroke: edgeData.color,
            strokeWidth: edgeData.strokeWidth,
            strokeDasharray: dashMap[edgeData.lineStyle],
          },
        },
        state.edges
      ) as MiplerEdge[],
      lastModified: Date.now(),
    }));
    get().syncActiveInvestigation();
  },

  setViewport: (viewport) => {
    set({ viewport });
    get().syncActiveInvestigation();
  },

  addCard: (type, position, extra) => {
    const s = get();
    s.pushHistory();
    const id = `card-${uuidv4()}`;

    // Calculate center of viewport if no position provided
    let pos = position;
    if (!pos) {
      const { x, y, zoom } = s.viewport;
      // Calculate viewport center in flow coordinates
      const centerX = (-x + 600) / zoom;
      const centerY = (-y + 400) / zoom;
      // Add small random offset to avoid stacking
      pos = {
        x: centerX + (Math.random() - 0.5) * 100,
        y: centerY + (Math.random() - 0.5) * 80,
      };
    }

    const node: MiplerNode = {
      id,
      type: 'miplerCard',
      position: pos,
      data: makeCardData(type, extra),
    };
    set((state) => ({ nodes: [...state.nodes, node], lastModified: Date.now() }));
    get().syncActiveInvestigation();
    return id;
  },

  updateCard: (id, data) => {
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...data, updatedAt: new Date().toISOString() } } : n
      ),
      lastModified: Date.now(),
    }));
    get().syncActiveInvestigation();
  },

  removeCard: (id) => {
    get().pushHistory();
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== id),
      edges: s.edges.filter((e) => e.source !== id && e.target !== id),
      lastModified: Date.now(),
    }));
    get().syncActiveInvestigation();
  },

  setCardColor: (id, color) => {
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, cardColor: color } } : n)),
      lastModified: Date.now(),
    }));
    get().syncActiveInvestigation();
  },

  updateEdgeStyle: (id, data) => {
    set((s) => ({
      edges: s.edges.map((e) => {
        if (e.id !== id) return e;
        const merged = {
          ...(e.data || { color: '#888', lineStyle: 'dashed' as LineStyle, strokeWidth: 2 }),
          ...data,
        };
        return {
          ...e,
          data: merged,
          style: {
            stroke: merged.color,
            strokeWidth: merged.strokeWidth,
            strokeDasharray: dashMap[merged.lineStyle],
          },
        };
      }) as MiplerEdge[],
      lastModified: Date.now(),
    }));
    get().syncActiveInvestigation();
  },

  setDefaultEdgeColor: (c) => set({ defaultEdgeColor: c }),
  setDefaultLineStyle: (s) => set({ defaultLineStyle: s }),
  setDefaultStrokeWidth: (w) => set({ defaultStrokeWidth: w }),

  setExportModalOpen: (o) => set({ exportModalOpen: o }),
  setImportModalOpen: (o) => set({ importModalOpen: o }),
  setCustomUrlModalOpen: (o) => set({ customUrlModalOpen: o }),
  setEdgeStyleModalOpen: (o, edgeId) => set({ edgeStyleModalOpen: o, selectedEdgeId: edgeId || null }),
  setAiPanelOpen: (o) => set({ aiPanelOpen: o }),
  setApiSettingsOpen: (o) => set({ apiSettingsOpen: o }),
  setInvestigationMenuOpen: (o) => set({ investigationMenuOpen: o }),
  setApiWorkspaceOpen: (o) => set({ apiWorkspaceOpen: o }),
  setShowDots: (o) => set({ showDots: o }),

  setAiApiKey: (key) => set({ aiApiKey: key }),
  setAiProvider: (p) => set({ aiProvider: p }),
  setLlmBaseUrl: (u) => set({ llmBaseUrl: u }),
  setLlmModel: (m) => set({ llmModel: m }),
  addAiMessage: (msg) => set((s) => ({ aiChatHistory: [...s.aiChatHistory, msg] })),
  clearAiChat: () => set({ aiChatHistory: [] }),

  // ── Investigation management ──
  addInvestigation: () => {
    const s = get();
    s.syncActiveInvestigation();
    const inv = createInvestigation();
    set({
      investigations: [...s.investigations, inv],
      activeInvestigationId: inv.id,
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      history: [],
      historyIndex: -1,
    });
    return inv.id;
  },

  removeInvestigation: (id) => {
    const s = get();
    if (s.investigations.length <= 1) return;
    const remaining = s.investigations.filter((i) => i.id !== id);
    const newActive =
      id === s.activeInvestigationId
        ? remaining[0]
        : s.investigations.find((i) => i.id === s.activeInvestigationId) || remaining[0];
    set({
      investigations: remaining,
      activeInvestigationId: newActive.id,
      nodes: newActive.nodes,
      edges: newActive.edges,
      viewport: newActive.viewport,
      history: [],
      historyIndex: -1,
    });
  },

  switchInvestigation: (id) => {
    const s = get();
    s.syncActiveInvestigation();
    const target = s.investigations.find((i) => i.id === id);
    if (!target) return;
    set({
      activeInvestigationId: id,
      nodes: target.nodes,
      edges: target.edges,
      viewport: target.viewport,
      history: [],
      historyIndex: -1,
    });
  },

  renameInvestigation: (id, name) => {
    set((s) => ({
      investigations: s.investigations.map((i) => (i.id === id ? { ...i, name } : i)),
    }));
  },

  combineInvestigations: () => {
    const s = get();
    s.syncActiveInvestigation();
    if (s.investigations.length < 2) return;

    const allNodes: MiplerNode[] = [];
    const allEdges: MiplerEdge[] = [];
    let offsetX = 0;
    const SPACING = 500; // Gap between workspaces

    for (let i = 0; i < s.investigations.length; i++) {
      const inv = s.investigations[i];
      const nodeIdMap: Record<string, string> = {};

      // Calculate bounds of this investigation
      let minX = Infinity;
      let maxX = -Infinity;
      for (const node of inv.nodes) {
        minX = Math.min(minX, node.position.x);
        maxX = Math.max(maxX, node.position.x + (node.data.width || 300));
      }

      // Handle empty investigations
      if (minX === Infinity) minX = 0;
      if (maxX === -Infinity) maxX = 0;

      // Normalize: shift all nodes so minX becomes offsetX
      const shiftX = offsetX - minX;

      for (const node of inv.nodes) {
        const newId = `card-${uuidv4()}`;
        nodeIdMap[node.id] = newId;
        allNodes.push({
          ...node,
          id: newId,
          position: {
            x: node.position.x + shiftX,
            y: node.position.y,
          },
        });
      }

      for (const edge of inv.edges) {
        allEdges.push({
          ...edge,
          id: `edge-${uuidv4()}`,
          source: nodeIdMap[edge.source] || edge.source,
          target: nodeIdMap[edge.target] || edge.target,
        });
      }

      // Update offsetX for next investigation
      const width = maxX - minX;
      offsetX = offsetX + width + SPACING;
    }

    // Restore edge styles
    for (const edge of allEdges) {
      if (edge.data) {
        edge.style = {
          stroke: edge.data.color || '#888',
          strokeWidth: edge.data.strokeWidth || 2,
          strokeDasharray: dashMap[edge.data.lineStyle || 'dashed'],
        };
      }
    }

    const combined = createInvestigation('Combined Investigation');
    combined.nodes = allNodes;
    combined.edges = allEdges;

    set({
      investigations: [combined],
      activeInvestigationId: combined.id,
      nodes: allNodes,
      edges: allEdges,
      viewport: { x: 0, y: 0, zoom: 0.4 },
      history: [],
      historyIndex: -1,
    });
  },

  getWorkspaceState: (): WorkspaceState => {
    const s = get();
    s.syncActiveInvestigation();
    return {
      id: uuidv4(),
      name: 'Mipler Export',
      investigations: s.investigations,
      activeInvestigationId: s.activeInvestigationId,
      aiApiKey: s.aiApiKey,
      aiProvider: s.aiProvider,
      llmBaseUrl: s.llmBaseUrl,
      llmModel: s.llmModel,
      aiChatHistory: s.aiChatHistory,
      showDots: s.showDots,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  // ── Import and REPLACE entire workspace (regenerate all IDs) ──
  loadWorkspaceState: (ws) => {
    // Handle legacy single-investigation format
    let investigations = ws.investigations;
    let activeId = ws.activeInvestigationId;

    if (!investigations || investigations.length === 0) {
      const inv = createInvestigation(ws.name || 'Imported');
      inv.nodes = ws.nodes || [];
      inv.edges = ws.edges || [];
      inv.viewport = ws.viewport || { x: 0, y: 0, zoom: 1 };
      investigations = [inv];
      activeId = inv.id;
    }

    // Regenerate ALL IDs so each import is unique
    const regeneratedInvestigations = investigations.map((inv) => regenerateIds(inv));

    // Restore edge styles
    for (const inv of regeneratedInvestigations) {
      for (const edge of inv.edges) {
        if (edge.data) {
          edge.style = {
            stroke: edge.data.color || '#888',
            strokeWidth: edge.data.strokeWidth || 2,
            strokeDasharray: dashMap[edge.data.lineStyle || 'dashed'],
          };
        }
      }
    }

    const active = regeneratedInvestigations[0];

    set({
      investigations: regeneratedInvestigations,
      activeInvestigationId: active.id,
      nodes: active.nodes,
      edges: active.edges,
      viewport: active.viewport,
      aiApiKey: ws.aiApiKey || '',
      aiProvider: ws.aiProvider || 'openai',
      llmBaseUrl: ws.llmBaseUrl || 'http://localhost:11434',
      llmModel: ws.llmModel || 'llama3',
      aiChatHistory: ws.aiChatHistory || [],
      showDots: ws.showDots !== undefined ? ws.showDots : true,
      history: [],
      historyIndex: -1,
      lastModified: Date.now(),
    });
  },

  // ── Import as NEW investigation (adds to existing workspace) ──
  importWorkspaceAsNew: (ws) => {
    const s = get();
    s.syncActiveInvestigation();

    // Handle legacy single-investigation format
    let investigations = ws.investigations;

    if (!investigations || investigations.length === 0) {
      const inv = createInvestigation(ws.name || 'Imported');
      inv.nodes = ws.nodes || [];
      inv.edges = ws.edges || [];
      inv.viewport = ws.viewport || { x: 0, y: 0, zoom: 1 };
      investigations = [inv];
    }

    // Regenerate ALL IDs so each import is unique
    const regeneratedInvestigations = investigations.map((inv) => regenerateIds(inv));

    // Restore edge styles
    for (const inv of regeneratedInvestigations) {
      for (const edge of inv.edges) {
        if (edge.data) {
          edge.style = {
            stroke: edge.data.color || '#888',
            strokeWidth: edge.data.strokeWidth || 2,
            strokeDasharray: dashMap[edge.data.lineStyle || 'dashed'],
          };
        }
      }
    }

    const newInvestigations = [...s.investigations, ...regeneratedInvestigations];
    const newActive = regeneratedInvestigations[0];

    set({
      investigations: newInvestigations,
      activeInvestigationId: newActive.id,
      nodes: newActive.nodes,
      edges: newActive.edges,
      viewport: newActive.viewport,
      history: [],
      historyIndex: -1,
      lastModified: Date.now(),
    });
  },

  clearWorkspace: () => {
    const inv = createInvestigation();
    set({
      investigations: [inv],
      activeInvestigationId: inv.id,
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
      history: [],
      historyIndex: -1,
      aiChatHistory: [],
      lastModified: Date.now(),
    });
  },
}));
