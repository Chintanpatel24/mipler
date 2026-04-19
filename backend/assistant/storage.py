"""Persistent local storage for the personal assistant."""

from __future__ import annotations

import base64
import json
import os
import sqlite3
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from cryptography.fernet import Fernet


class AssistantStorage:
    def __init__(self, db_path: Optional[Path] = None):
        base_dir = Path(__file__).resolve().parents[2] / "data"
        base_dir.mkdir(parents=True, exist_ok=True)
        self.db_path = db_path or (base_dir / "assistant.db")
        self.key_path = base_dir / ".assistant.key"
        self._fernet = Fernet(self._load_or_create_key())
        self._init_db()

    def _load_or_create_key(self) -> bytes:
        env_key = os.getenv("MIPLER_SECRET_KEY", "").strip()
        if env_key:
            try:
                return env_key.encode("utf-8")
            except Exception as exc:
                raise RuntimeError("Invalid MIPLER_SECRET_KEY format") from exc

        if self.key_path.exists():
            return self.key_path.read_bytes().strip()

        key = Fernet.generate_key()
        self.key_path.write_bytes(key)
        os.chmod(self.key_path, 0o600)
        return key

    def _conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._conn() as conn:
            conn.executescript(
                """
                PRAGMA journal_mode=WAL;
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    metadata_json TEXT NOT NULL DEFAULT '{}',
                    created_at REAL NOT NULL
                );

                CREATE TABLE IF NOT EXISTS profile_facts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    fact TEXT NOT NULL,
                    confidence REAL NOT NULL DEFAULT 0.5,
                    created_at REAL NOT NULL,
                    UNIQUE(user_id, fact)
                );

                CREATE TABLE IF NOT EXISTS skills (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT NOT NULL,
                    prompt_template TEXT NOT NULL,
                    use_count INTEGER NOT NULL DEFAULT 0,
                    created_at REAL NOT NULL,
                    last_used_at REAL,
                    UNIQUE(user_id, name)
                );

                CREATE TABLE IF NOT EXISTS llm_settings (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    provider TEXT NOT NULL,
                    model TEXT NOT NULL,
                    base_url TEXT,
                    api_key_encrypted TEXT,
                    updated_at REAL NOT NULL
                );

                CREATE TABLE IF NOT EXISTS schedules (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    name TEXT NOT NULL,
                    prompt TEXT NOT NULL,
                    daily_time_utc TEXT NOT NULL,
                    destination TEXT NOT NULL DEFAULT 'local',
                    enabled INTEGER NOT NULL DEFAULT 1,
                    last_run_at REAL,
                    next_run_at REAL,
                    created_at REAL NOT NULL
                );

                CREATE TABLE IF NOT EXISTS reports (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    schedule_id INTEGER NOT NULL,
                    user_id TEXT NOT NULL,
                    output TEXT NOT NULL,
                    created_at REAL NOT NULL,
                    FOREIGN KEY(schedule_id) REFERENCES schedules(id)
                );

                CREATE TABLE IF NOT EXISTS gateway_settings (
                    name TEXT PRIMARY KEY,
                    value_encrypted TEXT NOT NULL,
                    updated_at REAL NOT NULL
                );
                """
            )

            existing = conn.execute("SELECT id FROM llm_settings WHERE id = 1").fetchone()
            if not existing:
                conn.execute(
                    """
                    INSERT INTO llm_settings (id, provider, model, base_url, api_key_encrypted, updated_at)
                    VALUES (1, 'ollama', 'qwen2.5:0.5b', 'http://localhost:11434', NULL, ?)
                    """,
                    (time.time(),),
                )

    def encrypt(self, plain: str) -> str:
        if not plain:
            return ""
        token = self._fernet.encrypt(plain.encode("utf-8"))
        return base64.urlsafe_b64encode(token).decode("utf-8")

    def decrypt(self, cipher: str) -> str:
        if not cipher:
            return ""
        token = base64.urlsafe_b64decode(cipher.encode("utf-8"))
        return self._fernet.decrypt(token).decode("utf-8")

    def save_message(
        self,
        *,
        session_id: str,
        user_id: str,
        role: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        with self._conn() as conn:
            conn.execute(
                """
                INSERT INTO messages (session_id, user_id, role, content, metadata_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    session_id,
                    user_id,
                    role,
                    content,
                    json.dumps(metadata or {}, ensure_ascii=True),
                    time.time(),
                ),
            )

    def get_recent_messages(self, user_id: str, limit: int = 30) -> List[Dict[str, Any]]:
        with self._conn() as conn:
            rows = conn.execute(
                """
                SELECT session_id, role, content, metadata_json, created_at
                FROM messages
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (user_id, limit),
            ).fetchall()

        out: List[Dict[str, Any]] = []
        for row in reversed(rows):
            out.append(
                {
                    "session_id": row["session_id"],
                    "role": row["role"],
                    "content": row["content"],
                    "metadata": json.loads(row["metadata_json"] or "{}"),
                    "created_at": row["created_at"],
                }
            )
        return out

    def upsert_profile_fact(self, user_id: str, fact: str, confidence: float = 0.7) -> None:
        with self._conn() as conn:
            conn.execute(
                """
                INSERT INTO profile_facts (user_id, fact, confidence, created_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(user_id, fact)
                DO UPDATE SET confidence = MAX(confidence, excluded.confidence)
                """,
                (user_id, fact.strip(), confidence, time.time()),
            )

    def get_profile_facts(self, user_id: str, limit: int = 40) -> List[Dict[str, Any]]:
        with self._conn() as conn:
            rows = conn.execute(
                """
                SELECT fact, confidence, created_at
                FROM profile_facts
                WHERE user_id = ?
                ORDER BY confidence DESC, created_at DESC
                LIMIT ?
                """,
                (user_id, limit),
            ).fetchall()
        return [dict(row) for row in rows]

    def save_skill(self, user_id: str, name: str, description: str, prompt_template: str) -> None:
        with self._conn() as conn:
            conn.execute(
                """
                INSERT INTO skills (user_id, name, description, prompt_template, created_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(user_id, name)
                DO UPDATE SET
                    description = excluded.description,
                    prompt_template = excluded.prompt_template
                """,
                (user_id, name.strip(), description.strip(), prompt_template.strip(), time.time()),
            )

    def list_skills(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        with self._conn() as conn:
            rows = conn.execute(
                """
                SELECT id, name, description, prompt_template, use_count, created_at, last_used_at
                FROM skills
                WHERE user_id = ?
                ORDER BY use_count DESC, created_at DESC
                LIMIT ?
                """,
                (user_id, limit),
            ).fetchall()
        return [dict(row) for row in rows]

    def mark_skill_used(self, user_id: str, name: str) -> None:
        with self._conn() as conn:
            conn.execute(
                """
                UPDATE skills
                SET use_count = use_count + 1,
                    last_used_at = ?
                WHERE user_id = ? AND name = ?
                """,
                (time.time(), user_id, name),
            )

    def get_llm_settings(self) -> Dict[str, Any]:
        with self._conn() as conn:
            row = conn.execute(
                "SELECT provider, model, base_url, api_key_encrypted, updated_at FROM llm_settings WHERE id = 1"
            ).fetchone()

        if not row:
            return {
                "provider": "ollama",
                "model": "qwen2.5:0.5b",
                "base_url": "http://localhost:11434",
                "api_key": "",
                "updated_at": time.time(),
            }

        return {
            "provider": row["provider"],
            "model": row["model"],
            "base_url": row["base_url"] or "",
            "api_key": self.decrypt(row["api_key_encrypted"] or ""),
            "updated_at": row["updated_at"],
        }

    def set_llm_settings(self, provider: str, model: str, base_url: str, api_key: str) -> Dict[str, Any]:
        encrypted = self.encrypt(api_key)
        now = time.time()
        with self._conn() as conn:
            conn.execute(
                """
                UPDATE llm_settings
                SET provider = ?, model = ?, base_url = ?, api_key_encrypted = ?, updated_at = ?
                WHERE id = 1
                """,
                (provider, model, base_url, encrypted or None, now),
            )
        return self.get_llm_settings()

    def set_gateway_secret(self, name: str, value: str) -> None:
        with self._conn() as conn:
            conn.execute(
                """
                INSERT INTO gateway_settings (name, value_encrypted, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(name)
                DO UPDATE SET value_encrypted = excluded.value_encrypted, updated_at = excluded.updated_at
                """,
                (name, self.encrypt(value), time.time()),
            )

    def get_gateway_secret(self, name: str) -> str:
        with self._conn() as conn:
            row = conn.execute(
                "SELECT value_encrypted FROM gateway_settings WHERE name = ?",
                (name,),
            ).fetchone()
        if not row:
            return ""
        return self.decrypt(row["value_encrypted"])

    def add_schedule(self, user_id: str, name: str, prompt: str, daily_time_utc: str, destination: str) -> Dict[str, Any]:
        now = time.time()
        with self._conn() as conn:
            cur = conn.execute(
                """
                INSERT INTO schedules (user_id, name, prompt, daily_time_utc, destination, enabled, created_at)
                VALUES (?, ?, ?, ?, ?, 1, ?)
                """,
                (user_id, name, prompt, daily_time_utc, destination, now),
            )
            schedule_id = int(cur.lastrowid)

        return self.get_schedule(schedule_id)

    def get_schedule(self, schedule_id: int) -> Dict[str, Any]:
        with self._conn() as conn:
            row = conn.execute(
                "SELECT * FROM schedules WHERE id = ?",
                (schedule_id,),
            ).fetchone()
        return dict(row) if row else {}

    def list_schedules(self, user_id: str) -> List[Dict[str, Any]]:
        with self._conn() as conn:
            rows = conn.execute(
                "SELECT * FROM schedules WHERE user_id = ? ORDER BY created_at DESC",
                (user_id,),
            ).fetchall()
        return [dict(row) for row in rows]

    def list_due_schedules(self, now_ts: float) -> List[Dict[str, Any]]:
        with self._conn() as conn:
            rows = conn.execute(
                """
                SELECT *
                FROM schedules
                WHERE enabled = 1
                AND (next_run_at IS NULL OR next_run_at <= ?)
                """,
                (now_ts,),
            ).fetchall()
        return [dict(row) for row in rows]

    def update_schedule_next_run(self, schedule_id: int, next_run_at: float, last_run_at: Optional[float] = None) -> None:
        with self._conn() as conn:
            conn.execute(
                """
                UPDATE schedules
                SET next_run_at = ?,
                    last_run_at = COALESCE(?, last_run_at)
                WHERE id = ?
                """,
                (next_run_at, last_run_at, schedule_id),
            )

    def save_report(self, schedule_id: int, user_id: str, output: str) -> None:
        with self._conn() as conn:
            conn.execute(
                """
                INSERT INTO reports (schedule_id, user_id, output, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (schedule_id, user_id, output, time.time()),
            )

    def list_reports(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        with self._conn() as conn:
            rows = conn.execute(
                """
                SELECT r.id, r.schedule_id, r.output, r.created_at
                FROM reports r
                WHERE r.user_id = ?
                ORDER BY r.created_at DESC
                LIMIT ?
                """,
                (user_id, limit),
            ).fetchall()
        return [dict(row) for row in rows]

    def reset_all(self) -> None:
        with self._conn() as conn:
            conn.executescript(
                """
                DELETE FROM messages;
                DELETE FROM profile_facts;
                DELETE FROM skills;
                DELETE FROM schedules;
                DELETE FROM reports;
                DELETE FROM gateway_settings;
                """
            )
            conn.execute(
                """
                UPDATE llm_settings
                SET provider = 'ollama',
                    model = 'qwen2.5:0.5b',
                    base_url = 'http://localhost:11434',
                    api_key_encrypted = NULL,
                    updated_at = ?
                WHERE id = 1
                """,
                (time.time(),),
            )
