"""Configuration management for OSINT Workspace."""
import os
import json

class Config:
    """Application configuration."""

    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    WORKSPACE_DIR = os.environ.get('OSINT_WORKSPACE_DIR',
                                    os.path.join(BASE_DIR, 'workspaces'))
    SECRET_KEY = os.urandom(32).hex()
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB max upload
    AUTO_SAVE_INTERVAL = 5  # seconds

    # Tool configurations (no API keys)
    TOOL_TIMEOUT = 30  # seconds
    MAX_CONCURRENT_TOOLS = 5
    USER_AGENT = 'OSINT-Workspace/1.0 (Investigation Tool)'

    @classmethod
    def ensure_workspace_dir(cls):
        """Ensure workspace directory exists."""
        os.makedirs(cls.WORKSPACE_DIR, exist_ok=True)
        return cls.WORKSPACE_DIR