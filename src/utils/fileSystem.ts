import type { WorkspaceState } from '../types';

export function hasFileSystemAccess(): boolean {
  return 'showSaveFilePicker' in window && 'showOpenFilePicker' in window;
}

export async function saveWithFileSystemAccess(state: WorkspaceState): Promise<void> {
  try {
    const handle = await (window as any).showSaveFilePicker({
      suggestedName: 'mipler-workspace.json',
      types: [{ description: 'Mipler Workspace', accept: { 'application/json': ['.json'] } }],
    });
    const w = await handle.createWritable();
    await w.write(JSON.stringify(state, null, 2));
    await w.close();
  } catch (e: any) {
    if (e.name !== 'AbortError') throw e;
  }
}

export async function loadWithFileSystemAccess(): Promise<WorkspaceState | null> {
  try {
    const [handle] = await (window as any).showOpenFilePicker({
      types: [{ description: 'Mipler Workspace', accept: { 'application/json': ['.json'] } }],
    });
    const file = await handle.getFile();
    return JSON.parse(await file.text()) as WorkspaceState;
  } catch (e: any) {
    if (e.name !== 'AbortError') throw e;
    return null;
  }
}

export function downloadWorkspace(state: WorkspaceState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mipler-workspace.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function uploadWorkspace(): Promise<WorkspaceState | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return resolve(null);
      try {
        resolve(JSON.parse(await f.text()) as WorkspaceState);
      } catch {
        resolve(null);
      }
    };
    input.click();
  });
}

export function clearAllLocalData(): void {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch {}
}
