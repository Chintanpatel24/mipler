/* ═══════════════════════════════════════════════════════════
   Sidebar - Tool list, entities, resources
   ═══════════════════════════════════════════════════════════ */

class Sidebar {
    constructor(app) {
        this.app = app;
        this.element = document.getElementById('sidebar');
        this.toolList = document.getElementById('tool-list');
        this.searchInput = document.getElementById('tool-search');

        this._setupEvents();
        this.loadTools();
    }

    _setupEvents() {
        this.searchInput.addEventListener('input', () => this.filterTools());

        // Section toggles
        document.querySelectorAll('.section-title[data-toggle]').forEach(title => {
            title.addEventListener('click', () => {
                const target = document.getElementById(title.dataset.toggle);
                if (target) {
                    target.classList.toggle('hidden');
                    title.classList.toggle('open');
                }
            });
            title.classList.add('open');
        });

        // Entity drag
        document.querySelectorAll('.entity-item[draggable]').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                const data = {
                    type: 'entity',
                    entityType: item.dataset.type,
                };
                e.dataTransfer.setData('application/json', JSON.stringify(data));
                e.dataTransfer.effectAllowed = 'copy';
            });
        });
    }

    async loadTools() {
        try {
            const tools = await Utils.fetchJSON('/api/tools');
            this.tools = tools;
            this.renderTools(tools);
        } catch (err) {
            console.error('Failed to load tools:', err);
            this.toolList.innerHTML = '<div style="padding:12px;color:var(--text-muted)">Failed to load tools</div>';
        }
    }

    renderTools(tools) {
        const byCategory = {};
        for (const tool of tools) {
            if (!byCategory[tool.category]) byCategory[tool.category] = [];
            byCategory[tool.category].push(tool);
        }

        let html = '';
        for (const [category, categoryTools] of Object.entries(byCategory)) {
            html += `<div class="sidebar-section">
                <h4 class="section-title open" data-cat="${category}">${category}</h4>
                <div class="tool-cat-items">`;

            for (const tool of categoryTools) {
                html += `
                <div class="tool-item" draggable="true" data-tool-id="${tool.id}">
                    <div class="tool-icon" style="background:${tool.color}20;color:${tool.color}">
                        ${this._getToolIcon(tool.icon)}
                    </div>
                    <div class="tool-info">
                        <div class="tool-name">${Utils.escapeHtml(tool.name)}</div>
                        <div class="tool-desc">${Utils.escapeHtml(tool.description)}</div>
                    </div>
                </div>`;
            }

            html += '</div></div>';
        }

        this.toolList.innerHTML = html;

        // Add drag events
        this.toolList.querySelectorAll('.tool-item[draggable]').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                const data = {
                    type: 'tool',
                    toolId: item.dataset.toolId,
                };
                e.dataTransfer.setData('application/json', JSON.stringify(data));
                e.dataTransfer.effectAllowed = 'copy';
            });

            // Category section toggles
            const title = item.closest('.sidebar-section')?.querySelector('.section-title');
            if (title && !title._bound) {
                title._bound = true;
                title.addEventListener('click', () => {
                    const items = title.nextElementSibling;
                    if (items) items.classList.toggle('hidden');
                    title.classList.toggle('open');
                });
            }
        });
    }

    filterTools() {
        const q = this.searchInput.value.toLowerCase();
        this.toolList.querySelectorAll('.tool-item').forEach(item => {
            const name = item.querySelector('.tool-name')?.textContent.toLowerCase() || '';
            const desc = item.querySelector('.tool-desc')?.textContent.toLowerCase() || '';
            item.style.display = (name.includes(q) || desc.includes(q)) ? '' : 'none';
        });
    }

    _getToolIcon(icon) {
        const icons = {
            'dns': '🌐',
            'whois': '📋',
            'email': '📧',
            'location': '📍',
            'person': '👤',
            'hash': '#️⃣',
            'subdomain': '🔍',
            'metadata': '📊',
            'scraper': '🕷️',
            'passive': '👁️',
        };
        return icons[icon] || '🔧';
    }

    getToolData(toolId) {
        return this.tools?.find(t => t.id === toolId) || null;
    }
}