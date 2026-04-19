"""
Mipler Backend API Server
FastAPI + WebSocket for real-time workflow execution and agent coordination
"""
import asyncio
import json
import os
import sys
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

# Add parent to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from engine.workflow_engine import ExecutionEngine, NodeType, NodeStatus
from engine.node_handlers import NodeHandlers
from agents.swarm_coordinator import SwarmCoordinator, AgentRole
from agents.profile_loader import list_agent_profiles, list_default_investigation_profiles, list_preview_profiles
from tools.osint_tools import TOOLS as OSINT_TOOLS
from assistant import AssistantStorage, AssistantService, AssistantScheduler


# ── Models ──────────────────────────────────────────────────────────────────

class NodeCreate(BaseModel):
    id: str
    type: str
    name: str
    config: Dict[str, Any] = {}
    position: Dict[str, float] = {"x": 0, "y": 0}

class EdgeCreate(BaseModel):
    id: Optional[str] = None
    source: str
    target: str
    sourceHandle: str = "output"
    targetHandle: str = "input"
    condition: Optional[str] = None

class WorkflowCreate(BaseModel):
    id: Optional[str] = None
    name: str
    nodes: List[NodeCreate]
    edges: List[EdgeCreate]

class AgentCreate(BaseModel):
    name: str
    role: str = "analyst"
    personality: str = ""
    behavior: str = ""
    profile_name: str = ""
    model: str = "qwen2.5:0.5b"
    internet_access: bool = False
    response_style: str = "options-only"

class SwarmRunRequest(BaseModel):
    task: str
    agents: List[AgentCreate] = []
    strategy: str = "parallel"
    data: Any = None
    graph_context: Any = None

class InvestigationPreviewRequest(BaseModel):
    raw_data: Any = None
    question: str = ""
    agents: List[str] = []
    graph_context: Any = None

class OSINTRequest(BaseModel):
    tool: str
    target: str
    params: Dict[str, Any] = {}


class AssistantChatRequest(BaseModel):
    user_id: str = "default-user"
    session_id: str = "default-session"
    message: str
    complexity: str = "normal"


class CaseAnalyzeRequest(BaseModel):
    user_id: str = "default-user"
    session_id: str = "case-session"
    case_text: str


class LLMSettingsRequest(BaseModel):
    provider: str
    model: str
    base_url: str = ""
    api_key: str = ""


class SkillCreateRequest(BaseModel):
    user_id: str = "default-user"
    name: str
    description: str
    prompt_template: str


class ScheduleCreateRequest(BaseModel):
    user_id: str = "default-user"
    name: str
    prompt: str
    daily_time_utc: str
    destination: str = "local"


class GatewayMessageRequest(BaseModel):
    user_id: str = "default-user"
    session_id: str = "gateway-session"
    text: str
    channel: str = "telegram"


class GatewaySecretsRequest(BaseModel):
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""
    discord_webhook_url: str = ""


# ── App Setup ───────────────────────────────────────────────────────────────

