"""
Mipler Workflow Engine - n8n-style automation execution
Supports: parallel execution, conditional branching, loops, data flow between nodes
"""
import asyncio
import json
import time
import uuid
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Set
from dataclasses import dataclass, field


class NodeStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    ERROR = "error"
    SKIPPED = "skipped"
    WAITING = "waiting"


class NodeType(str, Enum):
    TRIGGER = "trigger"
    IMPORT = "import"
    HTTP_REQUEST = "http-request"
    CODE_EXEC = "code-exec"
    TRANSFORM = "transform"
    CONDITION = "condition"
    LOOP = "loop"
    MERGE = "merge"
    AGENT = "agent"
    SWARM = "swarm"
    REPORT = "report"
    ANSWER = "answer"
    OSINT_WHOIS = "osint-whois"
    OSINT_DNS = "osint-dns"
    OSINT_SUBDOMAIN = "osint-subdomain"
    OSINT_IP = "osint-ip"
    OSINT_EMAIL = "osint-email"
    OSINT_PORTSCAN = "osint-portscan"
    DELAY = "delay"
    WEBHOOK = "webhook"


@dataclass
class NodeData:
    id: str
    node_type: NodeType
    name: str
    config: Dict[str, Any] = field(default_factory=dict)
    position: Dict[str, float] = field(default_factory=lambda: {"x": 0, "y": 0})
    status: NodeStatus = NodeStatus.PENDING
    input_data: Any = None
    output_data: Any = None
    error: Optional[str] = None
    started_at: Optional[float] = None
    finished_at: Optional[float] = None
    execution_time: Optional[float] = None


@dataclass
class EdgeData:
    id: str
    source_id: str
    target_id: str
    source_handle: str = "output"
    target_handle: str = "input"
    condition: Optional[str] = None  # For conditional branching


@dataclass
class WorkflowExecution:
    id: str
    workflow_id: str
    status: NodeStatus = NodeStatus.PENDING
    nodes: Dict[str, NodeData] = field(default_factory=dict)
    edges: List[EdgeData] = field(default_factory=list)
    started_at: Optional[float] = None
    finished_at: Optional[float] = None
    context: Dict[str, Any] = field(default_factory=dict)
    logs: List[Dict[str, Any]] = field(default_factory=list)


