// Update getDefaultTitle function
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

// Update getDefaultWidth function
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

// Update addCard to place at viewport center
addCard: (type, position, extra) => {
  const s = get();
  s.pushHistory();
  const id = `card-${uuidv4()}`;
  
  // Calculate center of viewport
  let pos = position;
  if (!pos) {
    const { x, y, zoom } = s.viewport;
    // Assuming canvas is roughly 1200x800 (adjust as needed)
    const centerX = (-x + 600) / zoom;
    const centerY = (-y + 400) / zoom;
    // Add small random offset to avoid stacking
    pos = { 
      x: centerX + (Math.random() - 0.5) * 100, 
      y: centerY + (Math.random() - 0.5) * 80 
    };
  }
  
  const node: MiplerNode = { 
    id, 
    type: 'miplerCard', 
    position: pos, 
    data: makeCardData(type, extra) 
  };
  set((state) => ({ nodes: [...state.nodes, node], lastModified: Date.now() }));
  get().syncActiveInvestigation();
  return id;
},

// Update combineInvestigations with proper spacing
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
    let minX = Infinity, maxX = -Infinity;
    for (const node of inv.nodes) {
      minX = Math.min(minX, node.position.x);
      maxX = Math.max(maxX, node.position.x + (node.data.width || 300));
    }
    
    // Normalize: shift all nodes so minX becomes offsetX
    const shiftX = offsetX - (minX === Infinity ? 0 : minX);

    for (const node of inv.nodes) {
      const newId = `card-${uuidv4()}`;
      nodeIdMap[node.id] = newId;
      allNodes.push({ 
        ...node, 
        id: newId,
        position: { 
          x: node.position.x + shiftX, 
          y: node.position.y 
        } 
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
    const actualMaxX = maxX === -Infinity ? 0 : maxX;
    offsetX = (actualMaxX - (minX === Infinity ? 0 : minX)) + offsetX + SPACING;
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
