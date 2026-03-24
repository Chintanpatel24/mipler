/* ═══════════════════════════════════════════════════════════
   Modal Manager
   ═══════════════════════════════════════════════════════════ */

class ModalManager {
    constructor() {
        this.overlay = document.getElementById('modal-overlay');
        this.modal = document.getElementById('modal');
        this.title = document.getElementById('modal-title');
        this.body = document.getElementById('modal-body');
        this.footer = document.getElementById('modal-footer');

        document.getElementById('modal-close')?.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });
    }

    show(title, bodyHtml, buttons = []) {
        this.title.textContent = title;
        this.body.innerHTML = bodyHtml;

        let footerHtml = '';
        for (const btn of buttons) {
            footerHtml += `<button class="modal-btn ${btn.class || ''}" id="modal-btn-${btn.id}">${btn.text}</button>`;
        }
        this.footer.innerHTML = footerHtml;

        // Attach button handlers
        for (const btn of buttons) {
            document.getElementById(`modal-btn-${btn.id}`)?.addEventListener('click', () => {
                if (btn.onClick) btn.onClick();
            });
        }

        this.overlay.classList.remove('hidden');
    }

    close() {
        this.overlay.classList.add('hidden');
    }

    confirm(title, message, onConfirm) {
        this.show(title, `<p style="color:var(--text-secondary)">${message}</p>`, [
            { id: 'cancel', text: 'Cancel', class: '', onClick: () => this.close() },
            { id: 'confirm', text: 'Confirm', class: 'primary', onClick: () => { onConfirm(); this.close(); } },
        ]);
    }

    prompt(title, fields, onSubmit) {
        let html = '';
        for (const field of fields) {
            html += `<div class="form-group">
                <label>${field.label}</label>`;
            if (field.type === 'textarea') {
                html += `<textarea id="modal-field-${field.name}" placeholder="${field.placeholder || ''}">${field.value || ''}</textarea>`;
            } else {
                html += `<input type="${field.type || 'text'}" id="modal-field-${field.name}" 
                            value="${field.value || ''}" placeholder="${field.placeholder || ''}">`;
            }
            html += '</div>';
        }

        this.show(title, html, [
            { id: 'cancel', text: 'Cancel', class: '', onClick: () => this.close() },
            {
                id: 'submit', text: 'Create', class: 'primary', onClick: () => {
                    const values = {};
                    for (const field of fields) {
                        values[field.name] = document.getElementById(`modal-field-${field.name}`)?.value || '';
                    }
                    onSubmit(values);
                    this.close();
                }
            },
        ]);
    }
}