app = FastAPI(title="Mipler Automation Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Engine instances
engine = ExecutionEngine()
swarm = SwarmCoordinator()
handlers = NodeHandlers(swarm)
assistant_storage = AssistantStorage()
assistant_service = AssistantService(assistant_storage)
assistant_scheduler = AssistantScheduler(assistant_storage, assistant_service)

# Register all node handlers
HANDLER_MAP = {
    NodeType.IMPORT: handlers.handle_import,
    NodeType.HTTP_REQUEST: handlers.handle_http_request,
    NodeType.CODE_EXEC: handlers.handle_code_exec,
    NodeType.TRANSFORM: handlers.handle_transform,
    NodeType.CONDITION: handlers.handle_condition,
    NodeType.LOOP: handlers.handle_loop,
    NodeType.MERGE: handlers.handle_merge,
    NodeType.AGENT: handlers.handle_agent,
    NodeType.SWARM: handlers.handle_swarm,
    NodeType.REPORT: handlers.handle_report,
    NodeType.ANSWER: handlers.handle_answer,
    NodeType.OSINT_WHOIS: handlers.handle_osint,
    NodeType.OSINT_DNS: handlers.handle_osint,
    NodeType.OSINT_SUBDOMAIN: handlers.handle_osint,
    NodeType.OSINT_IP: handlers.handle_osint,
    NodeType.OSINT_EMAIL: handlers.handle_osint,
    NodeType.OSINT_PORTSCAN: handlers.handle_osint,
    NodeType.DELAY: handlers.handle_delay,
    NodeType.WEBHOOK: handlers.handle_webhook,
    NodeType.TRIGGER: handlers.handle_import,  # Trigger acts as import
}

# Map OSINT types to their tool names
OSINT_TOOL_MAP = {
    NodeType.OSINT_WHOIS: "whois",
    NodeType.OSINT_DNS: "dns",
    NodeType.OSINT_SUBDOMAIN: "subdomain_enum",
    NodeType.OSINT_IP: "ip_lookup",
    NodeType.OSINT_EMAIL: "email_lookup",
    NodeType.OSINT_PORTSCAN: "port_scan",
}

for nt, handler in HANDLER_MAP.items():
    engine.register_handler(nt, handler)

# Wrap OSINT handlers to inject tool name
original_osint = handlers.handle_osint
async def osint_handler_with_tool(node, context):
    tool_name = OSINT_TOOL_MAP.get(node.node_type, "whois")
    node.config["tool"] = tool_name
    return await original_osint(node, context)

for nt in OSINT_TOOL_MAP:
    engine.register_handler(nt, osint_handler_with_tool)


# ── WebSocket Connections ───────────────────────────────────────────────────

class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, message: Dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

manager = ConnectionManager()

async def engine_callback(event: Dict):
    await manager.broadcast(event)

engine.register_callback(engine_callback)
swarm.register_callback(engine_callback)


@app.on_event("startup")
async def startup_event():
    assistant_scheduler.start()


@app.on_event("shutdown")
async def shutdown_event():
    await assistant_scheduler.stop()


# ── Routes ──────────────────────────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            data = await ws.receive_text()
            msg = json.loads(data)
            msg_type = msg.get("type")

            if msg_type == "ping":
                await ws.send_json({"type": "pong"})
            elif msg_type == "get_status":
                exec_id = msg.get("execution_id")
                if exec_id:
                    status = engine.get_execution_status(exec_id)
                    await ws.send_json({"type": "status", "data": status})
    except WebSocketDisconnect:
        manager.disconnect(ws)


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "engine": "running",
        "active_executions": len(engine._running),
        "swarm_agents": len(swarm.agents),
        "assistant_db": str(assistant_storage.db_path),
    }


@app.get("/api/node-types")
async def get_node_types():
    """Return all available node types with their configurations"""
    return {
        "node_types": [
            {"type": "trigger", "name": "Trigger", "category": "flow", "config": {"trigger_type": "manual"}},
            {"type": "import", "name": "Import Data", "category": "data", "config": {"data": "", "files": [], "text": ""}},
            {"type": "http-request", "name": "HTTP Request", "category": "network", "config": {"url": "", "method": "GET", "headers": {}, "body": ""}},
            {"type": "code-exec", "name": "Code Execution", "category": "logic", "config": {"code": "# Available: input, data, context, json, result = ..."}},
            {"type": "transform", "name": "Transform", "category": "data", "config": {"transform": "passthrough", "field": "", "template": ""}},
            {"type": "condition", "name": "Condition", "category": "logic", "config": {"condition": "len(data) > 0"}},
            {"type": "loop", "name": "Loop", "category": "flow", "config": {"max_iterations": 100}},
            {"type": "merge", "name": "Merge", "category": "data", "config": {"mode": "concat"}},
            {"type": "agent", "name": "AI Agent", "category": "ai", "config": {"agent": {"name": "Agent", "role": "analyst", "personality": ""}, "task": ""}},
            {"type": "swarm", "name": "Swarm", "category": "ai", "config": {"agents": [], "strategy": "parallel", "task": ""}},
            {"type": "report", "name": "Report", "category": "output", "config": {}},
            {"type": "answer", "name": "Answer", "category": "output", "config": {}},
            {"type": "osint-whois", "name": "WHOIS", "category": "osint", "config": {"target": ""}},
            {"type": "osint-dns", "name": "DNS Lookup", "category": "osint", "config": {"target": ""}},
            {"type": "osint-subdomain", "name": "Subdomain Enum", "category": "osint", "config": {"target": ""}},
            {"type": "osint-ip", "name": "IP Lookup", "category": "osint", "config": {"target": ""}},
            {"type": "osint-email", "name": "Email Lookup", "category": "osint", "config": {"target": ""}},
            {"type": "osint-portscan", "name": "Port Scan", "category": "osint", "config": {"target": ""}},
            {"type": "delay", "name": "Delay", "category": "flow", "config": {"seconds": 1}},
            {"type": "webhook", "name": "Webhook", "category": "network", "config": {}},
        ]
    }


@app.get("/api/agents/profiles")
async def get_agent_profiles():
    """Return available markdown-backed agent profiles."""
    return {
        "profiles": list_agent_profiles(),
        "defaults": list_default_investigation_profiles(),
        "preview_defaults": list_preview_profiles(),
    }


