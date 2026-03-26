import type { WorkspaceState } from '../types';

export async function createProjectZip(state: WorkspaceState): Promise<Blob> {
  const json = JSON.stringify(state, null, 2);
  return new Blob([json], { type: 'application/json' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function selectZipFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.zip';
    input.onchange = () => {
      const f = input.files?.[0];
      resolve(f || null);
    };
    input.click();
  });
}

export async function importProjectZip(file: File): Promise<WorkspaceState> {
  const text = await file.text();
  try {
    return JSON.parse(text) as WorkspaceState;
  } catch {
    throw new Error('Invalid file format. Expected a JSON workspace file.');
  }
}
