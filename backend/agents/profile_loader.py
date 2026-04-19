"""
Agent profile loader for markdown-based investigation personas.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from functools import lru_cache
from pathlib import Path
import re
from typing import Dict, List, Optional


DEFAULT_INVESTIGATION_PROFILE_NAMES = [
    "NEXUS - Commander & Orchestrator",
    "SOVEREIGN - Council Leader & Master Strategist",
    "OREL - OSINT Researcher",
    "TRACE - Digital Forensics Investigator",
    "BISHOP - Attribution Analyst",
    "FLUX - Log & Timeline Expert",
    "VEIL - Dark Web Researcher",
    "PRISM - Traffic & Protocol Analyst",
    "MNEMONIC - Eidetic Memory & Knowledge Synthesizer",
    "RIDDLE - Logic Deductionist",
    "SPHINX - Riddle & Puzzle Master",
    "RAGNAR - War Game Strategist",
    "STERLING - Field Spy & Infiltrator",
    "ORACLE-V - Pattern Predictor",
]

PREVIEW_PROFILE_NAMES = [
    "NEXUS - Commander & Orchestrator",
    "MNEMONIC - Eidetic Memory & Knowledge Synthesizer",
    "RIDDLE - Logic Deductionist",
    "SPHINX - Riddle & Puzzle Master",
    "ORACLE-V - Pattern Predictor",
]


@dataclass
class AgentProfile:
    id: str
    name: str
    codename: str
    title: str
    category: str
    role: str
    personality: str
    behavior: str
    prompt: str
    source_path: str

    def to_public_dict(self) -> Dict[str, str]:
        return asdict(self)


def _agents_root() -> Path:
    return Path(__file__).resolve().parents[2] / "Agents"


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "agent"


def _extract_section(body: str, heading: str) -> str:
    pattern = rf"{heading}:\s*(.*?)(?:\n[A-Z][A-Z ]+:\s*|\Z)"
    match = re.search(pattern, body, flags=re.DOTALL)
    if not match:
        return ""
    return match.group(1).strip()


def _clean_section(text: str) -> str:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return "\n".join(lines)


def _infer_role(title: str, category: str, role_text: str) -> str:
    haystack = f"{title}\n{category}\n{role_text}".lower()

    if "orchestrator" in haystack or "commander" in haystack:
        return "orchestrator"
    if "validator" in haystack or "fact-check" in haystack:
        return "validator"
    if "summar" in haystack or "report" in haystack:
        return "summarizer"
    if "research" in haystack or "osint" in haystack or "intelligence" in haystack:
        return "researcher"
    if "investigat" in haystack or "forensics" in haystack or "incident response" in haystack:
        return "investigator"
    if "analyst" in haystack or "traffic" in haystack or "blockchain" in haystack or "malware" in haystack:
        return "analyst"
    return "specialist"


def _parse_profile(path: Path) -> Optional[AgentProfile]:
    body = path.read_text(encoding="utf-8").strip()
    if not body:
        return None

    title = " ".join(path.stem.split())
    category = " ".join(path.parent.name.split())
    codename = title.split(" - ", 1)[0].strip()

    role_text = _clean_section(_extract_section(body, "ROLE"))
    personality = _clean_section(_extract_section(body, "PERSONALITY"))
    behavior = _clean_section(_extract_section(body, "BEHAVIOR"))

    prompt_parts = [body.splitlines()[0].strip()]
    if personality:
        prompt_parts.append(f"PERSONALITY:\n{personality}")
    if role_text:
        prompt_parts.append(f"ROLE:\n{role_text}")
    if behavior:
        prompt_parts.append(f"BEHAVIOR:\n{behavior}")

    return AgentProfile(
        id=_slugify(f"{category}-{codename}"),
        name=title,
        codename=codename,
        title=title,
        category=category,
        role=_infer_role(title, category, role_text),
        personality=personality,
        behavior=behavior,
        prompt="\n\n".join(part for part in prompt_parts if part),
        source_path=str(path.relative_to(_agents_root().parent)),
    )


@lru_cache(maxsize=1)
def load_agent_profiles() -> List[AgentProfile]:
    root = _agents_root()
    if not root.exists():
        return []

    profiles: List[AgentProfile] = []
    for path in sorted(root.rglob("*.md")):
        profile = _parse_profile(path)
        if profile is not None:
            profiles.append(profile)
    return profiles


def get_agent_profile(name: str) -> Optional[AgentProfile]:
    needle = name.strip().lower()
    if not needle:
        return None

    for profile in load_agent_profiles():
        if profile.name.lower() == needle or profile.codename.lower() == needle or profile.id == _slugify(needle):
            return profile
    return None


def list_agent_profiles() -> List[Dict[str, str]]:
    return [profile.to_public_dict() for profile in load_agent_profiles()]


def list_default_investigation_profiles() -> List[str]:
    available = {profile.name for profile in load_agent_profiles()}
    return [name for name in DEFAULT_INVESTIGATION_PROFILE_NAMES if name in available]


def list_all_profile_names() -> List[str]:
    return [profile.name for profile in load_agent_profiles()]


def list_preview_profiles() -> List[str]:
    available = {profile.name for profile in load_agent_profiles()}
    return [name for name in PREVIEW_PROFILE_NAMES if name in available]
