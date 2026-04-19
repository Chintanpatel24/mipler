"""
Node Handlers - Bridge between workflow engine and tools/agents
Each node type has a handler that processes inputs and produces outputs
"""
import asyncio
import json
import re
import time
import uuid
import httpx
from typing import Any, Dict, List, Optional

from .workflow_engine import NodeData, NodeType, NodeStatus
from ..tools.osint_tools import run_osint_tool, TOOLS as OSINT_TOOLS
from ..agents.swarm_coordinator import SwarmCoordinator, AgentRole


class NodeHandlers:
    """All workflow node handlers"""

    def __init__(self, swarm: SwarmCoordinator):
        self.swarm = swarm

    async def _web_search_snippets(self, query: str, max_results: int = 5) -> List[Dict[str, str]]:
        """Permission-gated lightweight web search using DuckDuckGo HTML results."""
        if not query.strip():
            return []

        url = "https://duckduckgo.com/html/"
        try:
            async with httpx.AsyncClient(timeout=12, follow_redirects=True) as client:
                resp = await client.post(url, data={"q": query[:200]})
            html = resp.text

            # Extract basic title/url pairs from result links.
            matches = re.findall(r'<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', html)
            results = []
            for href, raw_title in matches[:max_results]:
                title = re.sub(r"<[^>]+>", "", raw_title).strip()
                results.append({"title": title, "url": href})
            return results
        except Exception:
            return []

    async def handle_import(self, node: NodeData, context: Dict) -> Any:
        """Import data node - passes through config data or input"""
        data = node.config.get("data", node.input_data)
        files = node.config.get("files", [])
        text = node.config.get("text", "")

        result = {
            "data": data,
            "files": files,
            "text": text,
            "combined": data or text or "",
        }

        if files:
            file_contents = []
            for f in files:
                file_contents.append({
                    "name": f.get("name", "unknown"),
                    "type": f.get("type", "unknown"),
                    "data": f.get("data", ""),
                })
            result["file_contents"] = file_contents

        return result

    async def handle_http_request(self, node: NodeData, context: Dict) -> Any:
        """HTTP request node - make API calls"""
        url = node.config.get("url", "")
        method = node.config.get("method", "GET").upper()
        headers = node.config.get("headers", {})
        body = node.config.get("body", "")
        timeout = node.config.get("timeout", 30)

        # Interpolate input data into URL/body
        if node.input_data:
            input_str = json.dumps(node.input_data, default=str) if not isinstance(node.input_data, str) else node.input_data
            url = url.replace("{{input}}", input_str)
            if isinstance(body, str):
                body = body.replace("{{input}}", input_str)

        if not url:
            raise ValueError("HTTP Request node requires a URL")

        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            if method == "GET":
                resp = await client.get(url, headers=headers)
            elif method == "POST":
                content_type = headers.get("content-type", "application/json")
                if "json" in content_type and body:
                    resp = await client.post(url, headers=headers, json=json.loads(body) if isinstance(body, str) else body)
                else:
                    resp = await client.post(url, headers=headers, content=body)
            elif method == "PUT":
                resp = await client.put(url, headers=headers, content=body)
            elif method == "DELETE":
                resp = await client.delete(url, headers=headers)
            else:
                resp = await client.request(method, url, headers=headers, content=body)

        result_body = resp.text
        try:
            result_body = resp.json()
        except Exception:
            pass

        return {
            "status_code": resp.status_code,
            "headers": dict(resp.headers),
            "body": result_body,
            "url": str(resp.url),
        }

    async def handle_code_exec(self, node: NodeData, context: Dict) -> Any:
        """Code execution node - run Python code safely"""
        code = node.config.get("code", "")
        if not code:
            raise ValueError("Code Execution node requires code")

        # Create sandboxed execution environment
        sandbox_globals = {
            "__builtins__": {
                "len": len, "str": str, "int": int, "float": float,
                "list": list, "dict": dict, "tuple": tuple, "set": set,
                "bool": bool, "abs": abs, "min": min, "max": max,
                "sum": sum, "sorted": sorted, "reversed": reversed,
                "enumerate": enumerate, "zip": zip, "map": map, "filter": filter,
                "isinstance": isinstance, "type": type, "range": range,
                "print": print, "json": json, "round": round,
                "hasattr": hasattr, "getattr": getattr, "setattr": setattr,
                "any": any, "all": all, "ord": ord, "chr": chr,
                "hex": hex, "oct": oct, "bin": bin,
            },
            "input": node.input_data,
            "data": node.input_data,
            "context": context,
            "result": None,
        }

        loop = asyncio.get_event_loop()
        try:
            await loop.run_in_executor(
                None,
                lambda: exec(code, sandbox_globals)
            )
            return sandbox_globals.get("result", sandbox_globals.get("output", "Code executed"))
        except Exception as e:
            raise RuntimeError(f"Code execution error: {e}")

    async def handle_transform(self, node: NodeData, context: Dict) -> Any:
        """Transform node - modify/reshape data"""
        transform_type = node.config.get("transform", "passthrough")
        data = node.input_data

        if transform_type == "passthrough":
            return data

        elif transform_type == "to_string":
            return json.dumps(data, default=str, indent=2) if not isinstance(data, str) else data

        elif transform_type == "to_json":
            if isinstance(data, str):
                return json.loads(data)
            return data

        elif transform_type == "extract_field":
            field = node.config.get("field", "")
            if isinstance(data, dict):
                keys = field.split(".")
                result = data
                for k in keys:
                    if isinstance(result, dict):
                        result = result.get(k)
                    elif isinstance(result, list) and k.isdigit():
                        result = result[int(k)]
                    else:
                        return None
                return result
            return data

        elif transform_type == "filter_list":
            if isinstance(data, list):
                condition = node.config.get("condition", "")
                if condition:
                    return [item for item in data if eval(condition, {"__builtins__": {}}, {"item": item})]
            return data

        elif transform_type == "map_list":
            if isinstance(data, list):
                template = node.config.get("template", "{{item}}")
                return [template.replace("{{item}}", str(item)) for item in data]
            return data

        elif transform_type == "merge":
            if isinstance(data, list):
                merged = {}
                for item in data:
                    if isinstance(item, dict):
                        merged.update(item)
                return merged
            return data

        elif transform_type == "split":
            if isinstance(data, str):
                delimiter = node.config.get("delimiter", "\n")
                return data.split(delimiter)
            return data

        elif transform_type == "join":
            if isinstance(data, list):
                delimiter = node.config.get("delimiter", ", ")
                return delimiter.join(str(item) for item in data)
            return data

        elif transform_type == "regex_extract":
            if isinstance(data, str):
                pattern = node.config.get("pattern", r"(.+)")
                matches = re.findall(pattern, data)
                return matches
            return data

        elif transform_type == "sort":
            if isinstance(data, list):
                reverse = node.config.get("reverse", False)
                key_field = node.config.get("key_field")
                if key_field:
                    return sorted(data, key=lambda x: x.get(key_field, "") if isinstance(x, dict) else str(x), reverse=reverse)
                return sorted(data, key=str, reverse=reverse)
            return data

        return data

    async def handle_condition(self, node: NodeData, context: Dict) -> Any:
        """Condition node - evaluate expression and return true/false"""
        condition = node.config.get("condition", "True")
        data = node.input_data

        try:
            result = bool(eval(condition, {"__builtins__": {}}, {
                "data": data,
                "input": data,
                "len": len,
                "str": str,
                "int": int,
                "bool": bool,
            }))
        except Exception as e:
            result = False

        return {"condition_result": result, "data": data, "expression": condition}

    async def handle_loop(self, node: NodeData, context: Dict) -> Any:
        """Loop node - iterate over items"""
        data = node.input_data
        items = data if isinstance(data, list) else [data]
        max_iter = node.config.get("max_iterations", 100)
        items = items[:max_iter]

        return {
            "items": items,
            "count": len(items),
            "loop_body_target": node.config.get("body_target"),
        }

    async def handle_merge(self, node: NodeData, context: Dict) -> Any:
        """Merge node - combine multiple inputs"""
        if isinstance(node.input_data, list):
            merge_mode = node.config.get("mode", "concat")
            if merge_mode == "concat":
                result = []
                for item in node.input_data:
                    if isinstance(item, list):
                        result.extend(item)
                    else:
                        result.append(item)
                return result
            elif merge_mode == "deep_merge":
                result = {}
                for item in node.input_data:
                    if isinstance(item, dict):
                        result.update(item)
                    elif isinstance(item, list):
                        for sub in item:
                            if isinstance(sub, dict):
                                result.update(sub)
                return result
            elif merge_mode == "union":
                if all(isinstance(item, list) for item in node.input_data):
                    seen = set()
                    result = []
                    for item in node.input_data:
                        for sub in item:
                            key = json.dumps(sub, sort_keys=True, default=str) if not isinstance(sub, str) else sub
                            if key not in seen:
                                seen.add(key)
                                result.append(sub)
                    return result
                return node.input_data
        return node.input_data

    async def handle_agent(self, node: NodeData, context: Dict) -> Any:
        """Agent node - run an AI agent with swarm coordination"""
        agent_config = node.config.get("agent", {})
        agent_name = agent_config.get("name", f"Agent-{node.id[:6]}")
        agent_role = AgentRole(agent_config.get("role", "analyst"))
        personality = agent_config.get("personality", "You are a helpful AI assistant.")
        behavior = agent_config.get("behavior", "")
        model = agent_config.get("model", "qwen2.5:0.5b")
        ollama_url = agent_config.get("ollama_url", "http://localhost:11434")
        internet_access = bool(agent_config.get("internet_access", False) or agent_config.get("web_search_enabled", False))
        response_style = agent_config.get("response_style", "options-only")
        profile_name = agent_config.get("profile_name", "")

        agent = self.swarm.add_agent(
            name=agent_name,
            role=agent_role,
            personality=personality,
            model=model,
            ollama_url=ollama_url,
            internet_access=internet_access,
            response_style=response_style,
            behavior=behavior,
            profile_name=profile_name,
        )

        task = node.config.get("task", "Analyze the provided data.")
        graph_context = node.config.get("graph_context")

        web_context = []
        if internet_access:
            query_seed = task
            if node.input_data is not None:
                query_seed = f"{task}\n{json.dumps(node.input_data, default=str)[:300]}"
            web_context = await self._web_search_snippets(query_seed)

        if node.input_data:
            input_summary = json.dumps(node.input_data, default=str)[:2000]
            task = f"{task}\n\nInput data:\n{input_summary}"

        if graph_context:
            task = f"{task}\n\nWorkflow graph context:\n{json.dumps(graph_context, default=str)[:1800]}"

        if internet_access and web_context:
            web_block = "\n".join([f"- {item['title']} ({item['url']})" for item in web_context])
            task = f"{task}\n\nWEB CONTEXT (permission enabled):\n{web_block}"

        if response_style == "options-only":
            task = (
                f"{task}\n\n"
                "Return exactly three options: Option 1, Option 2, Option 3. "
                "Each option must include: decision, evidence, confidence score (0-100), and risk level. "
                "Do not provide open-ended suggestions."
            )

        result = await self.swarm.run_agent(agent.id, task, node.input_data)
        return {"agent": agent_name, "role": agent_role.value, "result": result}

    async def handle_swarm(self, node: NodeData, context: Dict) -> Any:
        """Swarm node - run multiple agents in coordinated swarm"""
        agents_config = node.config.get("agents", [])
        strategy = node.config.get("strategy", "pipeline")
        task = node.config.get("task", "Analyze the data collaboratively.")
        graph_context = node.config.get("graph_context")
        simulation_request = node.config.get("simulation_request", "")

        # Clear existing agents and add configured ones
        self.swarm.agents.clear()

        for ac in agents_config:
            self.swarm.add_agent(
                name=ac.get("name", "Agent"),
                role=AgentRole(ac.get("role", "analyst")),
                personality=ac.get("personality", "You are a helpful assistant."),
                model=ac.get("model", "qwen2.5:0.5b"),
                ollama_url=ac.get("ollama_url", "http://localhost:11434"),
                internet_access=bool(ac.get("internet_access", False) or ac.get("web_search_enabled", False)),
                response_style=ac.get("response_style", "options-only"),
                behavior=ac.get("behavior", ""),
                profile_name=ac.get("profile_name", ""),
            )

        if not self.swarm.agents:
            self.swarm.populate_default_agents()

        if node.input_data:
            input_summary = json.dumps(node.input_data, default=str)[:2000]
            task = f"{task}\n\nData:\n{input_summary}"

        if graph_context:
            task = f"{task}\n\nInvestigation graph:\n{json.dumps(graph_context, default=str)[:2200]}"

        if simulation_request:
            task = f"{task}\n\nSimulation request:\n{simulation_request}"

        task = (
            f"{task}\n\n"
            "All agents must output options only (Option 1/2/3 with decision, evidence, confidence, risk). "
            "Each option should reflect investigation-specific reasoning, not generic advice. "
            "No open-ended suggestions."
        )

        swarm_context = {
            "input_data": node.input_data,
            "graph_context": graph_context,
            "simulation_request": simulation_request,
        }

        result = await self.swarm.run_swarm(task, swarm_context, strategy=strategy)
        return result

    async def handle_report(self, node: NodeData, context: Dict) -> Any:
        """Report node - compile analysis into structured report"""
        data = node.input_data
        if isinstance(data, dict) and "consensus" in data:
            consensus = data.get("consensus", {}) or {}
            summary = str(consensus.get("summary", "No summary"))
            options = consensus.get("options", []) if isinstance(consensus.get("options", []), list) else []
            gaps = consensus.get("intelligence_gaps", []) if isinstance(consensus.get("intelligence_gaps", []), list) else []
            actions = consensus.get("priority_actions", []) if isinstance(consensus.get("priority_actions", []), list) else []
            overall_conf = consensus.get("overall_confidence", 70)

            findings = [
                str(r.get("result", ""))[:220]
                for r in data.get("agent_results", {}).values()
                if isinstance(r, dict)
            ]

            return {
                "summary": summary,
                "findings": findings,
                "confidence": (float(overall_conf) / 100.0) if isinstance(overall_conf, (int, float)) else 0.75,
                "sources": list(data.get("agent_results", {}).keys()),
                "threat_level": str(consensus.get("threat_level", "medium")),
                "question_answer": str(consensus.get("question_answer", "")),
                "simulation": consensus.get("simulation", {}),
                "options": options,
                "intelligence_gaps": [str(g) for g in gaps][:8],
                "priority_actions": [str(a) for a in actions][:8],
            }

        return {
            "summary": json.dumps(data, default=str)[:500] if data else "No data",
            "findings": [str(data)[:200]] if data else [],
            "confidence": 0.5,
            "sources": [],
            "threat_level": "medium",
            "question_answer": "",
            "simulation": {},
            "options": [],
            "intelligence_gaps": [],
            "priority_actions": [],
        }

    async def handle_answer(self, node: NodeData, context: Dict) -> Any:
        """Answer node - produce final answer for user"""
        data = node.input_data
        if isinstance(data, dict):
            if "result" in data:
                return {"answer": data["result"], "status": "complete", "mode": "options"}
            if "question_answer" in data and data["question_answer"]:
                return {"answer": data["question_answer"], "status": "complete", "mode": "options"}
            if "summary" in data:
                return {"answer": data["summary"], "status": "complete", "mode": "options"}
            if "consensus" in data:
                consensus = data.get("consensus", {}) or {}
                return {
                    "answer": consensus.get("question_answer") or consensus.get("summary", ""),
                    "status": "complete",
                    "mode": "options",
                }
        return {"answer": str(data)[:500] if data else "No answer", "status": "complete", "mode": "options"}

    async def handle_osint(self, node: NodeData, context: Dict) -> Any:
        """OSINT tool node - run OSINT investigation"""
        tool_name = node.config.get("tool", "whois")
        target = node.config.get("target", "")

        # If target not set, try to extract from input
        if not target and node.input_data:
            if isinstance(node.input_data, str):
                target = node.input_data
            elif isinstance(node.input_data, dict):
                target = node.input_data.get("target", node.input_data.get("domain", node.input_data.get("ip", "")))

        if not target:
            raise ValueError(f"OSINT node ({tool_name}) requires a target")

        result = await run_osint_tool(tool_name, target)
        return {
            "tool": result.tool,
            "target": result.target,
            "success": result.success,
            "data": result.data,
            "error": result.error,
        }

    async def handle_delay(self, node: NodeData, context: Dict) -> Any:
        """Delay node - wait for specified seconds"""
        seconds = node.config.get("seconds", 1)
        await asyncio.sleep(min(seconds, 60))
        return {"waited": seconds, "input": node.input_data}

    async def handle_webhook(self, node: NodeData, context: Dict) -> Any:
        """Webhook node - output for external consumption"""
        return {
            "webhook_id": node.id,
            "data": node.input_data,
            "timestamp": time.time(),
        }
