/* ═══════════════════════════════════════════════════════════
   Context Menus
   ═══════════════════════════════════════════════════════════ */

class ContextMenuManager {
    constructor(app) {
        this.app = app;
        this.canvasMenu = document.getElementById('context-menu');
        this.nodeMenu = document.getElementById('node-context-menu');
        this.activeNodeId = null;

        this._setupEvents();
    }

    _setupEvents() {
        // Canvas right-click
        this.app.canvas.container.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (!e.target.closest('.node')) {
                this.showCanvasMenu(e.clientX, e.clientY);
            }
        });

        // Canvas menu actions
        this.canvasMenu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                const pos = this._lastPos || this.app.canvas.screenToCanvas(
                    window.innerWidth / 2, window.innerHeight / 2
                );
                this.hideAll();

                switch (action) {
                    case 'add-note': this.app.addNote(pos.x, pos.y); break;
                    case 'add-entity': this.app.showEntityPicker(pos.x, pos.y); break;
                    case 'add-tool': this.app.showToolPicker(pos.x, pos.y); break;
                    case 'paste': this.app.paste(pos.x, pos.y); break;
                    case 'select-all': this.app.selectAll(); break;
                    case 'zoom-fit': this.app.canvas.fitAll(); break;
                    case 'zoom-reset': this.app.canvas.setZoom(1); break;
                }
            });
        });

        // Node menu actions
        this.nodeMenu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                const nodeId = this.activeNodeId;
                this.hideAll();
                if (!nodeId) return;

                switch (action) {
                    case 'run': this.app.runTool(nodeId); break;
                    case 'edit': this.app.openInspector(nodeId); break;
                    case 'duplicate': this.app.nodeManager.duplicateNode(nodeId); break;
                    case 'copy': this.app.copyNode(nodeId); break;
                    case 'connect-from': this.app.startConnection(nodeId); break;
                    case 'connect-to':
                        if (this.app.connectingFrom) this.app.completeConnection(nodeId);
                        break;
                    case 'change-color': this.app.showColorPicker(nodeId); break;
                    case 'delete': this.app.nodeManager.deleteNode(nodeId); break;
                }
            });
        });

        // Close on click outside
        document.addEventListener('click', () => this.hideAll());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.hideAll();
        });
    }

    showCanvasMenu(x, y) {
        this.hideAll();
        this._lastPos = this.app.canvas.screenToCanvas(x, y);
        this._positionMenu(this.canvasMenu, x, y);
    }

    showNodeMenu(x, y, nodeId) {
        this.hideAll();
        this.activeNodeId = nodeId;
        this._positionMenu(this.nodeMenu, x, y);
    }

    _positionMenu(menu, x, y) {
        menu.classList.remove('hidden');
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';

        // Clamp to viewport
        requestAnimationFrame(() => {
            const rect = menu.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
                menu.style.left = (x - rect.width) + 'px';
            }
            if (rect.bottom > window.innerHeight) {
                menu.style.top = (y - rect.height) + 'px';
            }
        });
    }

    hideAll() {
        this.canvasMenu.classList.add('hidden');
        this.nodeMenu.classList.add('hidden');
        this.activeNodeId = null;
    }
}