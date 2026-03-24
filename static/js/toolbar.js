/* ═══════════════════════════════════════════════════════════
   Toolbar - Top bar buttons and tool selection
   ═══════════════════════════════════════════════════════════ */

class Toolbar {
    constructor(app) {
        this.app = app;
        this._setupEvents();
    }

    _setupEvents() {
        // Tool selection
        document.querySelectorAll('[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.app.setTool(btn.dataset.tool);
            });
        });

        // Add buttons
        document.getElementById('btn-add-note')?.addEventListener('click', () => {
            const pos = this.app.canvas.screenToCanvas(
                window.innerWidth / 2, window.innerHeight / 2
            );
            this.app.addNote(pos.x, pos.y);
        });

        document.getElementById('btn-add-label')?.addEventListener('click', () => {
            const pos = this.app.canvas.screenToCanvas(
                window.innerWidth / 2, window.innerHeight / 2
            );
            this.app.addLabel(pos.x, pos.y);
        });

        document.getElementById('btn-add-group')?.addEventListener('click', () => {
            const pos = this.app.canvas.screenToCanvas(
                window.innerWidth / 2, window.innerHeight / 2
            );
            this.app.addGroup(pos.x, pos.y);
        });

        // Undo/Redo
        document.getElementById('btn-undo')?.addEventListener('click', () => this.app.undo());
        document.getElementById('btn-redo')?.addEventListener('click', () => this.app.redo());

        // Zoom
        document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
            this.app.canvas.setZoom(this.app.canvas.zoom * 1.2);
        });
        document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
            this.app.canvas.setZoom(this.app.canvas.zoom / 1.2);
        });
        document.getElementById('btn-zoom-fit')?.addEventListener('click', () => {
            this.app.canvas.fitAll();
        });

        // Top bar buttons
        document.getElementById('btn-search')?.addEventListener('click', () => this.app.toggleSearch());
        document.getElementById('btn-export')?.addEventListener('click', () => this.app.exportManager.showExportDialog());
        document.getElementById('btn-settings')?.addEventListener('click', () => this.app.showSettings());
        document.getElementById('btn-workspaces')?.addEventListener('click', () => this.app.workspaceManager.showWorkspaceDialog());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (e.target.matches('input, textarea, select, [contenteditable]')) {
                if (e.key === 'Escape') e.target.blur();
                return;
            }

            const ctrl = e.ctrlKey || e.metaKey;

            if (ctrl && e.key === 's') { e.preventDefault(); this.app.forceSave(); }
            if (ctrl && e.key === 'z') { e.preventDefault(); this.app.undo(); }
            if (ctrl && e.key === 'y') { e.preventDefault(); this.app.redo(); }
            if (ctrl && e.key === 'f') { e.preventDefault(); this.app.toggleSearch(); }
            if (ctrl && e.key === 'a') { e.preventDefault(); this.app.selectAll(); }
            if (ctrl && e.key === 'd') { e.preventDefault(); this.app.duplicateSelected(); }
            if (ctrl && e.key === 'e') { e.preventDefault(); this.app.exportManager.showExportDialog(); }
            if (ctrl && e.key === 'n') { e.preventDefault(); this.app.addNote(); }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                this.app.deleteSelected();
            }
            if (e.key === 'Escape') {
                this.app.cancelConnection();
                this.app.deselectAll();
                this.app.closeSearch();
                this.app.closeInspector();
            }
            if (e.key === 'v' || e.key === 'V') this.app.setTool('select');
            if (e.key === 'c' && !ctrl) this.app.setTool('connect');
            if (e.key === 'n' && !ctrl) {
                const pos = this.app.canvas.screenToCanvas(window.innerWidth / 2, window.innerHeight / 2);
                this.app.addNote(pos.x, pos.y);
            }
            if (e.key === 'l' || e.key === 'L') {
                const pos = this.app.canvas.screenToCanvas(window.innerWidth / 2, window.innerHeight / 2);
                this.app.addLabel(pos.x, pos.y);
            }
            if (e.key === 'g' && !ctrl) {
                const pos = this.app.canvas.screenToCanvas(window.innerWidth / 2, window.innerHeight / 2);
                this.app.addGroup(pos.x, pos.y);
            }

            if (e.key === 'F11') { e.preventDefault(); this.toggleFullscreen(); }
        });
    }

    updateToolButtons(activeTool) {
        document.querySelectorAll('[data-tool]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === activeTool);
        });
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
}