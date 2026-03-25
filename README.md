# 🔮 NEXUS — Local AI Agent Platform

A fully local, web-based multi-agent AI platform.  
**No Docker. No Ollama required. Runs with `npm start`.**

Built from the best of:
- **SWIK** — Agent architecture, WebSocket, SQLite (MIT)
- **MiroFish** — Strength-multiplication orchestration model (MIT)  
- **Pixel-Agents** — UI aesthetic inspiration (MIT)

---

## 🚀 Quick Start

### 1. Install Node dependencies
```bash
npm install
```

### 2. (Optional) Install Python dependencies
Python enables more powerful agent orchestration and custom Python agents:
```bash
pip install -r agents/requirements.txt
```

### 3. Start NEXUS
```bash
npm start          # Starts backend + Python server + frontend dev server
# OR
npm run start:no-python   # Without Python (JS-only orchestration)
```

### 4. Open your browser
```
http://localhost:5173
```

---

## 🔑 Free API Keys (No Credit Card)

| Provider    | Free Tier              | Get Key |
|-------------|------------------------|---------|
| **Groq**    | 🔥 14,400 req/day FREE | [console.groq.com](https://console.groq.com) |
| **OpenRouter** | Many free models   | [openrouter.ai/keys](https://openrouter.ai/keys) |
| **Ollama**  | Fully local, free      | [ollama.ai](https://ollama.ai) |
| **LM Studio** | Local GUI, free      | [lmstudio.ai](https://lmstudio.ai) |

---

## ⬡ Creating Agents

1. Click **+ New Agent** or the `+` button in the sidebar
2. Set name, role, avatar and color
3. Set **Strength** (1–5) — strength multiplies across the network (MiroFish model)
4. Choose provider and enter API key
5. Write a system prompt or click a role preset
6. Save!

### Strength Multiplication (MiroFish Model)
When agents collaborate on a task, their strengths multiply:
- Boss (3x) + Developer (2x) + Researcher (2x) = **12x** combined strength
- This means the synthesised output should be dramatically better than any single agent

---

## 🐍 Python Agents

Create custom Python agent scripts in the **Python** tab:

1. Write your agent using the template
2. Save with a `.py` filename  
3. The agent auto-loads and can be used in tasks

Example `my_agent.py`:
```python
AGENT_META = {
    "name": "My Agent",
    "role": "researcher",
    "description": "Does my custom thing",
    "skills": ["research"],
}

from core.llm_client import LLMClient

def run(message, agent, history=None):
    client = LLMClient.from_agent(agent)
    return client.chat([
        {"role": "system", "content": "You are helpful."},
        {"role": "user", "content": message},
    ])
```

---

## 📁 Project Structure

```
nexus/
├── backend/
│   ├── server.js      # Express + WebSocket + SQLite
│   └── db.js          # Database layer
├── frontend/
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── AgentsView.jsx    # Agent grid
│       │   ├── AgentModal.jsx    # Create/edit agent
│       │   ├── ChatView.jsx      # Direct agent chat
│       │   ├── TasksView.jsx     # Multi-agent tasks
│       │   └── PythonView.jsx    # Python agent editor
│       ├── hooks/
│       │   └── useNexus.js       # WebSocket + state
│       └── styles/
├── agents/
│   ├── runner.py      # Python FastAPI server (port 8765)
│   ├── core/
│   │   ├── llm_client.py    # Unified LLM client
│   │   ├── orchestrator.py  # MiroFish-style orchestration
│   │   └── tools.py         # Agent tools (web search, etc.)
│   ├── templates/       # Example agent templates
│   └── user_agents/     # YOUR custom agents go here
├── data/                # SQLite database (auto-created)
├── workspace/           # Agent file outputs
├── package.json
├── vite.config.js
└── README.md
```

---

## 🔧 Configuration

All config via environment variables (optional — sensible defaults):

```bash
PORT=3001          # Backend port
PYTHON_PORT=8765   # Python server port
```

---

## 🆓 Completely Free Stack

- **Frontend**: React + Vite (free, open source)
- **Backend**: Node.js + Express + SQLite (free, open source)
- **Python**: FastAPI + Uvicorn (free, open source)
- **LLMs**: Groq free tier, OpenRouter free models, Ollama local
- **No subscriptions, no Docker, no paid APIs required**

---

## Credits

- SWIK by Chintan Patel (MIT License)
- MiroFish by 666ghj (MIT License)
- Pixel-Agents by Sourcegraph (MIT License)
