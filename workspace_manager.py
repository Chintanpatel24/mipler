"""Workspace management - create, load, save, list workspaces."""
import os
import json
import shutil
import time
from datetime import datetime
from .config import Config


class WorkspaceManager:
    """Manages investigation workspaces."""

    def __init__(self):
        self.base_dir = Config.ensure_workspace_dir()

    def list_workspaces(self):
        """List all available workspaces."""
        workspaces = []
        if not os.path.exists(self.base_dir):
            return workspaces

        for name in os.listdir(self.base_dir):
            ws_path = os.path.join(self.base_dir, name)
            meta_path = os.path.join(ws_path, 'workspace.json')

            if os.path.isdir(ws_path) and os.path.exists(meta_path):
                try:
                    with open(meta_path, 'r') as f:
                        data = json.load(f)
                    workspaces.append({
                        'id': name,
                        'name': data.get('name', name),
                        'description': data.get('description', ''),
                        'created': data.get('created', ''),
                        'modified': data.get('modified', ''),
                        'node_count': len(data.get('nodes', [])),
                        'connection_count': len(data.get('connections', [])),
                    })
                except (json.JSONDecodeError, IOError):
                    continue

        workspaces.sort(key=lambda x: x.get('modified', ''), reverse=True)
        return workspaces

    def create_workspace(self, name, description='', workspace_path=None):
        """Create a new workspace."""
        ws_id = self._sanitize_name(name) + '_' + str(int(time.time()))

        if workspace_path:
            ws_dir = os.path.abspath(workspace_path)
        else:
            ws_dir = os.path.join(self.base_dir, ws_id)

        os.makedirs(ws_dir, exist_ok=True)
        os.makedirs(os.path.join(ws_dir, 'notes'), exist_ok=True)
        os.makedirs(os.path.join(ws_dir, 'exports'), exist_ok=True)
        os.makedirs(os.path.join(ws_dir, 'attachments'), exist_ok=True)

        now = datetime.utcnow().isoformat()
        workspace_data = {
            'id': ws_id,
            'name': name,
            'description': description,
            'created': now,
            'modified': now,
            'nodes': [],
            'connections': [],
            'groups': [],
            'viewport': {'x': 0, 'y': 0, 'zoom': 1.0},
            'settings': {
                'grid_enabled': True,
                'snap_to_grid': True,
                'grid_size': 20,
                'auto_save': True,
            }
        }

        meta_path = os.path.join(ws_dir, 'workspace.json')
        with open(meta_path, 'w') as f:
            json.dump(workspace_data, f, indent=2)

        return workspace_data

    def load_workspace(self, ws_id):
        """Load a workspace by ID."""
        ws_dir = os.path.join(self.base_dir, ws_id)
        meta_path = os.path.join(ws_dir, 'workspace.json')

        if not os.path.exists(meta_path):
            return None

        with open(meta_path, 'r') as f:
            data = json.load(f)

        return data

    def save_workspace(self, ws_id, data):
        """Save workspace data."""
        ws_dir = os.path.join(self.base_dir, ws_id)
        meta_path = os.path.join(ws_dir, 'workspace.json')

        if not os.path.exists(ws_dir):
            os.makedirs(ws_dir, exist_ok=True)

        data['modified'] = datetime.utcnow().isoformat()

        with open(meta_path, 'w') as f:
            json.dump(data, f, indent=2)

        return True

    def delete_workspace(self, ws_id):
        """Delete a workspace."""
        ws_dir = os.path.join(self.base_dir, ws_id)
        if os.path.exists(ws_dir):
            shutil.rmtree(ws_dir)
            return True
        return False

    def duplicate_workspace(self, ws_id, new_name):
        """Duplicate a workspace."""
        original = self.load_workspace(ws_id)
        if not original:
            return None

        new_ws = self.create_workspace(new_name, original.get('description', ''))
        new_ws['nodes'] = original.get('nodes', [])
        new_ws['connections'] = original.get('connections', [])
        new_ws['groups'] = original.get('groups', [])
        self.save_workspace(new_ws['id'], new_ws)
        return new_ws

    def export_workspace(self, ws_id, format='json'):
        """Export workspace to specified format."""
        data = self.load_workspace(ws_id)
        if not data:
            return None

        if format == 'json':
            return json.dumps(data, indent=2)

        return json.dumps(data, indent=2)

    def _sanitize_name(self, name):
        """Sanitize workspace name for filesystem."""
        sanitized = ''.join(c if c.isalnum() or c in '-_' else '_' for c in name)
        return sanitized[:50] or 'workspace'