@app.post("/api/workflow/execute")
async def execute_workflow(workflow: WorkflowCreate):
    """Execute a workflow"""
    wf_id = workflow.id or f"wf-{uuid.uuid4().hex[:12]}"

    nodes = [n.model_dump() for n in workflow.nodes]
    edges = [e.model_dump() for e in workflow.edges]

    execution = engine.build_execution(wf_id, nodes, edges)

    # Run in background
    asyncio.create_task(engine.execute(execution.id))

    return {
        "execution_id": execution.id,
        "workflow_id": wf_id,
        "status": "started",
        "node_count": len(nodes),
        "edge_count": len(edges),
    }


@app.post("/api/workflow/execute-sync")
async def execute_workflow_sync(workflow: WorkflowCreate):
    """Execute a workflow synchronously (wait for completion)"""
    wf_id = workflow.id or f"wf-{uuid.uuid4().hex[:12]}"

    nodes = [n.model_dump() for n in workflow.nodes]
    edges = [e.model_dump() for e in workflow.edges]

    execution = engine.build_execution(wf_id, nodes, edges)
    execution = await engine.execute(execution.id)

    return engine.get_execution_status(execution.id)


@app.get("/api/execution/{execution_id}")
async def get_execution(execution_id: str):
    """Get execution status"""
    status = engine.get_execution_status(execution_id)
    if not status:
        raise HTTPException(404, "Execution not found")
    return status


@app.post("/api/execution/{execution_id}/stop")
async def stop_execution(execution_id: str):
    """Stop a running execution"""
    await engine.stop(execution_id)
    return {"status": "stopped"}


@app.post("/api/swarm/run")
async def run_swarm(req: SwarmRunRequest):
    """Run swarm agents on a task"""
    swarm.agents.clear()

    if req.agents:
        for ac in req.agents:
            swarm.add_agent(
                name=ac.name,
                role=AgentRole(ac.role),
                personality=ac.personality,
                model=ac.model,
                behavior=ac.behavior,
                profile_name=ac.profile_name,
                internet_access=ac.internet_access,
                response_style=ac.response_style,
            )
    else:
        swarm.populate_default_agents()

    result = await swarm.run_swarm(
        req.task,
        {
            "input_data": req.data,
            "graph_context": req.graph_context,
        },
        strategy=req.strategy,
    )
    return result


@app.post("/api/investigation/preview")
async def preview_investigation(req: InvestigationPreviewRequest):
    """Build a structured preview before launching the full investigation."""
    swarm.agents.clear()
    swarm.populate_default_agents(
        req.agents or list_preview_profiles(),
        response_style="preview-schema",
    )
    return await swarm.preview_investigation(
        req.raw_data,
        question=req.question,
        graph_context=req.graph_context,
    )


@app.post("/api/osint/run")
async def run_osint(req: OSINTRequest):
    """Run an OSINT tool"""
    tool = OSINT_TOOLS.get(req.tool)
    if not tool:
        raise HTTPException(400, f"Unknown OSINT tool: {req.tool}. Available: {list(OSINT_TOOLS.keys())}")

    result = await tool(req.target, **req.params)
    return {
        "tool": result.tool,
        "target": result.target,
        "success": result.success,
        "data": result.data,
        "error": result.error,
    }


@app.get("/api/osint/tools")
async def list_osint_tools():
    """List available OSINT tools"""
    return {
        "tools": [
            {"name": "whois", "description": "WHOIS domain lookup"},
            {"name": "dns", "description": "DNS record lookup (A, AAAA, MX, NS, TXT, CNAME)"},
            {"name": "subdomain_enum", "description": "Subdomain enumeration via DNS brute force"},
            {"name": "ip_lookup", "description": "IP geolocation and ISP information"},
            {"name": "email_lookup", "description": "Email OSINT (domain info, social profiles)"},
            {"name": "port_scan", "description": "Port scanning (common ports)"},
            {"name": "http_probe", "description": "HTTP header and security analysis"},
            {"name": "ssl_check", "description": "SSL certificate information"},
        ]
    }


@app.post("/api/assistant/chat")
async def assistant_chat(req: AssistantChatRequest):
    return await assistant_service.chat(
        user_id=req.user_id,
        session_id=req.session_id,
        message=req.message,
        metadata={"complexity": req.complexity},
    )


@app.post("/api/assistant/case/analyze")
async def assistant_case_analyze(req: CaseAnalyzeRequest):
    return await assistant_service.analyze_case(
        user_id=req.user_id,
        session_id=req.session_id,
        case_text=req.case_text,
    )


