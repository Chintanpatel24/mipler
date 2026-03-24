/* ═══════════════════════════════════════════════════════════
   Utility Functions
   ═══════════════════════════════════════════════════════════ */

const Utils = {
    generateId() {
        return 'n_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    },

    clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    },

    debounce(fn, delay) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    },

    throttle(fn, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                fn.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    formatJson(obj, indent = 0) {
        if (obj === null || obj === undefined) return '<span class="result-null">null</span>';
        if (typeof obj === 'string') return `<span class="result-value">"${Utils.escapeHtml(obj)}"</span>`;
        if (typeof obj === 'number' || typeof obj === 'boolean') return `<span class="result-value">${obj}</span>`;

        if (Array.isArray(obj)) {
            if (obj.length === 0) return '[]';
            const items = obj.map(item => '  '.repeat(indent + 1) + Utils.formatJson(item, indent + 1));
            return '[\n' + items.join(',\n') + '\n' + '  '.repeat(indent) + ']';
        }

        if (typeof obj === 'object') {
            const keys = Object.keys(obj);
            if (keys.length === 0) return '{}';
            const entries = keys.map(key =>
                '  '.repeat(indent + 1) + `<span class="result-key">"${Utils.escapeHtml(key)}"</span>: ${Utils.formatJson(obj[key], indent + 1)}`
            );
            return '{\n' + entries.join(',\n') + '\n' + '  '.repeat(indent) + '}';
        }

        return String(obj);
    },

    formatResultSimple(data) {
        if (!data) return '';
        let html = '<div class="node-results">';
        html += Utils.formatJson(data);
        html += '</div>';
        return html;
    },

    showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notifications');
        const notif = document.createElement('div');
        notif.className = `notification ${type}`;
        const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
        notif.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;
        container.appendChild(notif);
        setTimeout(() => {
            notif.style.opacity = '0';
            notif.style.transform = 'translateY(20px)';
            notif.style.transition = 'all 0.3s ease';
            setTimeout(() => notif.remove(), 300);
        }, duration);
    },

    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    pointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    },

    bezierPath(x1, y1, x2, y2) {
        const dx = Math.abs(x2 - x1) * 0.5;
        const cp1x = x1 + dx;
        const cp2x = x2 - dx;
        return `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`;
    },

    async fetchJSON(url, options = {}) {
        const resp = await fetch(url, {
            headers: { 'Content-Type': 'application/json' },
            ...options,
        });
        return resp.json();
    },

    snapToGrid(value, gridSize = 20) {
        return Math.round(value / gridSize) * gridSize;
    }
};