"""
Swarm Agent System - Multi-agent coordination for investigations
Agents communicate, share knowledge, delegate tasks, and build consensus
"""
import asyncio
import json
import time
import uuid
import re
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set
from dataclasses import dataclass, field

from bs4 import BeautifulSoup

from .profile_loader import (
    get_agent_profile,
    list_all_profile_names,
    list_default_investigation_profiles,
    list_preview_profiles,
)


class AgentRole(str, Enum):
    RESEARCHER = "researcher"
    ANALYST = "analyst"
    INVESTIGATOR = "investigator"
    SUMMARIZER = "summarizer"
    VALIDATOR = "validator"
    ORCHESTRATOR = "orchestrator"
    SPECIALIST = "specialist"


class AgentStatus(str, Enum):
    IDLE = "idle"
    THINKING = "thinking"
    WORKING = "working"
    WAITING = "waiting"
    DONE = "done"
    ERROR = "error"


@dataclass
class AgentMessage:
    id: str
    sender_id: str
    recipient_id: str
    content: str
    msg_type: str = "data"  # data, question, answer, task, result, consensus
    timestamp: float = field(default_factory=time.time)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class KnowledgeEntry:
    id: str
    source_agent: str
    topic: str
    content: Any
    confidence: float = 1.0
    timestamp: float = field(default_factory=time.time)
    tags: Set[str] = field(default_factory=set)


@dataclass
class SwarmAgent:
    id: str
    name: str
    role: AgentRole
    personality: str
    behavior: str = ""
    model: str = "qwen2.5:0.5b"
    status: AgentStatus = AgentStatus.IDLE
    capabilities: Set[str] = field(default_factory=set)
    inbox: List[AgentMessage] = field(default_factory=list)
    outbox: List[AgentMessage] = field(default_factory=list)
    knowledge: List[KnowledgeEntry] = field(default_factory=list)
    context: Dict[str, Any] = field(default_factory=dict)
    result: Optional[str] = None
    ollama_url: str = "http://localhost:11434"
    internet_access: bool = False
    response_style: str = "options-only"
    reinforcement_score: float = 0.5
    experience_count: int = 0
    profile_name: str = ""


@dataclass
class ConsensusVote:
    agent_id: str
    topic: str
    vote: Any
    confidence: float
    reasoning: str


@dataclass
class SwarmTask:
    id: str
    description: str
    assigned_agents: List[str]
    status: str = "pending"
    result: Any = None
    votes: List[ConsensusVote] = field(default_factory=list)


