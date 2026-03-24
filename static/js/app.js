/* ═══════════════════════════════════════════════════════════
   Main Application - OSINT Investigation Workspace
   ═══════════════════════════════════════════════════════════ */

class OSINTWorkspace {
    constructor() {
        this.nodes = [];
        this.connections = [];
        this.selectedNodes = new Set();
        this.selectedConnection = null;
        this.clipboard = [];
        this.currentTool = 'select';
        this.connectingFrom = null;
        this.undoStack = [];
        this.redoStack = [];
        this.autoSaveTimer = null;
        this.socket = null;

        // Initialize managers
        this.modal = new ModalManager();
        this.canvas = new Canvas(this);
        this.nodeManager = new NodeManager(this);
        this.connectionManager = new ConnectionManager(this);
        this.sidebar = new Sidebar(this);
        this.toolbar = new Toolbar(this);
        this.minimap = new Minimap(this);
        this.contextMenu = new ContextMenuManager(this);
        this.workspaceManager = new WorkspaceManagerUI(this);
        this.exportManager = new ExportManager(this);

        // Setup
        this._setupSocket();
        this._setupSearch();
        this._setupInspector();
        this._loadLastWorkspace();

        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loading-screen').style.opacity = '0';
            document.getElementById('loading-screen').style.transition = 'opacity 0.5s';
            setTimeout(() => {
                document.getElementById('loading-screen').style.display = 'none';
                document.getElementById('app').classList.remove('hidden');
            }, 500);
        }, 1500);
    }

    // ── Socket ───────────────────────────────────────────────
    _setupSocket() {
        try {
            this.socket = io();
            this.socket.on('connected', () => console.log('WebSocket connected'));
            this.socket.on('save_confirmed', (data) => {
                this._updateSaveStatus('saved');
            });
            this.socket.on('tool_result', (data) => {
                this._handleToolResult(data);
            });
        } catch (err) {
            console.warn('WebSocket not available, using HTTP fallback');
        }
    }

    // ── Tool Management ──────────────────────────────────────
    setTool(tool) {
        this.currentTool = tool;
        this.toolbar.updateToolButtons(tool);
        if (tool !== 'connect') this.cancelConnection();
    }

    // ── Node Operations ──────────────────────────────────────
    handleDrop(data, x, y) {
        if (data.type === 'tool') {
            this.addToolNode(data.toolId, x, y);
        } else if (data.type === 'entity') {
            this.addEntityNode(data.entityType, x, y);
        }
    }

    addToolNode(toolId, x, y) {
        const toolData = this.sidebar.getToolData(toolId);
        if (!toolData) return;

        this.nodeManager.createNode({
            type: 'tool',
            toolId: toolId,
            title: toolData.name,
            icon: this.sidebar._getToolIcon(toolData.icon),
            color: toolData.color,
            inputs: toolData.inputs,
            x: x || 5000,
            y: y || 5000,
        });
    }

    addEntityNode(entityType, x, y) {
        const entityIcons = {
            person: '👤', organization: '🏢', domain: '🌐', ip: '📡',
            email: '📧', phone: '📱', location: '📍', social: '💬',
            document: '📄', image: '🖼️', cryptocurrency: '₿', hash: '#️⃣'
        };
        const entityColors = {
            person: '#e07a5f', organization: '#6b5b95', domain: '#4a6fa5',
            ip: '#81b29a', email: '#f2cc8f', phone: '#a8dadc',
            location: '#457b9d', social: '#bc6c25', document: '#606c38',
            image: '#dda15e', cryptocurrency: '#fca311', hash: '#8d99ae'
        };

        this.nodeManager.createNode({
            type: 'entity',
            entityType: entityType,
            title: entityType.charAt(0).toUpperCase() + entityType.slice(1),
            icon: entityIcons[entityType] || '📦',
            color: entityColors[entityType] || '#444444',
            x: x || 5000,
            y: y || 5000,
        });
    }

    addNote(x, y) {
        if (!x || !y) {
            const pos = this.canvas.screenToCanvas(window.innerWidth / 2, window.innerHeight / 2);
            x = pos.x; y = pos.y;
        }
        this.nodeManager.createNode({
            type: 'note',
            title: 'Note',
            icon: '📝',
            color: '#666633',
            x, y,
            width: 240,
        });
    }

    addLabel(x, y) {
        if (!x || !y) {
            const pos = this.canvas.screenToCanvas(window.innerWidth / 2, window.innerHeight / 2);
            x = pos.x; y = pos.y;
        }
        this.nodeManager.createNode({
            type: 'label',
            title: 'Label',
            x, y,
            values: { text: 'Label' },
        });
    }

    addGroup(x, y) {
        if (!x || !y) {
            const pos = this.canvas.screenToCanvas(window.innerWidth / 2, window.innerHeight / 2);
            x = pos.x; y = pos.y;
        }
        this.nodeManager.createNode({
            type: 'group',
            title: 'Group',
            x, y,
            width: 400,
            height: 300,
        });
    }

    getNode(id) {
        return this.nodes.find(n => n.id === id);
    }

    // ── Selection ────────────────────────────────────────────
    selectNode(id) {
        this.selectedNodes.add(id);
        document.getElementById(id)?.classList.add('selected');
        this.minimap.update();
    }

    deselectAll() {
        for (const id of this.selectedNodes) {
            document.getElementById(id)?.classList.remove('selected');
        }
        this.selectedNodes.clear();
        this.selectedConnection = null;
        this.minimap.update();
    }

    selectAll() {
        for (const node of this.nodes) {
            this.selectNode(node.id);
        }
    }

    selectNodesInRect(screenRect) {
        for (const node of this.nodes) {
            const nodeScreen = this.canvas.canvasToScreen(node.x, node.y);
            if (Utils.pointInRect(nodeScreen.x, nodeScreen.y,
                screenRect.x, screenRect.y, screenRect.w, screenRect.h)) {
                this.selectNode(node.id);
            }
        }
    }

    deleteSelected() {
        if (this.selectedConnection) {
            this.connectionManager.removeConnection(this.selectedConnection);
            this.selectedConnection = null;
            return;
        }

        for (const id of [...this.selectedNodes]) {
            this.nodeManager.deleteNode(id);
        }
        this.selectedNodes.clear();
    }

    duplicateSelected() {
        for (const id of [...this.selectedNodes]) {
            this.nodeManager.duplicateNode(id);
        }
    }

    copyNode(nodeId) {
        const node = this.getNode(nodeId);
        if (node) {
            this.clipboard = [JSON.parse(JSON.stringify(node))];
            Utils.showNotification('Copied', 'info');
        }
    }

    paste(x, y) {
        for (const item of this.clipboard) {
            this.nodeManager.createNode({
                ...item,
                id: Utils.generateId(),
                x: x || item.x + 30,
                y: y || item.y + 30,
            });
        }
    }

    // ── Connections ──────────────────────────────────────────
    startConnection(fromId) {
        this.connectingFrom = fromId;
        this.connectionManager.startTempLine(fromId);
        this.canvas.container.style.cursor = 'crosshair';
    }

    completeConnection(toId) {
        if (this.connectingFrom && this.connectingFrom !== toId) {
            this.connectionManager.createConnection(this.connectingFrom, toId);
        }
        this.cancelConnection();
    }

    cancelConnection() {
        this.connectingFrom = null;
        this.connectionManager.removeTempLine();
        this.canvas.container.style.cursor = 'default';
    }

    // ── Tool Execution ───────────────────────────────────────
    async runTool(nodeId) {
        const node = this.getNode(nodeId);
        if (!node || node.type !== 'tool' || !node.toolId) return;

        node.status = 'running';
        this.nodeManager.updateNode(nodeId);

        try {
            const result = await Utils.fetchJSON(`/api/tools/${node.toolId}/run`, {
                method: 'POST',
                body: JSON.stringify({ params: node.values }),
            });

            node.result = result;
            node.status = result.status === 'error' ? 'error' : 'success';
            this.nodeManager.updateNode(nodeId);

            if (result.status === 'error') {
                Utils.showNotification(`Error: ${result.error || 'Unknown error'}`, 'error');
            } else {
                Utils.showNotification(`${node.title} completed`, 'success');
            }
        } catch (err) {
            node.status = 'error';
            node.result = { status: 'error', error: err.message, data: null };
            this.nodeManager.updateNode(nodeId);
            Utils.showNotification(`Failed: ${err.message}`, 'error');
        }

        this.autoSave();
    }

    _handleToolResult(data) {
        const node = this.getNode(data.node_id);
        if (node) {
            node.result = data.result || { error: data.error };
            node.status = data.status === 'error' ? 'error' : 'success';
            this.nodeManager.updateNode(data.node_id);
        }
    }

    showResult(nodeId) {
        const node = this.getNode(nodeId);
        if (!node || !node.result) return;

        const html = `<pre style="max-height:400px;overflow:auto;background:var(--bg-primary);padding:12px;border-radius:4px;font-size:11px">${Utils.escapeHtml(JSON.stringify(node.result, null, 2))}</pre>`;
        this.modal.show(`Results: ${node.title}`, html, [
            { id: 'close', text: 'Close', class: '', onClick: () => this.modal.close() },
        ]);
    }

    // ── Context Menus ────────────────────────────────────────
    showNodeContextMenu(x, y, nodeId) {
        this.contextMenu.showNodeMenu(x, y, nodeId);
    }

    showEntityPicker(x, y) {
        const types = ['person', 'organization', 'domain', 'ip', 'email', 'phone', 'location', 'social'];
        let html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
        const icons = {
            person: '👤', organization: '🏢', domain: '🌐', ip: '📡',
            email: '📧', phone: '📱', location: '📍', social: '💬'
        };
        for (const t of types) {
            html += `<button class="modal-btn entity-pick" data-entity="${t}" style="padding:12px;text-align:center">${icons[t]} ${t.charAt(0).toUpperCase() + t.slice(1)}</button>`;
        }
        html += '</div>';

        this.modal.show('Add Entity', html, [
            { id: 'close', text: 'Cancel', class: '', onClick: () => this.modal.close() },
        ]);

        document.querySelectorAll('.entity-pick').forEach(btn => {
            btn.addEventListener('click', () => {
                this.addEntityNode(btn.dataset.entity, x, y);
                this.modal.close();
            });
        });
    }

    showToolPicker(x, y) {
        const tools = this.sidebar.tools || [];
        let html = '<div style="display:flex;flex-direction:column;gap:6px;max-height:400px;overflow-y:auto">';
        for (const tool of tools) {
            html += `<button class="modal-btn tool-pick" data-tool="${tool.id}" style="padding:10px;text-align:left">
                ${this.sidebar._getToolIcon(tool.icon)} ${tool.name}
                <span style="font-size:10px;color:var(--text-muted);margin-left:8px">${tool.description}</span>
            </button>`;
        }
        html += '</div>';

        this.modal.show('Add Tool Node', html, [
            { id: 'close', text: 'Cancel', class: '', onClick: () => this.modal.close() },
        ]);

        document.querySelectorAll('.tool-pick').forEach(btn => {
            btn.addEventListener('click', () => {
                this.addToolNode(btn.dataset.tool, x, y);
                this.modal.close();
            });
        });
    }

    showColorPicker(nodeId) {
        const colors = [
            '#e07a5f', '#6b5b95', '#4a6fa5', '#81b29a', '#f2cc8f',
            '#bc6c25', '#457b9d', '#606c38', '#a8dadc', '#dda15e',
            '#444444', '#666666', '#888888', '#e63946', '#2a9d8f',
        ];
        let html = '<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">';
        for (const c of colors) {
            html += `<button class="color-pick" data-color="${c}" style="width:36px;height:36px;border-radius:50%;border:2px solid transparent;background:${c};cursor:pointer"></button>`;
        }
        html += '</div>';

        this.modal.show('Choose Color', html, [
            { id: 'close', text: 'Cancel', class: '', onClick: () => this.modal.close() },
        ]);

        document.querySelectorAll('.color-pick').forEach(btn => {
            btn.addEventListener('click', () => {
                const node = this.getNode(nodeId);
                if (node) {
                    node.color = btn.dataset.color;
                    this.nodeManager.updateNode(nodeId);
                }
                this.modal.close();
            });
        });
    }

    // ── Inspector ────────────────────────────────────────────
    _setupInspector() {
        document.getElementById('inspector-close')?.addEventListener('click', () => this.closeInspector());
    }

    openInspector(nodeId) {
        const node = this.getNode(nodeId);
        if (!node) return;

        const inspector = document.getElementById('inspector');
        const title = document.getElementById('inspector-title');
        const content = document.getElementById('inspector-content');

        title.textContent = node.title;

        let html = '';

        // Basic info
        html += `<div class="inspector-field">
            <label class="inspector-label">Title</label>
            <input class="inspector-input" id="insp-title" value="${Utils.escapeHtml(node.title)}">
        </div>`;

        html += `<div class="inspector-field">
            <label class="inspector-label">Type</label>
            <input class="inspector-input" value="${node.type}" disabled>
        </div>`;

        html += `<div class="inspector-field">
            <label class="inspector-label">Notes</label>
            <textarea class="inspector-input inspector-textarea" id="insp-notes" placeholder="Add investigation notes...">${Utils.escapeHtml(node.notes || '')}</textarea>
        </div>`;

        // Values
        if (node.inputs && node.inputs.length > 0) {
            html += '<hr style="border:none;border-top:1px solid var(--border-primary);margin:12px 0">';
            html += '<div class="inspector-label" style="margin-bottom:8px">Parameters</div>';
            for (const input of node.inputs) {
                html += `<div class="inspector-field">
                    <label class="inspector-label">${input.label}</label>
                    <input class="inspector-input" id="insp-val-${input.name}" value="${Utils.escapeHtml(String(node.values[input.name] || ''))}">
                </div>`;
            }
        }

        // Results
        if (node.result) {
            html += '<hr style="border:none;border-top:1px solid var(--border-primary);margin:12px 0">';
            html += '<div class="inspector-label" style="margin-bottom:8px">Results</div>';
            html += `<pre style="background:var(--bg-primary);padding:8px;border-radius:4px;font-size:10px;max-height:300px;overflow:auto">${Utils.escapeHtml(JSON.stringify(node.result, null, 2))}</pre>`;
        }

        content.innerHTML = html;

        // Events
        document.getElementById('insp-title')?.addEventListener('input', (e) => {
            node.title = e.target.value;
            this.nodeManager.updateNode(nodeId);
        });
        document.getElementById('insp-notes')?.addEventListener('input', (e) => {
            node.notes = e.target.value;
            this.autoSave();
        });

        if (node.inputs) {
            for (const input of node.inputs) {
                const el = document.getElementById(`insp-val-${input.name}`);
                el?.addEventListener('input', (e) => {
                    node.values[input.name] = e.target.value;
                    this.nodeManager.updateNode(nodeId);
                });
            }
        }

        inspector.classList.remove('hidden');
    }

    closeInspector() {
        document.getElementById('inspector').classList.add('hidden');
    }

    // ── Search ───────────────────────────────────────────────
    _setupSearch() {
        const searchOverlay = document.getElementById('search-overlay');
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');

        searchOverlay.addEventListener('click', (e) => {
            if (e.target === searchOverlay) this.closeSearch();
        });

        searchInput?.addEventListener('input', Utils.debounce(() => {
            const q = searchInput.value.toLowerCase();
            if (!q) { searchResults.innerHTML = ''; return; }

            let html = '';
            for (const node of this.nodes) {
                const title = (node.title || '').toLowerCase();
                const values = JSON.stringify(node.values || {}).toLowerCase();
                const notes = (node.notes || '').toLowerCase();

                if (title.includes(q) || values.includes(q) || notes.includes(q)) {
                    html += `<div class="search-result-item" data-node-id="${node.id}">
                        <div style="font-weight:500">${node.icon || '📦'} ${Utils.escapeHtml(node.title)}</div>
                        <div style="font-size:11px;color:var(--text-muted)">${node.type}</div>
                    </div>`;
                }
            }

            searchResults.innerHTML = html || '<div style="padding:12px;color:var(--text-muted);text-align:center">No results found</div>';

            searchResults.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const node = this.getNode(item.dataset.nodeId);
                    if (node) {
                        this.deselectAll();
                        this.selectNode(node.id);
                        // Center on node
                        const rect = this.canvas.container.getBoundingClientRect();
                        this.canvas.x = rect.width / 2 - node.x * this.canvas.zoom;
                        this.canvas.y = rect.height / 2 - node.y * this.canvas.zoom;
                        this.canvas.updateTransform();
                    }
                    this.closeSearch();
                });
            });
        }, 200));
    }

    toggleSearch() {
        const overlay = document.getElementById('search-overlay');
        if (overlay.classList.contains('hidden')) {
            overlay.classList.remove('hidden');
            document.getElementById('search-input')?.focus();
        } else {
            this.closeSearch();
        }
    }

    closeSearch() {
        document.getElementById('search-overlay').classList.add('hidden');
        document.getElementById('search-input').value = '';
        document.getElementById('search-results').innerHTML = '';
    }

    // ── Settings ─────────────────────────────────────────────
    showSettings() {
        const html = `
            <div class="form-group">
                <label><input type="checkbox" id="set-grid" ${this.canvas.snapToGrid ? 'checked' : ''}> Snap to Grid</label>
            </div>
            <div class="form-group">
                <label>Grid Size</label>
                <input type="number" id="set-grid-size" value="${this.canvas.gridSize}" min="5" max="50">
            </div>
            <div class="form-group">
                <label>Auto-save Interval (seconds)</label>
                <input type="number" id="set-autosave" value="5" min="1" max="60">
            </div>
            <hr style="border:none;border-top:1px solid var(--border-primary);margin:12px 0">
            <p style="font-size:11px;color:var(--text-muted)">
                OSINT Workspace v1.0.0<br>
                All data stored locally<br>
                No API keys · No telemetry · Open source
            </p>
        `;

        this.modal.show('Settings', html, [
            { id: 'save', text: 'Save', class: 'primary', onClick: () => {
                this.canvas.snapToGrid = document.getElementById('set-grid')?.checked ?? true;
                this.canvas.gridSize = parseInt(document.getElementById('set-grid-size')?.value) || 20;
                this.modal.close();
                Utils.showNotification('Settings saved', 'success');
            }},
            { id: 'close', text: 'Cancel', class: '', onClick: () => this.modal.close() },
        ]);
    }

    // ── Save/Load ────────────────────────────────────────────
    autoSave() {
        clearTimeout(this.autoSaveTimer);
        this._updateSaveStatus('saving');
        this.autoSaveTimer = setTimeout(async () => {
            const success = await this.workspaceManager.save();
            this._updateSaveStatus(success ? 'saved' : 'error');
            this.minimap.update();
        }, 2000);
    }

    async forceSave() {
        this._updateSaveStatus('saving');
        const success = await this.workspaceManager.save();
        this._updateSaveStatus(success ? 'saved' : 'error');
        if (success) Utils.showNotification('Saved', 'success');
    }

    _updateSaveStatus(status) {
        const el = document.getElementById('save-status');
        if (!el) return;
        switch (status) {
            case 'saved':
                el.textContent = '● Saved';
                el.className = 'save-status';
                break;
            case 'saving':
                el.textContent = '● Saving...';
                el.className = 'save-status saving';
                break;
            case 'error':
                el.textContent = '● Error';
                el.className = 'save-status error';
                break;
        }
    }

    async _loadLastWorkspace() {
        try {
            const workspaces = await Utils.fetchJSON('/api/workspaces');
            if (workspaces.length > 0) {
                await this.workspaceManager.loadWorkspace(workspaces[0].id);
            } else {
                // Create default workspace
                const ws = await Utils.fetchJSON('/api/workspaces', {
                    method: 'POST',
                    body: JSON.stringify({ name: 'My First Investigation' }),
                });
                this.workspaceManager.loadWorkspaceData(ws);
            }
        } catch (err) {
            console.error('Failed to load workspace:', err);
            // Create a default in-memory workspace
            this.workspaceManager.currentWorkspaceId = null;
        }
    }

    // ── Undo/Redo (simplified) ──────────────────────────────
    undo() {
        Utils.showNotification('Undo (snapshot-based undo coming soon)', 'info');
    }

    redo() {
        Utils.showNotification('Redo (snapshot-based redo coming soon)', 'info');
    }

    // ── Zoom Display ─────────────────────────────────────────
    updateZoomDisplay() {
        document.getElementById('zoom-level').textContent = Math.round(this.canvas.zoom * 100) + '%';
    }

    onCanvasChanged() {
        this.updateZoomDisplay();
        this.minimap.update();
    }
}

// ── Initialize ────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    window.app = new OSINTWorkspace();
});