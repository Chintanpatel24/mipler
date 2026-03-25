import JSZip from 'jszip';
import type { WorkspaceState, ExportBundle } from '../types';

/**
 * Create a project zip from the current workspace state.
 */
export async function createProjectZip(state: WorkspaceState): Promise<Blob> {
  const zip = new JSZip();

  // workspace.json
  zip.file('workspace.json', JSON.stringify(state, null, 2));

  // notes/ directory — extract text content from note cards
  const notesFolder = zip.folder('notes');
  for (const node of state.nodes) {
    if (node.data.cardType === 'note' && node.data.content) {
      notesFolder?.file(
        `${node.id}.md`,
        `# ${node.data.title}\n\n${node.data.content}`
      );
    }
  }

  // assets/ directory — images & PDFs stored as base64
  const assetsFolder = zip.folder('assets');
  for (const node of state.nodes) {
    if (node.data.cardType === 'image' && node.data.imageData) {
      const match = node.data.imageData.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        const ext = match[1].split('/')[1] || 'png';
        const filename = node.data.fileName || `${node.id}.${ext}`;
        assetsFolder?.file(filename, match[2], { base64: true });
      }
    }
    if (node.data.cardType === 'pdf' && node.data.pdfData) {
      const match = node.data.pdfData.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        const filename = node.data.fileName || `${node.id}.pdf`;
        assetsFolder?.file(filename, match[2], { base64: true });
      }
    }
  }

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

/**
 * Download a blob as a file.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import a project zip and restore workspace state.
 */
export async function importProjectZip(file: File): Promise<WorkspaceState> {
  const zip = await JSZip.loadAsync(file);

  // Read workspace.json
  const wsFile = zip.file('workspace.json');
  if (!wsFile) {
    throw new Error('Invalid Mipler project: workspace.json not found');
  }

  const wsText = await wsFile.async('text');
  const workspace: WorkspaceState = JSON.parse(wsText);

  // Re-attach assets as base64 data URIs
  for (const node of workspace.nodes) {
    if (node.data.cardType === 'image' && node.data.fileName) {
      const assetFile = zip.file(`assets/${node.data.fileName}`);
      if (assetFile) {
        const base64 = await assetFile.async('base64');
        const ext = node.data.fileName.split('.').pop() || 'png';
        const mime = ext === 'png' ? 'image/png' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'gif' ? 'image/gif' : ext === 'webp' ? 'image/webp' : ext === 'svg' ? 'image/svg+xml' : 'image/png';
        node.data.imageData = `data:${mime};base64,${base64}`;
      }
    }
    if (node.data.cardType === 'pdf' && node.data.fileName) {
      const assetFile = zip.file(`assets/${node.data.fileName}`);
      if (assetFile) {
        const base64 = await assetFile.async('base64');
        node.data.pdfData = `data:application/pdf;base64,${base64}`;
      }
    }
  }

  return workspace;
}

/**
 * Prompt user to select a zip file and import it.
 */
export function selectZipFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';
    input.onchange = () => {
      resolve(input.files?.[0] || null);
    };
    input.click();
  });
}