class ExecutionEngine:
    """Core workflow execution engine with parallel node processing"""

    def __init__(self):
        self.executions: Dict[str, WorkflowExecution] = {}
        self.node_handlers: Dict[NodeType, Callable] = {}
        self._running: Dict[str, bool] = {}
        self._callbacks: List[Callable] = []
        self._swarm_coordinators: Dict[str, Any] = {}

    def register_handler(self, node_type: NodeType, handler: Callable):
        self.node_handlers[node_type] = handler

    def register_callback(self, cb: Callable):
        self._callbacks.append(cb)

    async def _notify(self, event: Dict[str, Any]):
        for cb in self._callbacks:
            try:
                if asyncio.iscoroutinefunction(cb):
                    await cb(event)
                else:
                    cb(event)
            except Exception:
                pass

    def _log(self, execution: WorkflowExecution, level: str, message: str, node_id: str = None):
        entry = {
            "timestamp": time.time(),
            "level": level,
            "message": message,
            "node_id": node_id,
        }
        execution.logs.append(entry)

    def _serialize_output(self, value: Any) -> Any:
        if value is None:
            return None
        if isinstance(value, (str, int, float, bool)):
            return value
        try:
            return json.loads(json.dumps(value, default=str))
        except Exception:
            return str(value)[:2000]

    def build_execution(self, workflow_id: str, nodes: List[Dict], edges: List[Dict]) -> WorkflowExecution:
        """Build a workflow execution from node/edge definitions"""
        exec_id = f"exec-{uuid.uuid4().hex[:12]}"
        execution = WorkflowExecution(id=exec_id, workflow_id=workflow_id)

        for n in nodes:
            raw_type = n.get("type", "import")
            try:
                node_type = NodeType(raw_type)
            except ValueError:
                node_type = NodeType.IMPORT

            node = NodeData(
                id=n["id"],
                node_type=node_type,
                name=n.get("name", n["id"]),
                config=n.get("config", {}),
                position=n.get("position", {"x": 0, "y": 0}),
            )
            execution.nodes[n["id"]] = node

        for e in edges:
            edge = EdgeData(
                id=e.get("id", f"edge-{uuid.uuid4().hex[:8]}"),
                source_id=e["source"],
                target_id=e["target"],
                source_handle=e.get("sourceHandle", "output"),
                target_handle=e.get("targetHandle", "input"),
                condition=e.get("condition"),
            )
            execution.edges.append(edge)

        self.executions[exec_id] = execution
        return execution

    def _get_downstream(self, execution: WorkflowExecution, node_id: str, handle: str = None) -> List[NodeData]:
        """Get all downstream nodes connected to a given node"""
        targets = []
        for edge in execution.edges:
            if edge.source_id == node_id:
                if handle is None or edge.source_handle == handle:
                    if edge.target_id in execution.nodes:
                        targets.append(execution.nodes[edge.target_id])
        return targets

    def _get_upstream(self, execution: WorkflowExecution, node_id: str) -> List[NodeData]:
        """Get all upstream nodes connected to a given node"""
        sources = []
        for edge in execution.edges:
            if edge.target_id == node_id:
                if edge.source_id in execution.nodes:
                    sources.append(execution.nodes[edge.source_id])
        return sources

    def _collect_inputs(self, execution: WorkflowExecution, node: NodeData) -> Any:
        """Collect and merge inputs from all upstream nodes"""
        upstream = self._get_upstream(execution, node.id)
        if not upstream:
            return node.config.get("data", None)

        inputs = []
        for src in upstream:
            if src.output_data is not None:
                inputs.append(src.output_data)

        if len(inputs) == 0:
            return node.config.get("data", None)
        elif len(inputs) == 1:
            return inputs[0]
        else:
            return inputs

    def _topological_sort(self, execution: WorkflowExecution) -> List[List[str]]:
        """Returns batches of node IDs that can execute in parallel"""
        adj: Dict[str, List[str]] = {}
        in_deg: Dict[str, int] = {}
        for nid in execution.nodes:
            adj[nid] = []
            in_deg[nid] = 0
        for e in execution.edges:
            if e.source_id in adj and e.target_id in in_deg:
                adj[e.source_id].append(e.target_id)
                in_deg[e.target_id] = in_deg.get(e.target_id, 0) + 1

        batches = []
        remaining = set(in_deg.keys())

        while remaining:
            batch = [nid for nid in remaining if in_deg.get(nid, 0) == 0]
            if not batch:
                break
            batches.append(batch)
            for nid in batch:
                remaining.discard(nid)
                for next_id in adj.get(nid, []):
                    in_deg[next_id] = in_deg.get(next_id, 0) - 1

        return batches

    async def _execute_node(self, execution: WorkflowExecution, node: NodeData):
        """Execute a single node"""
        node.status = NodeStatus.RUNNING
        node.started_at = time.time()
        node.input_data = self._collect_inputs(execution, node)

        self._log(execution, "info", f"Executing node: {node.name}", node.id)
        await self._notify({
            "type": "node_status",
            "execution_id": execution.id,
            "node_id": node.id,
            "status": "running",
            "name": node.name,
        })

        handler = self.node_handlers.get(node.node_type)
        if not handler:
            node.status = NodeStatus.ERROR
            node.error = f"No handler registered for node type: {node.node_type}"
            self._log(execution, "error", node.error, node.id)
        else:
            try:
                result = await handler(node, execution.context)
                node.output_data = result
                node.status = NodeStatus.SUCCESS
                execution.context[f"node_{node.id}"] = result
            except Exception as e:
                node.status = NodeStatus.ERROR
                node.error = str(e)
                self._log(execution, "error", f"Node {node.name} failed: {e}", node.id)

        node.finished_at = time.time()
        node.execution_time = node.finished_at - node.started_at

        await self._notify({
            "type": "node_status",
            "execution_id": execution.id,
            "node_id": node.id,
            "status": node.status.value,
            "name": node.name,
            "output": self._serialize_output(node.output_data),
            "error": node.error,
            "execution_time": node.execution_time,
        })

    async def _handle_condition_node(self, execution: WorkflowExecution, node: NodeData) -> Set[str]:
        """Handle condition node - evaluate and return which downstream branches to execute"""
        condition_expr = node.config.get("condition", "true")
        input_data = node.input_data

        try:
            result = bool(eval(condition_expr, {"__builtins__": {}}, {"data": input_data, "input": input_data}))
        except Exception:
            result = False

        node.output_data = {"condition_result": result, "data": input_data}

        active_handles = set()
        if result:
            active_handles.add("true")
        else:
            active_handles.add("false")

        return active_handles

    async def _handle_loop_node(self, execution: WorkflowExecution, node: NodeData, completed_nodes: Set[str]) -> List[str]:
        """Handle loop node - iterate over items and execute body for each"""
        items = node.input_data if isinstance(node.input_data, list) else [node.input_data]
        max_iterations = node.config.get("max_iterations", 10)
        items = items[:max_iterations]

        results = []
        for i, item in enumerate(items):
            execution.context[f"loop_{node.id}_index"] = i
            execution.context[f"loop_{node.id}_item"] = item

            downstream = self._get_downstream(execution, node.id, "body")
            for dn in downstream:
                if dn.id not in completed_nodes:
                    dn.input_data = item
                    await self._execute_node(execution, dn)
                    if dn.output_data is not None:
                        results.append(dn.output_data)
                    completed_nodes.add(dn.id)

        node.output_data = results
        return [dn.id for dn in self._get_downstream(execution, node.id, "done")]

    async def execute(self, execution_id: str) -> WorkflowExecution:
        """Execute a complete workflow"""
        execution = self.executions.get(execution_id)
        if not execution:
            raise ValueError(f"Execution {execution_id} not found")

        execution.status = NodeStatus.RUNNING
        execution.started_at = time.time()
        self._running[execution_id] = True

        self._log(execution, "info", f"Starting workflow execution: {execution_id}")
        await self._notify({
            "type": "execution_start",
            "execution_id": execution_id,
            "workflow_id": execution.workflow_id,
        })

        try:
            batches = self._topological_sort(execution)
            completed: Set[str] = set()
            stopped = False

            for batch in batches:
                if not self._running.get(execution_id):
                    stopped = True
                    break

                # Filter to nodes ready to execute
                ready = []
                for nid in batch:
                    node = execution.nodes[nid]
                    if node.status in (NodeStatus.PENDING, NodeStatus.WAITING):
                        # Check if conditionally blocked
                        upstream_nodes = self._get_upstream(execution, nid)
                        all_upstream_done = all(
                            u.id in completed or u.status == NodeStatus.SKIPPED
                            for u in upstream_nodes
                        )
                        if all_upstream_done:
                            ready.append(node)

                if not ready:
                    continue

                # Execute ready nodes in parallel
                tasks = [self._execute_node(execution, node) for node in ready]
                await asyncio.gather(*tasks, return_exceptions=True)

                for node in ready:
                    completed.add(node.id)

                    # Handle condition branching
                    if node.node_type == NodeType.CONDITION and node.status == NodeStatus.SUCCESS:
                        active_handles = await self._handle_condition_node(execution, node)
                        # Skip inactive branches
                        for edge in execution.edges:
                            if edge.source_id == node.id:
                                if edge.source_handle not in active_handles:
                                    target = execution.nodes.get(edge.target_id)
                                    if target:
                                        target.status = NodeStatus.SKIPPED
                                        self._log(execution, "info", f"Skipped (inactive branch): {target.name}", target.id)

                    # Propagate errors - skip downstream on error
                    if node.status == NodeStatus.ERROR:
                        for edge in execution.edges:
                            if edge.source_id == node.id:
                                target = execution.nodes.get(edge.target_id)
                                if target and target.status == NodeStatus.PENDING:
                                    target.status = NodeStatus.SKIPPED
                                    self._log(execution, "warning", f"Skipped (upstream error): {target.name}", target.id)

            if stopped:
                execution.status = NodeStatus.SKIPPED
            else:
                execution.status = NodeStatus.SUCCESS
                for node in execution.nodes.values():
                    if node.status == NodeStatus.ERROR:
                        execution.status = NodeStatus.ERROR
                        break

        except Exception as e:
            execution.status = NodeStatus.ERROR
            self._log(execution, "error", f"Workflow execution failed: {e}")

        execution.finished_at = time.time()
        self._running.pop(execution_id, None)

        await self._notify({
            "type": "execution_complete",
            "execution_id": execution_id,
            "status": execution.status.value,
            "duration": execution.finished_at - execution.started_at,
        })

        return execution

    async def stop(self, execution_id: str):
        self._running[execution_id] = False
        execution = self.executions.get(execution_id)
        if execution:
            if execution.status == NodeStatus.RUNNING:
                execution.status = NodeStatus.SKIPPED
            self._log(execution, "warning", "Execution stopped by user")

    def get_execution_status(self, execution_id: str) -> Optional[Dict]:
        execution = self.executions.get(execution_id)
        if not execution:
            return None
        return {
            "id": execution.id,
            "workflow_id": execution.workflow_id,
            "status": execution.status.value,
            "started_at": execution.started_at,
            "finished_at": execution.finished_at,
            "nodes": {
                nid: {
                    "id": n.id,
                    "name": n.name,
                    "type": n.node_type.value,
                    "status": n.status.value,
                    "error": n.error,
                    "execution_time": n.execution_time,
                    "has_output": n.output_data is not None,
                    "output": self._serialize_output(n.output_data),
                }
                for nid, n in execution.nodes.items()
            },
            "logs": execution.logs[-50:],
        }
