"""Flask server with SocketIO for real-time updates."""
import os
import json
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from .config import Config
from .workspace_manager import WorkspaceManager
from .tools import ToolRegistry

socketio = SocketIO()
workspace_manager = WorkspaceManager()
tool_registry = ToolRegistry()


def create_app():
    """Create and configure Flask application."""
    app = Flask(__name__,
                template_folder=os.path.join(os.path.dirname(__file__), 'templates'),
                static_folder=os.path.join(os.path.dirname(__file__), 'static'))

    app.config['SECRET_KEY'] = Config.SECRET_KEY
    app.config['MAX_CONTENT_LENGTH'] = Config.MAX_CONTENT_LENGTH

    CORS(app)
    socketio.init_app(app, cors_allowed_origins="*", async_mode='threading')

    # ── Page Routes ──────────────────────────────────────────────────
    @app.route('/')
    def index():
        return render_template('index.html')

    # ── Workspace API ────────────────────────────────────────────────
    @app.route('/api/workspaces', methods=['GET'])
    def list_workspaces():
        return jsonify(workspace_manager.list_workspaces())

    @app.route('/api/workspaces', methods=['POST'])
    def create_workspace():
        data = request.get_json()
        name = data.get('name', 'Untitled Investigation')
        description = data.get('description', '')
        path = data.get('path', None)
        ws = workspace_manager.create_workspace(name, description, path)
        return jsonify(ws), 201

    @app.route('/api/workspaces/<ws_id>', methods=['GET'])
    def get_workspace(ws_id):
        ws = workspace_manager.load_workspace(ws_id)
        if ws:
            return jsonify(ws)
        return jsonify({'error': 'Workspace not found'}), 404

    @app.route('/api/workspaces/<ws_id>', methods=['PUT'])
    def save_workspace(ws_id):
        data = request.get_json()
        workspace_manager.save_workspace(ws_id, data)
        return jsonify({'status': 'saved'})

    @app.route('/api/workspaces/<ws_id>', methods=['DELETE'])
    def delete_workspace(ws_id):
        workspace_manager.delete_workspace(ws_id)
        return jsonify({'status': 'deleted'})

    @app.route('/api/workspaces/<ws_id>/duplicate', methods=['POST'])
    def duplicate_workspace(ws_id):
        data = request.get_json()
        new_name = data.get('name', 'Copy')
        ws = workspace_manager.duplicate_workspace(ws_id, new_name)
        if ws:
            return jsonify(ws), 201
        return jsonify({'error': 'Workspace not found'}), 404

    @app.route('/api/workspaces/<ws_id>/export', methods=['GET'])
    def export_workspace(ws_id):
        fmt = request.args.get('format', 'json')
        result = workspace_manager.export_workspace(ws_id, fmt)
        if result:
            return result, 200, {'Content-Type': 'application/json'}
        return jsonify({'error': 'Export failed'}), 404

    # ── Tools API ────────────────────────────────────────────────────
    @app.route('/api/tools', methods=['GET'])
    def list_tools():
        return jsonify(tool_registry.list_tools())

    @app.route('/api/tools/<tool_id>/run', methods=['POST'])
    def run_tool(tool_id):
        data = request.get_json()
        params = data.get('params', {})
        try:
            result = tool_registry.run_tool(tool_id, params)
            return jsonify(result)
        except Exception as e:
            return jsonify({'error': str(e), 'status': 'error'}), 500

    @app.route('/api/tools/<tool_id>/schema', methods=['GET'])
    def tool_schema(tool_id):
        schema = tool_registry.get_tool_schema(tool_id)
        if schema:
            return jsonify(schema)
        return jsonify({'error': 'Tool not found'}), 404

    # ── SocketIO Events ──────────────────────────────────────────────
    @socketio.on('connect')
    def handle_connect():
        emit('connected', {'status': 'ok'})

    @socketio.on('save_workspace')
    def handle_save(data):
        ws_id = data.get('id')
        if ws_id:
            workspace_manager.save_workspace(ws_id, data)
            emit('save_confirmed', {'status': 'saved', 'id': ws_id})

    @socketio.on('run_tool')
    def handle_run_tool(data):
        tool_id = data.get('tool_id')
        params = data.get('params', {})
        node_id = data.get('node_id')
        try:
            result = tool_registry.run_tool(tool_id, params)
            emit('tool_result', {
                'node_id': node_id,
                'tool_id': tool_id,
                'result': result,
                'status': 'success'
            })
        except Exception as e:
            emit('tool_result', {
                'node_id': node_id,
                'tool_id': tool_id,
                'error': str(e),
                'status': 'error'
            })

    return app