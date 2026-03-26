import JSZip from 'jszip';
import type { WorkspaceState } from '../types';

export async function createProjectZip(state: WorkspaceState): Promise<Blob> {
  const zip = new JSZip();
  const exportState = JSON.parse(JSON.stringify(state)) as WorkspaceState;

  const assets = zip.folder('assets')!;
  const notes = zip.folder('notes')!;

  for (const inv of exportState.investigations) {
    for (const node of inv.nodes) {
      if (node.data.cardType === 'note' && node.data.content) {
        notes.file(`${node.id}.md`, `# ${node.data.title}\n\n${node.data.content}`);
      }
      if (node.data.cardType === 'image' && node.data.imageData) {
        const m = node.data.imageData.match(/^data:([^;]+);base64,(.+)$/);
        if (m) {
          const ext = m[1].split('/')[1] || 'png';
          const fn = node.data.fileName || `${node.id}.${ext}`;
          assets.file(fn, m[2], { base64: true });
          node.data.fileName = fn;
          node.data.imageData = `__ASSET__:${fn}`;
        }
      }
      if (node.data.cardType === 'pdf' && node.data.pdfData) {
        const m = node.data.pdfData.match(/^data:([^;]+);base64,(.+)$/);
        if (m) {
          const fn = node.data.fileName || `${node.id}.pdf`;
          assets.file(fn, m[2], { base64: true });
          node.data.fileName = fn;
          node.data.pdfData = `__ASSET__:${fn}`;
        }
      }
    }
  }

  zip.file('workspace.json', JSON.stringify(exportState, null, 2));
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importProjectZip(file: File): Promise<WorkspaceState> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const wsFile = zip.file('workspace.json');
  if (!wsFile) throw new Error('Invalid Mipler project: workspace.json not found');

  const workspace: WorkspaceState = JSON.parse(await wsFile.async('text'));
  const mimeMap: Record<string, string> = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml',
  };

  const restoreAssets = async (nodes: any[]) => {
    for (const node of nodes) {
      if (node.data.cardType === 'image') {
        const ref = node.data.imageData;
        const fn = node.data.fileName;
        const assetName = ref?.startsWith('__ASSET__:') ? ref.replace('__ASSET__:', '') : fn;
        if (assetName) {
          const af = zip.file(`assets/${assetName}`);
          if (af) {
            const b64 = await af.async('base64');
            const ext = assetName.split('.').pop()?.toLowerCase() || 'png';
            node.data.imageData = `data:${mimeMap[ext] || 'image/png'};base64,${b64}`;
          }
        }
      }
      if (node.data.cardType === 'pdf') {
        const ref = node.data.pdfData;
        const fn = node.data.fileName;
        const assetName = ref?.startsWith('__ASSET__:') ? ref.replace('__ASSET__:', '') : fn;
        if (assetName) {
          const af = zip.file(`assets/${assetName}`);
          if (af) {
            const b64 = await af.async('base64');
            node.data.pdfData = `data:application/pdf;base64,${b64}`;
          }
        }
      }
    }
  };

  if (workspace.investigations) {
    for (const inv of workspace.investigations) {
      await restoreAssets(inv.nodes);
    }
  } else if (workspace.nodes) {
    await restoreAssets(workspace.nodes);
  }

  return workspace;
}

export function selectZipFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.zip';
    input.style.display = 'none'; document.body.appendChild(input);
    input.onchange = () => { resolve(input.files?.[0] || null); document.body.removeChild(input); };
    input.click();
  });
}