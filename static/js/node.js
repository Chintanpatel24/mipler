/* ═══════════════════════════════════════════════════════════
   Node Manager - Create, render, manage nodes
   ═══════════════════════════════════════════════════════════ */

class NodeManager {
    constructor(app) {
        this.app = app;
    }

    createNode(config) {
        const node = {
            id: config.id || Utils.generateId(),
            type: config.type || 'tool',         // tool, entity, note, label, group
            toolId: config.toolId || null,
            entityType: config.entityType || null,
            title: config.title || 'Untitled',
            x: config.x || 5000,
            y: config.y || 5000,
            width: config.width || 220,
            height: config.height || null,
            color: config.color || '#444444',
            icon: config.icon || '📦',
            inputs: config.inputs || [],
            values: config.values || {},
            result: config.result || null,
            status: config.status || 'idle',      // idle, running, success, error
            notes: config.notes || '',
            collapsed: config.collapsed || false,
            locked: config.locked || false,
        };

        this.app.nodes.push(node);
        this.renderNode(node);
        this.app.autoSave();
        return node;
    }

    renderNode(node) {
        const existing = document.getElementById(node.id);
        if (existing) existing.remove();

        const el = document.createElement('div');
        el.id = node.id;
        el.className = `node ${node.type}-node`;
        if (node.type === 'group') el.className += ' group-node';
        el.style.left = node.x + 'px';
        el.style.top = node.y + 'px';
        if (node.width) el.style.width = node.width + 'px';
        if (node.height) el.style.minHeight = node.height + 'px';

        if (node.type === 'note') {
            el.innerHTML = this._renderNoteNode(node);
        } else if (node.type === 'label') {
            el.innerHTML = this._renderLabelNode(node);
        } else if (node.type === 'group') {
            el.innerHTML = this._renderGroupNode(node);
        } else {
            el.innerHTML = this._renderStandardNode(node);
        }

        // Add ports
        if (node.type !== 'label' && node.type !== 'group') {
            const inputPort = document.createElement('div');
            inputPort.className = 'node-port input';
            inputPort.dataset.nodeId = node.id;
            inputPort.dataset.portType = 'input';
            el.appendChild(inputPort);

            const outputPort = document.createElement('div');
            outputPort.className = 'node-port output';
            outputPort.dataset.nodeId = node.id;
            outputPort.dataset.portType = 'output';
            el.appendChild(outputPort);
        }

        this._setupNodeEvents(el, node);
        document.getElementById('nodes-layer').appendChild(el);
    }

    _renderStandardNode(node) {
        let html = `
        <div class="node-header">
            <div class="node-color-bar" style="background:${node.color}"></div>
            <span class="node-icon">${node.icon}</span>
            <span class="node-title">${Utils.escapeHtml(node.title)}</span>
            <span class="node-status ${node.status}"></span>
        </div>`;

        if (!node.collapsed) {
            html += '<div class="node-body">';

            // Input fields
            if (node.inputs && node.inputs.length > 0) {
                for (const input of node.inputs) {
                    const val = node.values[input.name] || '';
                    html += `<div class="field">
                        <div class="field-label">${Utils.escapeHtml(input.label)}</div>
                        <div class="field-value">`;

                    if (input.type === 'select') {
                        html += `<select data-field="${input.name}">`;
                        for (const opt of input.options || []) {
                            const sel = val === opt ? 'selected' : '';
                            html += `<option value="${opt}" ${sel}>${opt}</option>`;
                        }
                        html += '</select>';
                    } else if (input.type === 'multiselect') {
                        html += `<select data-field="${input.name}" multiple size="3">`;
                        const selectedVals = Array.isArray(val) ? val : (input.default || []);
                        for (const opt of input.options || []) {
                            const sel = selectedVals.includes(opt) ? 'selected' : '';
                            html += `<option value="${opt}" ${sel}>${opt}</option>`;
                        }
                        html += '</select>';
                    } else {
                        html += `<input type="text" data-field="${input.name}" 
                                    value="${Utils.escapeHtml(String(val))}" 
                                    placeholder="${input.placeholder || ''}">`;
                    }

                    html += '</div></div>';
                }
            }

            // Entity info
            if (node.type === 'entity') {
                html += `<div class="field">
                    <div class="field-label">Value</div>
                    <div class="field-value">
                        <input type="text" data-field="value" 
                            value="${Utils.escapeHtml(node.values.value || '')}" 
                            placeholder="Enter value...">
                    </div>
                </div>`;
                if (node.notes) {
                    html += `<div class="field">
                        <div class="field-label">Notes</div>
                        <div class="field-value" style="color:var(--text-muted);font-size:10px">
                            ${Utils.escapeHtml(node.notes).substring(0, 100)}
                        </div>
                    </div>`;
                }
            }

            // Results
            if (node.result && node.result.data) {
                html += Utils.formatResultSimple(node.result.data);
            }

            html += '</div>';

            // Footer with run button for tool nodes
            if (node.type === 'tool') {
                html += `<div class="node-footer">
                    <button class="node-btn run" data-action="run" data-node-id="${node.id}">▶ Run</button>
                    ${node.result ? '<button class="node-btn view" data-action="view-result" data-node-id="' + node.id + '">View</button>' : ''}
                </div>`;
            }
        }

        return html;
    }

