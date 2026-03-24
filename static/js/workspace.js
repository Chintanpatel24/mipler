/* ═══════════════════════════════════════════════════════════
   Workspace Manager (Frontend)
   ═══════════════════════════════════════════════════════════ */

class WorkspaceManagerUI {
    constructor(app) {
        this.app = app;
        this.currentWorkspaceId = null;
    }

    async showWorkspaceDialog() {
        try {
            const workspaces = await Utils.fetchJSON('/api/workspaces');
            let html = '<div style="margin-bottom:16px">';
            html += '<button class="modal-btn primary" id="btn-new-workspace" style="width:100%">+ New Investigation</button>';
            html += '</div>';

            if (workspaces.length === 0) {
                html += '<p style="text-align:center;color:var(--text-muted);padding:20px">No workspaces yet. Create your first investigation!</p>';
            } else {
                html += '<ul class="workspace-list">';
                for (const ws of workspaces) {
                    html += `
                    <li class="workspace-list-item" data-ws-id="${ws.id}">
                        <div class="workspace-meta">
                            <h4>${Utils.escapeHtml(ws.name)}</h4>
                            <p>${ws.node_count} nodes · ${ws.connection_count} connections · ${ws.modified ? new Date(ws.modified).toLocaleDateString() : 'Unknown'}</p>
                        </div>
                        <div class="workspace-actions">
                            <button class="open-ws" data-ws-id="${ws.id}">Open</button>
                            <button class="delete-ws" data-ws-id="${ws.id}">Delete</button>
                        </div>
                    </li>`;
                }
                html += '</ul>';
            }

            this.app.modal.show('Workspaces', html, [
                { id: 'close', text: 'Close', class: '', onClick: () => this.app.modal.close() },
            ]);

            // Event handlers
            document.getElementById('btn-new-workspace')?.addEventListener('click', () => {
                this.app.modal.close();
                this.showNewWorkspaceDialog();
            });

            document.querySelectorAll('.open-ws').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.loadWorkspace(btn.dataset.wsId);
                    this.app.modal.close();
                });
            });

            document.querySelectorAll('.workspace-list-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.loadWorkspace(item.dataset.wsId);
                    this.app.modal.close();
                });
            });

            document.querySelectorAll('.delete-ws').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (confirm('Delete this workspace? This cannot be undone.')) {
                        await Utils.fetchJSON(`/api/workspaces/${btn.dataset.wsId}`, { method: 'DELETE' });
                        this.showWorkspaceDialog();
                    }
                });
            });

        } catch (err) {
            console.error('Failed to load workspaces:', err);
            Utils.showNotification('Failed to load workspaces', 'error');
        }
    }

    showNewWorkspaceDialog() {
        this.app.modal.prompt('New Investigation', [
            { name: 'name', label: 'Investigation Name', placeholder: 'Operation Alpha', value: '' },
            { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Brief description...' },
        ], async (values) => {
            try {
                const ws = await Utils.fetchJSON('/api/workspaces', {
                    method: 'POST',
                    body: JSON.stringify(values),
                });
                this.loadWorkspaceData(ws);
                Utils.showNotification('Investigation created', 'success');
            } catch (err) {
                Utils.showNotification('Failed to create workspace', 'error');
            }
        });
    }

    async loadWorkspace(wsId) {
        try {
            const data = await Utils.fetchJSON(`/api/workspaces/${wsId}`);
            this.loadWorkspaceData(data);
            Utils.showNotification(`Loaded: ${data.name}`, 'success');
        } catch (err) {
            Utils.showNotification('Failed to load workspace', 'error');
        }
    }

    loadWorkspaceData(data) {
        this.currentWorkspaceId = data.id;
        this.app.nodes = [];
        this.app.connections = [];

        // Clear canvas
        document.getElementById('nodes-layer').innerHTML = '';
        document.getElementById('connections-svg').innerHTML = '';

        // Set workspace name
        document.getElementById('workspace-name').textContent = data.name || 'Untitled Investigation';

        // Load nodes
        if (data.nodes) {
            for (const nodeData of data.nodes) {
                this.app.nodes.push(nodeData);
                this.app.nodeManager.renderNode(nodeData);
            }
        }

        // Load connections
        if (data.connections) {
            this.app.connections = data.connections;
            this.app.connectionManager.updateConnections();
        }

        // Restore viewport
        if (data.viewport) {
            this.app.canvas.setViewport(data.viewport);
        }

        this.app.updateZoomDisplay();
        this.app.minimap.update();
    }

    getWorkspaceData() {
        return {
            id: this.currentWorkspaceId,
            name: document.getElementById('workspace-name')?.textContent || 'Untitled',
            nodes: this.app.nodes,
            connections: this.app.connections,
            groups: [],
            viewport: this.app.canvas.getViewport(),
            modified: new Date().toISOString(),
        };
    }

    async save() {
        if (!this.currentWorkspaceId) {
            // Create new workspace
            const data = this.getWorkspaceData();
            data.name = document.getElementById('workspace-name')?.textContent || 'Untitled';
            try {
                const ws = await Utils.fetchJSON('/api/workspaces', {
                    method: 'POST',
                    body: JSON.stringify({ name: data.name }),
                });
                this.currentWorkspaceId = ws.id;
                data.id = ws.id;
            } catch (err) {
                console.error('Failed to create workspace:', err);
                return false;
            }
        }

        try {
            const data = this.getWorkspaceData();
            await Utils.fetchJSON(`/api/workspaces/${this.currentWorkspaceId}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });
            return true;
        } catch (err) {
            console.error('Failed to save:', err);
            return false;
        }
    }
}