/* ═══════════════════════════════════════════════════════════
   Canvas - Pan, Zoom, Selection
   ═══════════════════════════════════════════════════════════ */

class Canvas {
    constructor(app) {
        this.app = app;
        this.element = document.getElementById('canvas');
        this.container = document.getElementById('canvas-container');
        this.svgLayer = document.getElementById('connections-svg');
        this.nodesLayer = document.getElementById('nodes-layer');

        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.minZoom = 0.1;
        this.maxZoom = 3;
        this.gridSize = 20;
        this.snapToGrid = true;

        this.isPanning = false;
        this.panStart = { x: 0, y: 0 };
        this.spaceHeld = false;

        this.isSelecting = false;
        this.selectionStart = null;
        this.selectionBox = document.getElementById('selection-box');

        this._setupEvents();
        this.centerView();
    }

    _setupEvents() {
        this.container.addEventListener('wheel', (e) => this._onWheel(e), { passive: false });
        this.container.addEventListener('mousedown', (e) => this._onMouseDown(e));
        document.addEventListener('mousemove', (e) => this._onMouseMove(e));
        document.addEventListener('mouseup', (e) => this._onMouseUp(e));

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.repeat) {
                this.spaceHeld = true;
                this.container.style.cursor = 'grab';
            }
        });
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.spaceHeld = false;
                this.container.style.cursor = 'default';
            }
        });

        // Drop zone for tools/entities
        this.container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        this.container.addEventListener('drop', (e) => {
            e.preventDefault();
            const data = e.dataTransfer.getData('application/json');
            if (data) {
                const parsed = JSON.parse(data);
                const pos = this.screenToCanvas(e.clientX, e.clientY);
                this.app.handleDrop(parsed, pos.x, pos.y);
            }
        });
    }

    _onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const rect = this.container.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        this.zoomAt(mx, my, this.zoom * delta);
    }

    _onMouseDown(e) {
        if (e.button !== 0) return;

        // Check if clicking on a node
        if (e.target.closest('.node')) return;

        if (this.spaceHeld || this.app.currentTool === 'pan') {
            this.isPanning = true;
            this.panStart = { x: e.clientX - this.x, y: e.clientY - this.y };
            this.container.style.cursor = 'grabbing';
            e.preventDefault();
        } else if (this.app.currentTool === 'select') {
            // Deselect all
            this.app.deselectAll();

            // Start selection box
            this.isSelecting = true;
            this.selectionStart = { x: e.clientX, y: e.clientY };
            this.selectionBox.classList.remove('hidden');
        }
    }

    _onMouseMove(e) {
        if (this.isPanning) {
            this.x = e.clientX - this.panStart.x;
            this.y = e.clientY - this.panStart.y;
            this.updateTransform();
        }

        if (this.isSelecting && this.selectionStart) {
            const x = Math.min(e.clientX, this.selectionStart.x);
            const y = Math.min(e.clientY, this.selectionStart.y);
            const w = Math.abs(e.clientX - this.selectionStart.x);
            const h = Math.abs(e.clientY - this.selectionStart.y);
            Object.assign(this.selectionBox.style, {
                left: x + 'px', top: y + 'px',
                width: w + 'px', height: h + 'px',
            });
        }

        // Temp connection line
        if (this.app.connectingFrom) {
            const pos = this.screenToCanvas(e.clientX, e.clientY);
            this.app.connectionManager.updateTempLine(pos.x, pos.y);
        }
    }

    _onMouseUp(e) {
        if (this.isPanning) {
            this.isPanning = false;
            this.container.style.cursor = this.spaceHeld ? 'grab' : 'default';
        }

        if (this.isSelecting && this.selectionStart) {
            this.isSelecting = false;
            const rect = {
                x: Math.min(e.clientX, this.selectionStart.x),
                y: Math.min(e.clientY, this.selectionStart.y),
                w: Math.abs(e.clientX - this.selectionStart.x),
                h: Math.abs(e.clientY - this.selectionStart.y),
            };
            if (rect.w > 5 && rect.h > 5) {
                this.app.selectNodesInRect(rect);
            }
            this.selectionBox.classList.add('hidden');
            this.selectionStart = null;
        }
    }

    screenToCanvas(sx, sy) {
        const rect = this.container.getBoundingClientRect();
        return {
            x: (sx - rect.left - this.x) / this.zoom,
            y: (sy - rect.top - this.y) / this.zoom,
        };
    }

    canvasToScreen(cx, cy) {
        const rect = this.container.getBoundingClientRect();
        return {
            x: cx * this.zoom + this.x + rect.left,
            y: cy * this.zoom + this.y + rect.top,
        };
    }

    zoomAt(screenX, screenY, newZoom) {
        newZoom = Utils.clamp(newZoom, this.minZoom, this.maxZoom);
        const ratio = newZoom / this.zoom;
        this.x = screenX - (screenX - this.x) * ratio;
        this.y = screenY - (screenY - this.y) * ratio;
        this.zoom = newZoom;
        this.updateTransform();
        this.app.updateZoomDisplay();
    }

    setZoom(newZoom) {
        const rect = this.container.getBoundingClientRect();
        this.zoomAt(rect.width / 2, rect.height / 2, newZoom);
    }

    updateTransform() {
        this.element.style.transform = `translate(${this.x}px, ${this.y}px) scale(${this.zoom})`;
        this.app.onCanvasChanged();
    }

    centerView() {
        const rect = this.container.getBoundingClientRect();
        this.x = rect.width / 2 - 5000;
        this.y = rect.height / 2 - 5000;
        this.updateTransform();
    }

    fitAll() {
        const nodes = this.app.nodes;
        if (nodes.length === 0) {
            this.centerView();
            return;
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const node of nodes) {
            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x + (node.width || 200));
            maxY = Math.max(maxY, node.y + (node.height || 100));
        }

        const padding = 100;
        const rect = this.container.getBoundingClientRect();
        const contentW = maxX - minX + padding * 2;
        const contentH = maxY - minY + padding * 2;

        const zoom = Math.min(
            rect.width / contentW,
            rect.height / contentH,
            1.5
        );

        this.zoom = Utils.clamp(zoom, this.minZoom, this.maxZoom);
        this.x = rect.width / 2 - (minX + (maxX - minX) / 2) * this.zoom;
        this.y = rect.height / 2 - (minY + (maxY - minY) / 2) * this.zoom;
        this.updateTransform();
        this.app.updateZoomDisplay();
    }

    getViewport() {
        return { x: this.x, y: this.y, zoom: this.zoom };
    }

    setViewport(vp) {
        if (vp) {
            this.x = vp.x || 0;
            this.y = vp.y || 0;
            this.zoom = vp.zoom || 1;
            this.updateTransform();
        }
    }
}