class SwarmCoordinator:
    """Coordinates multiple agents working together on investigations"""

    def __init__(self):
        self.agents: Dict[str, SwarmAgent] = {}
        self.shared_knowledge: List[KnowledgeEntry] = []
        self.message_queue: asyncio.Queue = asyncio.Queue()
        self.tasks: Dict[str, SwarmTask] = {}
        self._running = False
        self._callbacks: List[Callable] = []
        self.policy_memory: Dict[str, Dict[str, Any]] = {}

    def register_callback(self, cb: Callable):
        self._callbacks.append(cb)

    def _resolve_agent_role(self, name: str, fallback: AgentRole = AgentRole.ANALYST) -> AgentRole:
        profile = get_agent_profile(name)
        if not profile:
            return fallback
        try:
            return AgentRole(profile.role)
        except ValueError:
            return fallback

    def populate_default_agents(
        self,
        profile_names: Optional[List[str]] = None,
        response_style: str = "options-only",
        internet_access: bool = False,
    ):
        names = profile_names or list_all_profile_names() or list_default_investigation_profiles()
        for index, name in enumerate(names):
            fallback = AgentRole.ORCHESTRATOR if index == 0 else AgentRole.ANALYST
            self.add_agent(
                name=name,
                role=self._resolve_agent_role(name, fallback),
                personality="",
                response_style=response_style,
                internet_access=internet_access,
                profile_name=name,
            )

    async def _notify(self, event: Dict[str, Any]):
        for cb in self._callbacks:
            try:
                if asyncio.iscoroutinefunction(cb):
                    await cb(event)
                else:
                    cb(event)
            except Exception:
                pass

    def add_agent(self, name: str, role: AgentRole, personality: str,
                  model: str = "qwen2.5:0.5b", capabilities: Set[str] = None,
                  ollama_url: str = "http://localhost:11434",
                  internet_access: bool = False,
                  response_style: str = "options-only",
                  behavior: str = "",
                  profile_name: str = "") -> SwarmAgent:
        profile = get_agent_profile(profile_name or name)
        resolved_name = profile.name if profile else name
        resolved_role = role
        if profile:
            try:
                resolved_role = AgentRole(profile.role)
            except ValueError:
                resolved_role = role
        resolved_personality = profile.prompt if profile else personality
        resolved_behavior = profile.behavior if profile else behavior
        agent_id = f"agent-{uuid.uuid4().hex[:8]}"
        prior_policy = self.policy_memory.get(resolved_name.lower(), {})
        agent = SwarmAgent(
            id=agent_id,
            name=resolved_name,
            role=resolved_role,
            personality=resolved_personality or personality,
            behavior=resolved_behavior,
            model=model,
            capabilities=capabilities or set(),
            ollama_url=ollama_url,
            internet_access=internet_access,
            response_style=response_style,
            reinforcement_score=float(prior_policy.get("reinforcement_score", 0.5)),
            experience_count=int(prior_policy.get("experience_count", 0)),
            profile_name=profile.name if profile else profile_name,
        )
        self.agents[agent_id] = agent
        return agent

    def remove_agent(self, agent_id: str):
        self.agents.pop(agent_id, None)

    async def send_message(self, msg: AgentMessage):
        """Send a message between agents"""
        if msg.recipient_id in self.agents:
            self.agents[msg.recipient_id].inbox.append(msg)
        if msg.sender_id in self.agents:
            self.agents[msg.sender_id].outbox.append(msg)
        await self.message_queue.put(msg)
        await self._notify({
            "type": "agent_message",
            "sender": msg.sender_id,
            "recipient": msg.recipient_id,
            "content": msg.content[:200],
            "msg_type": msg.msg_type,
        })

    def broadcast(self, sender_id: str, content: str, msg_type: str = "data"):
        """Broadcast a message to all agents"""
        for agent_id in self.agents:
            if agent_id != sender_id:
                msg = AgentMessage(
                    id=f"msg-{uuid.uuid4().hex[:8]}",
                    sender_id=sender_id,
                    recipient_id=agent_id,
                    content=content,
                    msg_type=msg_type,
                )
                self.agents[agent_id].inbox.append(msg)

    def add_knowledge(self, agent_id: str, topic: str, content: Any,
                      confidence: float = 1.0, tags: Set[str] = None):
        """Add knowledge to shared pool"""
        entry = KnowledgeEntry(
            id=f"know-{uuid.uuid4().hex[:8]}",
            source_agent=agent_id,
            topic=topic,
            content=content,
            confidence=confidence,
            tags=tags or set(),
        )
        self.shared_knowledge.append(entry)
        if agent_id in self.agents:
            self.agents[agent_id].knowledge.append(entry)
        return entry

    def query_knowledge(self, topic: str = None, tags: Set[str] = None) -> List[KnowledgeEntry]:
        """Query shared knowledge base"""
        results = []
        for entry in self.shared_knowledge:
            if topic and topic.lower() not in entry.topic.lower():
                continue
            if tags and not tags.intersection(entry.tags):
                continue
            results.append(entry)
        return sorted(results, key=lambda e: e.confidence, reverse=True)

    async def _call_ollama(self, agent: SwarmAgent, prompt: str, system: str = None) -> str:
        """Call Ollama API for agent reasoning"""
        import httpx
        url = f"{agent.ollama_url}/api/chat"
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        try:
            async with httpx.AsyncClient(timeout=120) as client:
                resp = await client.post(url, json={
                    "model": agent.model,
                    "messages": messages,
                    "stream": False,
                })
                data = resp.json()
                return data.get("message", {}).get("content", data.get("response", ""))
        except Exception as e:
            return f"[Agent {agent.name} error: {e}]"

    def _clean_json_response(self, raw_text: str) -> Optional[Dict[str, Any]]:
        try:
            cleaned = raw_text.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
                cleaned = re.sub(r"```$", "", cleaned).strip()
            parsed = json.loads(cleaned)
            return parsed if isinstance(parsed, dict) else None
        except Exception:
            return None

    def _top_level_keys(self, payload: Any) -> List[str]:
        if isinstance(payload, dict):
            return list(payload.keys())[:12]
        if isinstance(payload, list) and payload and isinstance(payload[0], dict):
            return list(payload[0].keys())[:12]
        return []

    def _normalize_recommended_agents(self, candidates: List[Any]) -> List[str]:
        normalized: List[str] = []
        seen: Set[str] = set()
        for item in candidates:
            if not isinstance(item, str):
                continue
            profile = get_agent_profile(item)
            if not profile:
                continue
            if profile.name not in seen:
                seen.add(profile.name)
                normalized.append(profile.name)
        return normalized

    async def _search_web_for_agent(self, agent: SwarmAgent, query: str, max_results: int = 4) -> List[Dict[str, str]]:
        """Fetch web snippets only when the user granted internet access to the agent."""
        if not agent.internet_access or not query.strip():
            return []

        import httpx
        try:
            async with httpx.AsyncClient(timeout=12, follow_redirects=True) as client:
                resp = await client.post("https://duckduckgo.com/html/", data={"q": query[:220]})
            html = resp.text
            matches = re.findall(r'<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', html)
            out = []
            for href, raw_title in matches[:max_results]:
                title = re.sub(r"<[^>]+>", "", raw_title).strip()
                out.append({"title": title, "url": href})
            return out
        except Exception:
            return []

    def _extract_urls(self, text: str) -> List[str]:
        if not text.strip():
            return []

        matches = re.findall(r"https?://[^\s)>\]]+", text)
        deduped: List[str] = []
        seen: Set[str] = set()
        for match in matches:
            cleaned = match.rstrip('.,;"\'')
            if cleaned not in seen:
                seen.add(cleaned)
                deduped.append(cleaned)
        return deduped

    async def _fetch_page_excerpt(self, url: str) -> Optional[Dict[str, str]]:
        try:
            import httpx

            async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
                resp = await client.get(url, headers={"User-Agent": "MiplerInvestigationBot/1.0"})
                resp.raise_for_status()

            soup = BeautifulSoup(resp.text, "lxml")
            for tag in soup(["script", "style", "noscript"]):
                tag.decompose()

            title = soup.title.get_text(" ", strip=True) if soup.title else url
            body_text = " ".join(soup.stripped_strings)
            excerpt = body_text[:1600]
            if not excerpt:
                return None

            return {"url": str(resp.url), "title": title, "excerpt": excerpt}
        except Exception:
            return None

    async def _collect_web_context(self, agent: SwarmAgent, task: str, context_data: Any = None) -> Dict[str, Any]:
        if not agent.internet_access:
            return {"search_results": [], "pages": []}

        context_text = json.dumps(context_data, default=str)[:2000] if context_data is not None else ""
        direct_urls = self._extract_urls(f"{task}\n{context_text}")
        pages: List[Dict[str, str]] = []

        for url in direct_urls[:2]:
            page = await self._fetch_page_excerpt(url)
            if page:
                pages.append(page)

        search_results = await self._search_web_for_agent(agent, f"{task} {context_text}"[:400], max_results=4)

        if not pages:
            for result in search_results[:2]:
                page = await self._fetch_page_excerpt(result["url"])
                if page:
                    pages.append(page)

        return {"search_results": search_results, "pages": pages}

    def _score_output(self, output: str) -> float:
        """Simple reward heuristic to mimic reinforcement updates across runs."""
        if not output:
            return 0.2

        lower = output.lower()
        has_options = all(k in lower for k in ["option 1", "option 2", "option 3"])
        has_confidence = "confidence" in lower
        has_evidence = "evidence" in lower
        has_risk = "risk" in lower

        score = 0.35
        if has_options:
            score += 0.25
        if has_confidence:
            score += 0.15
        if has_evidence:
            score += 0.15
        if has_risk:
            score += 0.10

        return min(max(score, 0.0), 1.0)

    def _update_policy(self, agent: SwarmAgent, reward: float):
        """Update per-agent policy memory (RL-like exponential moving reward)."""
        alpha = 0.25
        agent.reinforcement_score = (1 - alpha) * agent.reinforcement_score + alpha * reward
        agent.experience_count += 1
        self.policy_memory[agent.name.lower()] = {
            "reinforcement_score": round(agent.reinforcement_score, 4),
            "experience_count": agent.experience_count,
            "updated_at": time.time(),
        }

    async def run_agent(self, agent_id: str, task: str, context_data: Any = None) -> str:
        """Run a single agent with a task"""
        agent = self.agents.get(agent_id)
        if not agent:
            raise ValueError(f"Agent {agent_id} not found")

        agent.status = AgentStatus.THINKING
        await self._notify({"type": "agent_status", "agent_id": agent_id, "status": "thinking"})

        # Gather context from inbox and shared knowledge
        inbox_summary = ""
        if agent.inbox:
            inbox_msgs = agent.inbox[-5:]
            inbox_summary = "\n".join([
                f"[{m.msg_type} from {self.agents.get(m.sender_id, type('obj', (object,), {'name': m.sender_id})).name if m.sender_id in self.agents else m.sender_id}]: {m.content}"
                for m in inbox_msgs
            ])

        knowledge_summary = ""
        related_knowledge = self.query_knowledge(topic=task)
        if related_knowledge:
            knowledge_summary = "\n".join([
                f"[Knowledge from {self.agents.get(k.source_agent, type('obj', (object,), {'name': k.source_agent})).name if k.source_agent in self.agents else k.source_agent}]: {k.content}"
                for k in related_knowledge[:3]
            ])

        data_context = ""
        if context_data:
            data_context = f"\nDATA CONTEXT:\n{json.dumps(context_data, default=str)[:3000]}"

        web_context = ""
        web_bundle = await self._collect_web_context(agent, task, context_data)
        if web_bundle["search_results"]:
            lines = [f"- {w['title']} ({w['url']})" for w in web_bundle["search_results"]]
            web_context += "\nWEB SEARCH RESULTS (permission enabled):\n" + "\n".join(lines)
        if web_bundle["pages"]:
            page_blocks = [
                f"- {page['title']} ({page['url']})\n  {page['excerpt']}"
                for page in web_bundle["pages"]
            ]
            web_context += "\nWEBSITE EXCERPTS:\n" + "\n\n".join(page_blocks)

        policy_guidance = (
            f"\nADAPTIVE POLICY:\n"
            f"- reinforcement_score: {agent.reinforcement_score:.2f}\n"
            f"- experience_count: {agent.experience_count}\n"
            f"Tune detail/depth based on this score and keep output actionable."
        )

        if agent.response_style == "preview-schema":
            full_prompt = f"""You are {agent.name}, a {agent.role.value} agent.
PERSONA:
{agent.personality}
{f"BEHAVIOR:\n{agent.behavior}" if agent.behavior else ""}

TASK: {task}
{data_context}
{web_context}

{"RECENT MESSAGES FROM OTHER AGENTS:" + chr(10) + inbox_summary if inbox_summary else ""}
{"RELEVANT KNOWLEDGE:" + chr(10) + knowledge_summary if knowledge_summary else ""}

Return concise investigation intake notes with these headings:
- Case Shape
- Key Entities
- Relationships
- Timeline
- Hypotheses
- Assumptions
- Gaps
- Recommended Specialists
Ground every point in the supplied JSON or evidence."""
        else:
            full_prompt = f"""You are {agent.name}, a {agent.role.value} agent.
PERSONA:
{agent.personality}
{f"BEHAVIOR:\n{agent.behavior}" if agent.behavior else ""}

TASK: {task}
{data_context}
{web_context}
{policy_guidance}

{"RECENT MESSAGES FROM OTHER AGENTS:" + chr(10) + inbox_summary if inbox_summary else ""}
{"RELEVANT KNOWLEDGE:" + chr(10) + knowledge_summary if knowledge_summary else ""}

Return exactly 3 options: Option 1, Option 2, Option 3.
For each option include: decision, evidence, confidence (0-100), risk level, and next verification step.
Ground every claim in the available evidence. If internet access is enabled, clearly separate website-derived evidence from uploaded evidence.
Do not output generic suggestions."""

        agent.status = AgentStatus.WORKING
        await self._notify({"type": "agent_status", "agent_id": agent_id, "status": "working"})

        result = await self._call_ollama(agent, full_prompt, system=agent.personality)
        agent.result = result
        agent.status = AgentStatus.DONE

        reward = self._score_output(result)
        self._update_policy(agent, reward)

        self.add_knowledge(agent_id, task[:100], result, tags={agent.role.value})

        await self._notify({
            "type": "agent_status",
            "agent_id": agent_id,
            "status": "done",
            "result": result[:500],
        })

        return result

    async def run_swarm(self, task: str, context_data: Any = None,
                        strategy: str = "pipeline") -> Dict[str, Any]:
        """
        Run the full swarm on a task.
        Strategies:
        - pipeline: agents execute sequentially, each building on previous
        - parallel: all agents work simultaneously, then consensus
        - debate: agents critique each other's findings
        """
        swarm_id = f"swarm-{uuid.uuid4().hex[:8]}"
        results = {}

        await self._notify({"type": "swarm_start", "swarm_id": swarm_id, "strategy": strategy, "task": task})

        agent_list = list(self.agents.values())
        if not agent_list:
            return {"error": "No agents in swarm"}

        if strategy == "pipeline":
            # Sequential pipeline - each agent builds on previous
            context = context_data
            for agent in agent_list:
                agent_task = f"{task}\n\nPrevious agent outputs: {json.dumps(results, default=str)[:2000]}" if results else task
                result = await self.run_agent(agent.id, agent_task, context)
                results[agent.id] = {
                    "name": agent.name,
                    "role": agent.role.value,
                    "result": result,
                }
                # Send result to next agent
                next_idx = agent_list.index(agent) + 1
                if next_idx < len(agent_list):
                    msg = AgentMessage(
                        id=f"msg-{uuid.uuid4().hex[:8]}",
                        sender_id=agent.id,
                        recipient_id=agent_list[next_idx].id,
                        content=result[:1000],
                        msg_type="result",
                    )
                    await self.send_message(msg)

        elif strategy == "parallel":
            # All agents work in parallel
            tasks = [
                self.run_agent(agent.id, task, context_data)
                for agent in agent_list
            ]
            agent_results = await asyncio.gather(*tasks, return_exceptions=True)
            for agent, result in zip(agent_list, agent_results):
                results[agent.id] = {
                    "name": agent.name,
                    "role": agent.role.value,
                    "result": str(result) if not isinstance(result, Exception) else f"Error: {result}",
                }

        elif strategy == "debate":
            # Round-robin debate
            rounds = 3
            for round_num in range(rounds):
                for agent in agent_list:
                    debate_context = f"Round {round_num + 1}/{rounds}. Other agents' findings:\n"
                    for other_id, other_result in results.items():
                        if other_id != agent.id:
                            debate_context += f"- {other_result['name']}: {other_result['result'][:300]}\n"
                    agent_task = f"{task}\n\n{debate_context}\nProvide your analysis. {'Refine based on others.' if round_num > 0 else ''}"
                    result = await self.run_agent(agent.id, agent_task, context_data)
                    results[agent.id] = {
                        "name": agent.name,
                        "role": agent.role.value,
                        "result": result,
                    }

        # Build consensus
        consensus = await self._build_consensus(results, task)

        await self._notify({
            "type": "swarm_complete",
            "swarm_id": swarm_id,
            "results": results,
            "consensus": consensus,
        })

        return {
            "swarm_id": swarm_id,
            "strategy": strategy,
            "agent_results": results,
            "consensus": consensus,
        }

    async def preview_investigation(self, raw_data: Any, question: str = "", graph_context: Any = None) -> Dict[str, Any]:
        if not self.agents:
            self.populate_default_agents(list_preview_profiles(), response_style="preview-schema")

        preview_task = (
            "Understand the uploaded investigation intake and infer the case structure. "
            "Focus on what the JSON appears to represent, the likely entities involved, the main relationships, "
            "the likely timeline, missing pieces, and which specialists should drive the next stage."
        )
        if question:
            preview_task += f"\n\nUser question:\n{question}"
        if graph_context:
            preview_task += f"\n\nGraph context:\n{json.dumps(graph_context, default=str)[:1600]}"

        context_data = {
            "raw_data": raw_data,
            "question": question,
            "graph_context": graph_context,
        }

        results: Dict[str, Any] = {}
        tasks = [
            self.run_agent(agent.id, preview_task, context_data)
            for agent in list(self.agents.values())
        ]
        agent_outputs = await asyncio.gather(*tasks, return_exceptions=True)
        for agent, result in zip(list(self.agents.values()), agent_outputs):
            results[agent.id] = {
                "name": agent.name,
                "role": agent.role.value,
                "result": str(result) if not isinstance(result, Exception) else f"Error: {result}",
            }

        preview = await self._build_preview_consensus(results, raw_data, question)
        return {
            "agent_results": results,
            "preview": preview,
        }

    async def _build_consensus(self, results: Dict[str, Any], topic: str) -> Dict[str, Any]:
        """Build consensus from all agent results"""
        if not results:
            return {"summary": "No results to build consensus from"}

        all_findings = []
        for aid, r in results.items():
            all_findings.append(f"[{r['role']} - {r['name']}]: {r['result'][:500]}")

        combined = "\n\n".join(all_findings)

        # Use the first agent (or orchestrator) to synthesize
        synthesizer = None
        for agent in self.agents.values():
            if agent.role == AgentRole.ORCHESTRATOR:
                synthesizer = agent
                break
        if not synthesizer:
            synthesizer = list(self.agents.values())[0]

        synthesis_prompt = f"""Synthesize these findings into a final consensus report.
Topic: {topic}

AGENT FINDINGS:
{combined}

Return ONLY valid JSON in this exact schema:
{{
  "summary": "string",
  "threat_level": "low|medium|high|critical",
  "question_answer": "string",
  "options": [
    {{"title": "Option 1", "decision": "string", "evidence": "string", "confidence": 0, "risk": "low|medium|high", "verification_step": "string"}},
    {{"title": "Option 2", "decision": "string", "evidence": "string", "confidence": 0, "risk": "low|medium|high", "verification_step": "string"}},
    {{"title": "Option 3", "decision": "string", "evidence": "string", "confidence": 0, "risk": "low|medium|high", "verification_step": "string"}}
  ],
  "simulation": {{
    "scenario": "string",
    "forecast": "string",
    "assumptions": ["string"],
    "confidence": 0
  }},
  "chosen_option": "Option X",
  "rationale": "string",
  "intelligence_gaps": ["string", "string"],
  "priority_actions": ["string", "string"],
  "overall_confidence": 0
}}
Rules:
- confidence fields are integers 0-100
- question_answer must be a short direct answer to the user's main question when a question is present in the topic
- simulation.forecast must explicitly state what is likely to happen next based on the proposed move or scenario
- no markdown
- no generic suggestions"""

        summary = await self._call_ollama(synthesizer, synthesis_prompt,
                                           system="You are a consensus builder. Synthesize multiple agent findings into clear, actionable intelligence.")
        parsed = self._clean_json_response(summary)

        if isinstance(parsed, dict):
            return {
                "summary": str(parsed.get("summary", "")),
                "threat_level": parsed.get("threat_level", "medium"),
                "question_answer": str(parsed.get("question_answer", "")),
                "options": parsed.get("options", []),
                "simulation": parsed.get("simulation", {}),
                "chosen_option": parsed.get("chosen_option"),
                "rationale": parsed.get("rationale"),
                "intelligence_gaps": parsed.get("intelligence_gaps", []),
                "priority_actions": parsed.get("priority_actions", []),
                "overall_confidence": parsed.get("overall_confidence", 60),
                "contributor_count": len(results),
                "synthesized_by": synthesizer.name,
            }

        return {
            "summary": summary,
            "contributor_count": len(results),
            "synthesized_by": synthesizer.name,
            "threat_level": "medium",
            "question_answer": "",
            "options": [],
            "simulation": {},
            "intelligence_gaps": [],
            "priority_actions": [],
            "overall_confidence": 60,
        }

    async def _build_preview_consensus(self, results: Dict[str, Any], raw_data: Any, question: str) -> Dict[str, Any]:
        if not results:
            return {
                "case_label": "Investigation Preview",
                "objective": question or "Review the uploaded investigation intake",
                "structure_overview": "No preview findings were generated.",
                "top_level_keys": self._top_level_keys(raw_data),
                "entities": [],
                "relationships": [],
                "timeline": [],
                "hypotheses": [],
                "assumptions": [],
                "gaps": [],
                "recommended_agents": list_preview_profiles(),
                "simulation_focus": "",
                "continue_prompt": "Edit the intake and rebuild the preview.",
                "ready_to_continue": False,
            }

        all_findings = []
        for result in results.values():
            all_findings.append(f"[{result['role']} - {result['name']}]: {result['result'][:700]}")

        combined = "\n\n".join(all_findings)
        synthesizer = next(
            (agent for agent in self.agents.values() if agent.role == AgentRole.ORCHESTRATOR),
            list(self.agents.values())[0],
        )

        preview_prompt = f"""Build a structured investigation intake preview from these specialist notes.
User question: {question or "No explicit question provided"}
Top level JSON keys: {", ".join(self._top_level_keys(raw_data)) or "unknown"}

SPECIALIST NOTES:
{combined}

Return ONLY valid JSON using this schema:
{{
  "case_label": "string",
  "objective": "string",
  "structure_overview": "string",
  "top_level_keys": ["string"],
  "entities": [{{"name": "string", "type": "string", "reason": "string"}}],
  "relationships": ["string"],
  "timeline": ["string"],
  "hypotheses": ["string"],
  "assumptions": ["string"],
  "gaps": ["string"],
  "recommended_agents": ["Exact profile name"],
  "simulation_focus": "string",
  "continue_prompt": "string",
  "ready_to_continue": true
}}
Rules:
- recommended_agents must use exact known profile names when possible
- no markdown
- keep every claim tied to the available intake"""

        summary = await self._call_ollama(
            synthesizer,
            preview_prompt,
            system="You produce structured investigation previews before a case simulation starts.",
        )
        parsed = self._clean_json_response(summary)
        default_agents = list_default_investigation_profiles()

        if isinstance(parsed, dict):
            return {
                "case_label": str(parsed.get("case_label", "Investigation Preview")),
                "objective": str(parsed.get("objective", question or "Review the investigation intake")),
                "structure_overview": str(parsed.get("structure_overview", "")),
                "top_level_keys": parsed.get("top_level_keys", self._top_level_keys(raw_data)) or self._top_level_keys(raw_data),
                "entities": parsed.get("entities", []) if isinstance(parsed.get("entities"), list) else [],
                "relationships": parsed.get("relationships", []) if isinstance(parsed.get("relationships"), list) else [],
                "timeline": parsed.get("timeline", []) if isinstance(parsed.get("timeline"), list) else [],
                "hypotheses": parsed.get("hypotheses", []) if isinstance(parsed.get("hypotheses"), list) else [],
                "assumptions": parsed.get("assumptions", []) if isinstance(parsed.get("assumptions"), list) else [],
                "gaps": parsed.get("gaps", []) if isinstance(parsed.get("gaps"), list) else [],
                "recommended_agents": self._normalize_recommended_agents(parsed.get("recommended_agents", [])) or default_agents,
                "simulation_focus": str(parsed.get("simulation_focus", "")),
                "continue_prompt": str(parsed.get("continue_prompt", "Continue when the structure matches your intent.")),
                "ready_to_continue": bool(parsed.get("ready_to_continue", True)),
            }

        return {
            "case_label": "Investigation Preview",
            "objective": question or "Review the investigation intake",
            "structure_overview": summary,
            "top_level_keys": self._top_level_keys(raw_data),
            "entities": [],
            "relationships": [],
            "timeline": [],
            "hypotheses": [],
            "assumptions": [],
            "gaps": [],
            "recommended_agents": default_agents,
            "simulation_focus": "",
            "continue_prompt": "Continue when the intake structure matches the intended case.",
            "ready_to_continue": True,
        }
