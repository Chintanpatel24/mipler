import type { WorkspaceState } from '../types';

/**
 * Check if the File System Access API is available.
 */
export function hasFileSystemAccess(): boolean {
  return 'showSaveFilePicker' in window && 'showOpenFilePicker' in window;
}

/**
 * Check if running in local server mode (Express backend available).
 */
export async function hasLocalServer(): Promise<boolean> {
  try {
    const res = await fetch('/api/workspace/list', { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Save workspace to local server.
 */
export async function saveToServer(state: WorkspaceState): Promise<void> {
  const filename = `${sanitizeFilename(state.name)}.json`;
  await fetch('/api/workspace/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, data: state }),
  });
}

/**
 * Load workspace from local server.
 */
export async function loadFromServer(filename: string): Promise<WorkspaceState> {
  const res = await fetch(`/api/workspace/load/${filename}`);
  if (!res.ok) throw new Error('Failed to load workspace');
  return res.json();
}

/**
 * List workspaces on local server.
 */
export async function listServerWorkspaces(): Promise<{ name: string; modified: string }[]> {
  const res = await fetch('/api/workspace/list');
  if (!res.ok) return [];
  return res.json();
}

/**
 * Save workspace using File System Access API.
 */
export async function saveWithFileSystemAccess(state: WorkspaceState): Promise<void> {
  try {
    const handle = await (window as any).showSaveFilePicker({
      suggestedName: `${sanitizeFilename(state.name)}.json`,
      types: [
        {
          description: 'Mipler Workspace',
          accept: { 'application/json': ['.json'] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(state, null, 2));
    await writable.close();
  } catch (err: any) {
    if (err.name !== 'AbortError') throw err;
  }
}

/**
 * Load workspace using File System Access API.
 */
export async function loadWithFileSystemAccess(): Promise<WorkspaceState | null> {
  try {
    const [handle] = await (window as any).showOpenFilePicker({
      types: [
        {
          description: 'Mipler Workspace',
          accept: { 'application/json': ['.json'] },
        },
      ],
    });
    const file = await handle.getFile();
    const text = await file.text();
    return JSON.parse(text) as WorkspaceState;
  } catch (err: any) {
    if (err.name !== 'AbortError') throw err;
    return null;
  }
}

/**
 * Fallback: download workspace as JSON file.
 */
export function downloadWorkspace(state: WorkspaceState): void {
  const json = JSON.stringify(state, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(state.name)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Fallback: upload workspace from file input.
 */
export function uploadWorkspace(): Promise<WorkspaceState | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const text = await file.text();
      try {
        resolve(JSON.parse(text) as WorkspaceState);
      } catch {
        resolve(null);
      }
    };
    input.click();
  });
}

/**
 * Auto-save to localStorage as a safety net.
 */
export function autoSaveToLocalStorage(state: WorkspaceState): void {
  try {
    localStorage.setItem('mipler-autosave', JSON.stringify(state));
    localStorage.setItem('mipler-autosave-time', new Date().toISOString());
  } catch {
    // localStorage might be full; silently fail
  }
}

/**
 * Load auto-save from localStorage.
 */
export function loadAutoSave(): WorkspaceState | null {
  try {
    const data = localStorage.getItem('mipler-autosave');
    if (!data) return null;
    return JSON.parse(data) as WorkspaceState;
  } catch {
    return null;
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\- ]/g, '').replace(/\s+/g, '_') || 'workspace';
}