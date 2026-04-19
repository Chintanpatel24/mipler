"""Model-provider abstraction for OpenAI/Anthropic/OpenRouter/Ollama."""

from __future__ import annotations

from typing import Any, Dict, List

import httpx


class LLMRouter:
    async def chat(self, settings: Dict[str, Any], messages: List[Dict[str, str]]) -> str:
        provider = (settings.get("provider") or "ollama").strip().lower()
        model = settings.get("model") or "qwen2.5:0.5b"
        base_url = (settings.get("base_url") or "").strip()
        api_key = (settings.get("api_key") or "").strip()

        if provider == "openai":
            return await self._openai_chat(model, api_key, messages, base_url)
        if provider == "anthropic":
            return await self._anthropic_chat(model, api_key, messages, base_url)
        if provider == "openrouter":
            return await self._openrouter_chat(model, api_key, messages, base_url)

        return await self._ollama_chat(model, messages, base_url)

    async def _ollama_chat(self, model: str, messages: List[Dict[str, str]], base_url: str) -> str:
        url = (base_url or "http://localhost:11434").rstrip("/") + "/api/chat"
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                url,
                json={
                    "model": model,
                    "messages": messages,
                    "stream": False,
                },
            )
            resp.raise_for_status()
            payload = resp.json()
        return payload.get("message", {}).get("content") or payload.get("response", "")

    async def _openai_chat(self, model: str, api_key: str, messages: List[Dict[str, str]], base_url: str) -> str:
        if not api_key:
            raise ValueError("OpenAI API key is required")
        root = (base_url or "https://api.openai.com").rstrip("/")
        url = f"{root}/v1/chat/completions"
        headers = {"Authorization": f"Bearer {api_key}"}
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                url,
                headers=headers,
                json={"model": model, "messages": messages, "temperature": 0.3},
            )
            resp.raise_for_status()
            payload = resp.json()
        choices = payload.get("choices") or []
        if not choices:
            return ""
        return choices[0].get("message", {}).get("content", "")

    async def _openrouter_chat(self, model: str, api_key: str, messages: List[Dict[str, str]], base_url: str) -> str:
        if not api_key:
            raise ValueError("OpenRouter API key is required")
        root = (base_url or "https://openrouter.ai").rstrip("/")
        url = f"{root}/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "https://mipler.local",
            "X-Title": "Mipler Assistant",
        }
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                url,
                headers=headers,
                json={"model": model, "messages": messages, "temperature": 0.3},
            )
            resp.raise_for_status()
            payload = resp.json()
        choices = payload.get("choices") or []
        if not choices:
            return ""
        return choices[0].get("message", {}).get("content", "")

    async def _anthropic_chat(self, model: str, api_key: str, messages: List[Dict[str, str]], base_url: str) -> str:
        if not api_key:
            raise ValueError("Anthropic API key is required")

        root = (base_url or "https://api.anthropic.com").rstrip("/")
        url = f"{root}/v1/messages"

        system_text = ""
        anthropic_messages: List[Dict[str, str]] = []
        for msg in messages:
            role = msg.get("role", "user")
            if role == "system":
                system_text += ("\n" + msg.get("content", "")).strip()
                continue
            mapped_role = "assistant" if role == "assistant" else "user"
            anthropic_messages.append({"role": mapped_role, "content": msg.get("content", "")})

        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }

        payload: Dict[str, Any] = {
            "model": model,
            "max_tokens": 1200,
            "messages": anthropic_messages,
        }
        if system_text:
            payload["system"] = system_text

        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()

        content_blocks = data.get("content") or []
        chunks: List[str] = []
        for block in content_blocks:
            if isinstance(block, dict) and block.get("type") == "text":
                chunks.append(block.get("text", ""))
        return "\n".join(chunks).strip()