@app.get("/api/assistant/memory/{user_id}")
async def assistant_memory(user_id: str):
    return {
        "profile": assistant_storage.get_profile_facts(user_id),
        "messages": assistant_storage.get_recent_messages(user_id, limit=40),
        "skills": assistant_storage.list_skills(user_id),
    }


@app.post("/api/assistant/skills")
async def assistant_save_skill(req: SkillCreateRequest):
    assistant_storage.save_skill(req.user_id, req.name, req.description, req.prompt_template)
    return {"status": "ok"}


@app.get("/api/assistant/llm-settings")
async def assistant_get_llm_settings():
    settings = assistant_storage.get_llm_settings()
    return {
        "provider": settings["provider"],
        "model": settings["model"],
        "base_url": settings["base_url"],
        "has_api_key": bool(settings.get("api_key")),
    }


@app.post("/api/assistant/llm-settings")
async def assistant_set_llm_settings(req: LLMSettingsRequest):
    normalized_provider = req.provider.strip().lower()
    if normalized_provider not in {"ollama", "openai", "anthropic", "openrouter"}:
        raise HTTPException(400, "Unsupported provider")

    updated = assistant_storage.set_llm_settings(
        provider=normalized_provider,
        model=req.model.strip() or "qwen2.5:0.5b",
        base_url=req.base_url.strip(),
        api_key=req.api_key.strip(),
    )
    return {
        "provider": updated["provider"],
        "model": updated["model"],
        "base_url": updated["base_url"],
        "has_api_key": bool(updated.get("api_key")),
    }


@app.post("/api/assistant/schedules")
async def assistant_create_schedule(req: ScheduleCreateRequest):
    if len(req.daily_time_utc.split(":")) != 2:
        raise HTTPException(400, "daily_time_utc must be HH:MM")

    schedule = assistant_storage.add_schedule(
        user_id=req.user_id,
        name=req.name,
        prompt=req.prompt,
        daily_time_utc=req.daily_time_utc,
        destination=req.destination,
    )
    await assistant_scheduler.run_once()
    return schedule


@app.get("/api/assistant/schedules/{user_id}")
async def assistant_list_schedules(user_id: str):
    return {
        "schedules": assistant_storage.list_schedules(user_id),
        "reports": assistant_storage.list_reports(user_id),
    }


@app.post("/api/gateway/secrets")
async def gateway_set_secrets(req: GatewaySecretsRequest):
    if req.telegram_bot_token:
        assistant_storage.set_gateway_secret("telegram_bot_token", req.telegram_bot_token)
    if req.telegram_chat_id:
        assistant_storage.set_gateway_secret("telegram_chat_id", req.telegram_chat_id)
    if req.discord_webhook_url:
        assistant_storage.set_gateway_secret("discord_webhook_url", req.discord_webhook_url)
    return {"status": "ok"}


@app.post("/api/gateway/telegram/message")
async def gateway_telegram_message(req: GatewayMessageRequest):
    result = await assistant_service.chat(
        user_id=req.user_id,
        session_id=req.session_id,
        message=req.text,
        metadata={"complexity": "normal", "gateway": "telegram"},
    )

    token = assistant_storage.get_gateway_secret("telegram_bot_token")
    chat_id = assistant_storage.get_gateway_secret("telegram_chat_id")
    if token and chat_id:
        import httpx

        async with httpx.AsyncClient(timeout=30) as client:
            await client.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                json={"chat_id": chat_id, "text": result.get("reply", "")[:3900]},
            )

    return result


@app.post("/api/gateway/discord/message")
async def gateway_discord_message(req: GatewayMessageRequest):
    result = await assistant_service.chat(
        user_id=req.user_id,
        session_id=req.session_id,
        message=req.text,
        metadata={"complexity": "normal", "gateway": "discord"},
    )

    webhook_url = assistant_storage.get_gateway_secret("discord_webhook_url")
    if webhook_url:
        import httpx

        async with httpx.AsyncClient(timeout=30) as client:
            await client.post(webhook_url, json={"content": result.get("reply", "")[:1900]})

    return result


@app.post("/api/system/factory-reset")
async def factory_reset():
    await assistant_scheduler.stop()
    assistant_storage.reset_all()
    assistant_scheduler.start()
    return {"status": "reset", "message": "Local assistant memory, skills, schedules, and secrets were cleared."}


# ── Static Files (serve frontend) ──────────────────────────────────────────

DIST_DIR = Path(__file__).parent.parent.parent / "dist"

if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = DIST_DIR / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(DIST_DIR / "index.html"))


# ── Main ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8765, log_level="info")
