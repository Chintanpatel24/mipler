"""Personal assistant service: memory, profile growth, skills, and case reasoning."""

from __future__ import annotations

import json
import re
import time
from typing import Any, Dict, List, Optional

from .providers import LLMRouter
from .storage import AssistantStorage


class AssistantService:
    def __init__(self, storage: AssistantStorage, router: Optional[LLMRouter] = None):
        self.storage = storage
        self.router = router or LLMRouter()

    def _extract_profile_facts(self, text: str) -> List[str]:
        facts: List[str] = []
        rules = [
            r"\bmy name is\s+([A-Za-z0-9_\- ]{2,40})",
            r"\bi prefer\s+([^\.!?]{3,120})",
            r"\bi work as\s+([^\.!?]{3,120})",
            r"\bi am\s+([^\.!?]{3,120})",
            r"\bi like\s+([^\.!?]{3,120})",
        ]
        lowered = text.strip()
        for pattern in rules:
            for match in re.findall(pattern, lowered, flags=re.IGNORECASE):
                fact = f"User statement: {match.strip()}"
                facts.append(fact[:160])
        return facts[:8]

    def _maybe_create_skill(self, user_id: str, task: str, output: str, complexity: str) -> Optional[str]:
        if complexity not in {"high", "complex"}:
            return None
        title_seed = re.sub(r"[^a-zA-Z0-9 ]+", " ", task).strip()
        if len(title_seed) < 8:
            return None
        name = "Skill - " + " ".join(title_seed.split()[:6]).title()
        desc = f"Reusable skill extracted from a complex task: {title_seed[:180]}"
        template = (
            "Task objective:\n{objective}\n\n"
            "Context:\n{context}\n\n"
            "Expected output style:\n"
            "- concise summary\n- risks\n- verification checklist\n\n"
            "Reference answer snapshot:\n" + output[:600]
        )
        self.storage.save_skill(user_id, name, desc, template)
        return name

    def _build_system_prompt(self, user_id: str) -> str:
        facts = self.storage.get_profile_facts(user_id, limit=20)
        skills = self.storage.list_skills(user_id, limit=12)

        facts_block = "\n".join([f"- {f['fact']} (confidence {f['confidence']:.2f})" for f in facts]) or "- No profile facts yet"
        skills_block = "\n".join([f"- {s['name']}: {s['description']}" for s in skills]) or "- No reusable skills yet"

        return (
            "You are a personal AI assistant that improves over time.\n"
            "Use the profile and skills memory to personalize responses, but avoid fabricating facts.\n"
            "When uncertain, ask focused clarifying questions.\n\n"
            "PROFILE FACTS:\n"
            f"{facts_block}\n\n"
            "KNOWN REUSABLE SKILLS:\n"
            f"{skills_block}\n"
        )

    async def chat(
        self,
        *,
        user_id: str,
        session_id: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        metadata = metadata or {}
        self.storage.save_message(
            session_id=session_id,
            user_id=user_id,
            role="user",
            content=message,
            metadata=metadata,
        )

        for fact in self._extract_profile_facts(message):
            self.storage.upsert_profile_fact(user_id, fact, confidence=0.72)

        settings = self.storage.get_llm_settings()
        history = self.storage.get_recent_messages(user_id, limit=20)

        messages = [{"role": "system", "content": self._build_system_prompt(user_id)}]
        for item in history:
            messages.append({"role": item["role"], "content": item["content"]})

        answer = await self.router.chat(settings, messages)

        self.storage.save_message(
            session_id=session_id,
            user_id=user_id,
            role="assistant",
            content=answer,
            metadata={"provider": settings.get("provider"), "model": settings.get("model")},
        )

        generated_skill = self._maybe_create_skill(
            user_id,
            task=message,
            output=answer,
            complexity=str(metadata.get("complexity", "normal")).lower(),
        )

        return {
            "reply": answer,
            "provider": settings.get("provider"),
            "model": settings.get("model"),
            "skill_generated": generated_skill,
            "timestamp": time.time(),
        }

    async def analyze_case(self, user_id: str, session_id: str, case_text: str) -> Dict[str, Any]:
        settings = self.storage.get_llm_settings()
        prompt = (
            "Analyze this case study deeply. First infer the scenario, then ask only high-value questions "
            "needed to reduce uncertainty. Return JSON with keys: scenario_summary, clarifying_questions, "
            "likely_entities, risk_map, next_best_actions.\n\n"
            f"CASE STUDY:\n{case_text[:14000]}"
        )

        messages = [
            {"role": "system", "content": self._build_system_prompt(user_id)},
            {"role": "user", "content": prompt},
        ]

        raw = await self.router.chat(settings, messages)

        parsed: Optional[Dict[str, Any]] = None
        try:
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
                cleaned = re.sub(r"```$", "", cleaned).strip()
            candidate = json.loads(cleaned)
            if isinstance(candidate, dict):
                parsed = candidate
        except Exception:
            parsed = None

        if not parsed:
            parsed = {
                "scenario_summary": raw[:1200],
                "clarifying_questions": [
                    "What is the primary objective in this case?",
                    "What evidence is strongest versus unverified?",
                    "What timeline constraints exist?",
                    "Which entities are confirmed vs suspected?",
                    "What decision must be made first?",
                ],
                "likely_entities": [],
                "risk_map": [],
                "next_best_actions": [],
            }

        self.storage.save_message(
            session_id=session_id,
            user_id=user_id,
            role="assistant",
            content=json.dumps(parsed, ensure_ascii=True),
            metadata={"kind": "case-analysis"},
        )

        return parsed
