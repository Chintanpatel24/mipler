/* ═══════════════════════════════════════════════════════════
   Export Manager
   ═══════════════════════════════════════════════════════════ */

class ExportManager {
    constructor(app) {
        this.app = app;
    }

    showExportDialog() {
        const html = `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <button class="modal-btn" id="export-json" style="padding:20px;text-align:center">
                    <div style="font-size:24px;margin-bottom:8px">📄</div>
                    <div style="font-weight:600">JSON</div>
                    <div style="font-size:10px;color:var(--text-muted);margin-top:4px">Full workspace data</div>
                </button>
                <button class="modal-btn" id="export-markdown" style="padding:20px;text-align:center">
                    <div style="font-size:24px;margin-bottom:8px">📝</div>
                    <div style="font-weight:600">Markdown</div>
                    <div style="font-size:10px;color:var(--text-muted);margin-top:4px">Investigation report</div>
                </button>
                <button class="modal-btn" id="export-csv" style="padding:20px;text-align:center">
                    <div style="font-size:24px;margin-bottom:8px">📊</div>
                    <div style="font-weight:600">CSV</div>
                    <div style="font-size:10px;color:var(--text-muted);margin-top:4px">Node data as spreadsheet</div>
                </button>
                <button class="modal-btn" id="export-html" style="padding:20px;text-align:center">
                    <div style="font-size:24px;margin-bottom:8px">🌐</div>
                    <div style="font-weight:600">HTML Report</div>
                    <div style="font-size:10px;color:var(--text-muted);margin-top:4px">Standalone report</div>
                </button>
            </div>
        `;

        this.app.modal.show('Export Investigation', html, [
            { id: 'close', text: 'Close', class: '', onClick: () => this.app.modal.close() },
        ]);

        document.getElementById('export-json')?.addEventListener('click', () => this.exportJSON());
        document.getElementById('export-markdown')?.addEventListener('click', () => this.exportMarkdown());
        document.getElementById('export-csv')?.addEventListener('click', () => this.exportCSV());
        document.getElementById('export-html')?.addEventListener('click', () => this.exportHTML());
    }

    exportJSON() {
        const data = this.app.workspaceManager.getWorkspaceData();
        this._download(
            JSON.stringify(data, null, 2),
            `${data.name || 'investigation'}.json`,
            'application/json'
        );
        this.app.modal.close();
        Utils.showNotification('Exported as JSON', 'success');
    }

    exportMarkdown() {
        const data = this.app.workspaceManager.getWorkspaceData();
        let md = `# ${data.name || 'Investigation'}\n\n`;
        md += `*Exported: ${new Date().toLocaleString()}*\n\n`;
        md += `---\n\n`;

        md += `## Nodes (${data.nodes.length})\n\n`;
        for (const node of data.nodes) {
            md += `### ${node.icon || '📦'} ${node.title}\n`;
            md += `- **Type:** ${node.type}\n`;
            if (node.values && Object.keys(node.values).length > 0) {
                md += `- **Values:**\n`;
                for (const [k, v] of Object.entries(node.values)) {
                    md += `  - ${k}: ${v}\n`;
                }
            }
            if (node.result && node.result.data) {
                md += `- **Results:** \`\`\`json\n${JSON.stringify(node.result.data, null, 2)}\n\`\`\`\n`;
            }
            if (node.notes) md += `- **Notes:** ${node.notes}\n`;
            md += '\n';
        }

        md += `## Connections (${data.connections.length})\n\n`;
        for (const conn of data.connections) {
            const from = data.nodes.find(n => n.id === conn.from);
            const to = data.nodes.find(n => n.id === conn.to);
            md += `- ${from?.title || conn.from} → ${to?.title || conn.to}`;
            if (conn.label) md += ` (${conn.label})`;
            md += '\n';
        }

        this._download(md, `${data.name || 'investigation'}.md`, 'text/markdown');
        this.app.modal.close();
        Utils.showNotification('Exported as Markdown', 'success');
    }

    exportCSV() {
        const data = this.app.workspaceManager.getWorkspaceData();
        let csv = 'ID,Type,Title,Status,Values,Notes\n';
        for (const node of data.nodes) {
            const values = JSON.stringify(node.values || {}).replace(/"/g, '""');
            csv += `"${node.id}","${node.type}","${node.title}","${node.status}","${values}","${(node.notes || '').replace(/"/g, '""')}"\n`;
        }

        this._download(csv, `${data.name || 'investigation'}.csv`, 'text/csv');
        this.app.modal.close();
        Utils.showNotification('Exported as CSV', 'success');
    }

    exportHTML() {
        const data = this.app.workspaceManager.getWorkspaceData();
        let html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${data.name || 'Investigation'}</title>
<style>
body{font-family:sans-serif;max-width:900px;margin:40px auto;padding:0 20px;background:#1a1a1a;color:#e0e0e0}
h1{border-bottom:2px solid #333;padding-bottom:10px}
.node-card{background:#262626;border:1px solid #3a3a3a;border-radius:8px;padding:16px;margin:12px 0}
.node-title{font-size:16px;font-weight:600;margin-bottom:8px}
.node-meta{font-size:12px;color:#999}
pre{background:#1a1a1a;padding:12px;border-radius:4px;overflow-x:auto;font-size:11px}
.connection{padding:4px 0;color:#999;font-size:12px}
</style></head><body>
<h1>🔍 ${Utils.escapeHtml(data.name || 'Investigation')}</h1>
<p style="color:#999">Exported: ${new Date().toLocaleString()}</p>
<h2>Nodes</h2>`;

        for (const node of data.nodes) {
            html += `<div class="node-card">
                <div class="node-title">${node.icon || '📦'} ${Utils.escapeHtml(node.title)}</div>
                <div class="node-meta">Type: ${node.type} | Status: ${node.status}</div>`;
            if (node.result && node.result.data) {
                html += `<pre>${Utils.escapeHtml(JSON.stringify(node.result.data, null, 2))}</pre>`;
            }
            html += '</div>';
        }

        html += '<h2>Connections</h2>';
        for (const conn of data.connections) {
            const from = data.nodes.find(n => n.id === conn.from);
            const to = data.nodes.find(n => n.id === conn.to);
            html += `<div class="connection">→ ${Utils.escapeHtml(from?.title || '?')} → ${Utils.escapeHtml(to?.title || '?')}${conn.label ? ' (' + Utils.escapeHtml(conn.label) + ')' : ''}</div>`;
        }

        html += '</body></html>';

        this._download(html, `${data.name || 'investigation'}.html`, 'text/html');
        this.app.modal.close();
        Utils.showNotification('Exported as HTML Report', 'success');
    }

    _download(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }
}