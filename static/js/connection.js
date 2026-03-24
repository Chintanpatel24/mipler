/* ═══════════════════════════════════════════════════════════
   Connection Manager - Lines between nodes
   ═══════════════════════════════════════════════════════════ */

class ConnectionManager {
    constructor(app) {
        this.app = app;
        this.svgLayer = document.getElementById('connections-svg');
        this.tempLine = null;
    }

    createConnection(fromId, toId, label = '') {
        // Prevent duplicates
        const exists = this.app.connections.find(
            c => c.from === fromId && c.to === toId
        );
        if (exists) return null;
        if (fromId === toId) return null;

        const conn = {
            id: Utils.generateId(),
            from: fromId,
            to: toId,
            label: label,
        };

        this.app.connections.push(conn);
        this.renderConnection(conn);
        this.app.autoSave();
        return conn;
    }

    renderConnection(conn) {
        const existing = document.getElementById('conn_' + conn.id);
        if (existing) existing.remove();

        const fromNode = this.app.getNode(conn.from);
        const toNode = this.app.getNode(conn.to);
        if (!fromNode || !toNode) return;

        const fromEl = document.getElementById(fromNode.id);
        const toEl = document.getElementById(toNode.id);
        if (!fromEl || !toEl) return;

        const fromRect = { x: fromNode.x, y: fromNode.y, w: fromEl.offsetWidth, h: fromEl.offsetHeight };
        const toRect = { x: toNode.x, y: toNode.y, w: toEl.offsetWidth, h: toEl.offsetHeight };

        const x1 = fromRect.x + fromRect.w;
        const y1 = fromRect.y + fromRect.h / 2;
        const x2 = toRect.x;
        const y2 = toRect.y + toRect.h / 2;

        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.id = 'conn_' + conn.id;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', Utils.bezierPath(x1, y1, x2, y2));
        path.setAttribute('class', 'connection-line');
        path.dataset.connId = conn.id;

        // Click to select connection
        path.style.pointerEvents = 'stroke';
        path.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectConnection(conn.id);
        });
        path.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.selectConnection(conn.id);
        });

        g.appendChild(path);

        // Label
        if (conn.label) {
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', midX);
            text.setAttribute('y', midY - 8);
            text.setAttribute('class', 'connection-label');
            text.setAttribute('text-anchor', 'middle');
            text.textContent = conn.label;
            g.appendChild(text);
        }

        this.svgLayer.appendChild(g);
    }

    updateConnections() {
        // Re-render all connections
        this.svgLayer.innerHTML = '';
        if (this.tempLine) {
            this.svgLayer.appendChild(this.tempLine);
        }
        for (const conn of this.app.connections) {
            this.renderConnection(conn);
        }
    }

    removeConnection(connId) {
        const idx = this.app.connections.findIndex(c => c.id === connId);
        if (idx !== -1) {
            this.app.connections.splice(idx, 1);
            document.getElementById('conn_' + connId)?.remove();
            this.app.autoSave();
        }
    }

    removeConnectionsForNode(nodeId) {
        this.app.connections = this.app.connections.filter(
            c => c.from !== nodeId && c.to !== nodeId
        );
        this.updateConnections();
    }

    selectConnection(connId) {
        // Deselect previous
        this.svgLayer.querySelectorAll('.connection-line.selected').forEach(el => {
            el.classList.remove('selected');
        });
        const path = this.svgLayer.querySelector(`[data-conn-id="${connId}"]`);
        if (path) path.classList.add('selected');
        this.app.selectedConnection = connId;
    }

    startTempLine(fromNodeId) {
        const node = this.app.getNode(fromNodeId);
        const el = document.getElementById(fromNodeId);
        if (!node || !el) return;

        const x = node.x + el.offsetWidth;
        const y = node.y + el.offsetHeight / 2;

        this.tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.tempLine.setAttribute('class', 'connection-temp');
        this.tempLine.setAttribute('d', `M ${x} ${y} L ${x} ${y}`);
        this.svgLayer.appendChild(this.tempLine);

        this._tempStart = { x, y };
    }

    updateTempLine(canvasX, canvasY) {
        if (this.tempLine && this._tempStart) {
            const path = Utils.bezierPath(
                this._tempStart.x, this._tempStart.y,
                canvasX, canvasY
            );
            this.tempLine.setAttribute('d', path);
        }
    }

    removeTempLine() {
        if (this.tempLine) {
            this.tempLine.remove();
            this.tempLine = null;
            this._tempStart = null;
        }
    }
}