    _renderNoteNode(node) {
        return `
        <div class="node-header">
            <span class="node-icon">📝</span>
            <span class="node-title">Note</span>
        </div>
        <div class="node-body">
            <textarea data-field="content" placeholder="Write your notes...">${Utils.escapeHtml(node.values.content || '')}</textarea>
        </div>`;
    }

    _renderLabelNode(node) {
        return `
        <div class="node-body">
            <input class="label-text" data-field="text" value="${Utils.escapeHtml(node.values.text || 'Label')}" placeholder="Label...">
        </div>`;
    }

    _renderGroupNode(node) {
        return `
        <div class="node-header">
            <span class="node-title">${Utils.escapeHtml(node.title)}</span>
        </div>`;
    }

    _setupNodeEvents(el, node) {
        let isDragging = false;
        let dragStart = { x: 0, y: 0 };
        let nodeStart = { x: 0, y: 0 };

        // Dragging
        el.addEventListener('mousedown', (e) => {
            if (e.target.matches('input, textarea, select, button, .node-port')) return;
            if (e.button !== 0) return;

            // Connection mode
            if (this.app.currentTool === 'connect') {
                this.app.startConnection(node.id);
                e.stopPropagation();
                return;
            }

            isDragging = true;
            dragStart = { x: e.clientX, y: e.clientY };
            nodeStart = { x: node.x, y: node.y };

            if (!e.shiftKey) {
                if (!this.app.selectedNodes.has(node.id)) {
                    this.app.deselectAll();
                }
            }
            this.app.selectNode(node.id);

            e.stopPropagation();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const dx = (e.clientX - dragStart.x) / this.app.canvas.zoom;
            const dy = (e.clientY - dragStart.y) / this.app.canvas.zoom;

            let newX = nodeStart.x + dx;
            let newY = nodeStart.y + dy;

            if (this.app.canvas.snapToGrid) {
                newX = Utils.snapToGrid(newX, this.app.canvas.gridSize);
                newY = Utils.snapToGrid(newY, this.app.canvas.gridSize);
            }

            // Move all selected nodes
            if (this.app.selectedNodes.size > 1 && this.app.selectedNodes.has(node.id)) {
                const offsetX = newX - node.x;
                const offsetY = newY - node.y;
                for (const id of this.app.selectedNodes) {
                    const n = this.app.getNode(id);
                    if (n) {
                        n.x += offsetX;
                        n.y += offsetY;
                        const nel = document.getElementById(n.id);
                        if (nel) {
                            nel.style.left = n.x + 'px';
                            nel.style.top = n.y + 'px';
                        }
                    }
                }
            } else {
                node.x = newX;
                node.y = newY;
                el.style.left = newX + 'px';
                el.style.top = newY + 'px';
            }

            this.app.connectionManager.updateConnections();
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.app.autoSave();
            }
        });

        // Port events
        el.querySelectorAll('.node-port').forEach(port => {
            port.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                if (port.dataset.portType === 'output') {
                    this.app.startConnection(node.id);
                }
            });
            port.addEventListener('mouseup', (e) => {
                e.stopPropagation();
                if (this.app.connectingFrom && this.app.connectingFrom !== node.id) {
                    this.app.completeConnection(node.id);
                }
            });
        });

        // Input changes
        el.querySelectorAll('input, textarea, select').forEach(input => {
            const handler = () => {
                const field = input.dataset.field;
                if (field) {
                    if (input.tagName === 'SELECT' && input.multiple) {
                        node.values[field] = Array.from(input.selectedOptions).map(o => o.value);
                    } else {
                        node.values[field] = input.value;
                    }
                    this.app.autoSave();
                }
            };
            input.addEventListener('input', handler);
            input.addEventListener('change', handler);
        });

        // Button actions
        el.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const nodeId = btn.dataset.nodeId;
                if (action === 'run') this.app.runTool(nodeId);
                if (action === 'view-result') this.app.showResult(nodeId);
            });
        });

        // Right click
        el.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.app.selectNode(node.id);
            this.app.showNodeContextMenu(e.clientX, e.clientY, node.id);
        });

        // Double-click to open inspector
        el.addEventListener('dblclick', (e) => {
            if (e.target.matches('input, textarea, select')) return;
            this.app.openInspector(node.id);
        });
    }

    updateNode(nodeId) {
        const node = this.app.getNode(nodeId);
        if (node) {
            this.renderNode(node);
            if (this.app.selectedNodes.has(nodeId)) {
                document.getElementById(nodeId)?.classList.add('selected');
            }
        }
    }

    deleteNode(nodeId) {
        const idx = this.app.nodes.findIndex(n => n.id === nodeId);
        if (idx !== -1) {
            this.app.nodes.splice(idx, 1);
            document.getElementById(nodeId)?.remove();
            this.app.connectionManager.removeConnectionsForNode(nodeId);
            this.app.selectedNodes.delete(nodeId);
            this.app.autoSave();
        }
    }

    duplicateNode(nodeId) {
        const orig = this.app.getNode(nodeId);
        if (!orig) return null;

        return this.createNode({
            ...JSON.parse(JSON.stringify(orig)),
            id: Utils.generateId(),
            x: orig.x + 30,
            y: orig.y + 30,
            result: null,
            status: 'idle',
        });
    }
}