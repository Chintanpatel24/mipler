"""Simple built-in scheduler for automated daily assistant tasks."""

from __future__ import annotations

import asyncio
import datetime as dt
import time
from typing import Any, Dict, Optional

import httpx

from .service import AssistantService
from .storage import AssistantStorage


class AssistantScheduler:
    def __init__(self, storage: AssistantStorage, assistant: AssistantService):
        self.storage = storage
        self.assistant = assistant
        self._task: Optional[asyncio.Task] = None
        self._running = False

    def _next_run_from_daily_time(self, daily_time_utc: str, now: Optional[dt.datetime] = None) -> float:
        now = now or dt.datetime.now(tz=dt.timezone.utc)
        hour, minute = [int(x) for x in daily_time_utc.split(":", 1)]
        candidate = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if candidate <= now:
            candidate += dt.timedelta(days=1)
        return candidate.timestamp()

    async def _deliver_if_needed(self, schedule: Dict[str, Any], output: str):
        destination = (schedule.get("destination") or "local").strip().lower()
        if destination == "telegram":
            token = self.storage.get_gateway_secret("telegram_bot_token")
            chat_id = self.storage.get_gateway_secret("telegram_chat_id")
            if token and chat_id:
                async with httpx.AsyncClient(timeout=30) as client:
                    await client.post(
                        f"https://api.telegram.org/bot{token}/sendMessage",
                        json={"chat_id": chat_id, "text": output[:3900]},
                    )

    async def run_once(self):
        now_ts = time.time()
        due = self.storage.list_due_schedules(now_ts)
        for item in due:
            schedule_id = int(item["id"])
            user_id = str(item["user_id"])
            prompt = str(item["prompt"])

            next_run = self._next_run_from_daily_time(str(item["daily_time_utc"]))
            self.storage.update_schedule_next_run(schedule_id, next_run_at=next_run, last_run_at=now_ts)

            result = await self.assistant.chat(
                user_id=user_id,
                session_id=f"schedule-{schedule_id}",
                message=prompt,
                metadata={"complexity": "normal", "scheduled": True},
            )
            output = result.get("reply", "")
            self.storage.save_report(schedule_id, user_id, output)
            await self._deliver_if_needed(item, output)

    async def _loop(self):
        while self._running:
            try:
                await self.run_once()
            except Exception:
                pass
            await asyncio.sleep(20)

    def start(self):
        if self._running:
            return
        self._running = True
        self._task = asyncio.create_task(self._loop())

    async def stop(self):
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except Exception:
                pass
            self._task = None
