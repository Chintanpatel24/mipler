/* ═══════════════════════════════════════════════════════════
   Minimap
   ═══════════════════════════════════════════════════════════ */

class Minimap {
    constructor(app) {
        this.app = app;
        this.canvas = document.getElementById('minimap-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.viewport = document.getElementById('minimap-viewport');

        this.width = 200;
        this.height = 150;
        this.scale = 0.02;

        this.update = Utils.throttle(() => this._render(), 100);
    }

    _render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        const nodes = this.app.nodes;
        if (nodes.length === 0) return;

        // Find bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const n of nodes) {
            minX = Math.min(minX, n.x);
            minY = Math.min(minY, n.y);
            maxX = Math.max(maxX, n.x + 200);
            maxY = Math.max(maxY, n.y + 100);
        }

        const contentW = maxX - minX + 200;
        const contentH = maxY - minY + 200;
        this.scale = Math.min(this.width / contentW, this.height / contentH);

        const offsetX = (this.width - contentW * this.scale) / 2;
        const offsetY = (this.height - contentH * this.scale) / 2;

        // Draw nodes
        for (const n of nodes) {
            const x = (n.x - minX) * this.scale + offsetX;
            const y = (n.y - minY) * this.scale + offsetY;
            const w = Math.max(4, 200 * this.scale);
            const h = Math.max(3, 60 * this.scale);

            ctx.fillStyle = this.app.selectedNodes.has(n.id) ? '#6b8afd' : '#555555';
            ctx.fillRect(x, y, w, h);
        }

        // Draw connections
        ctx.strokeStyle = '#444444';
        ctx.lineWidth = 1;
        for (const c of this.app.connections) {
            const from = this.app.getNode(c.from);
            const to = this.app.getNode(c.to);
            if (from && to) {
                const fx = (from.x - minX + 100) * this.scale + offsetX;
                const fy = (from.y - minY + 30) * this.scale + offsetY;
                const tx = (to.x - minX) * this.scale + offsetX;
                const ty = (to.y - minY + 30) * this.scale + offsetY;
                ctx.beginPath();
                ctx.moveTo(fx, fy);
                ctx.lineTo(tx, ty);
                ctx.stroke();
            }
        }

        // Draw viewport indicator
        const container = this.app.canvas.container.getBoundingClientRect();
        const vx = (-this.app.canvas.x / this.app.canvas.zoom - minX) * this.scale + offsetX;
        const vy = (-this.app.canvas.y / this.app.canvas.zoom - minY) * this.scale + offsetY;
        const vw = (container.width / this.app.canvas.zoom) * this.scale;
        const vh = (container.height / this.app.canvas.zoom) * this.scale;

        this.viewport.style.left = Utils.clamp(vx, 0, this.width) + 'px';
        this.viewport.style.top = Utils.clamp(vy, 0, this.height) + 'px';
        this.viewport.style.width = Utils.clamp(vw, 10, this.width) + 'px';
        this.viewport.style.height = Utils.clamp(vh, 10, this.height) + 'px';
    }
}