#!/usr/bin/env node

import readline from 'readline';

const API_BASE = process.env.MIPLER_API || 'http://127.0.0.1:8765';
const USER_ID = process.env.MIPLER_USER || 'default-user';

function printHelp() {
  console.log(`
Mipler Assistant CLI

Usage:
  mipler-assistant chat "your message"
  mipler-assistant case "case study text"
  mipler-assistant config --provider <ollama|openai|anthropic|openrouter> --model <model> [--base-url <url>] [--api-key <key>]
  mipler-assistant schedule --time HH:MM --prompt "daily task" [--destination local|telegram]
  mipler-assistant reset
  mipler-assistant repl
`);
}

async function api(path, init = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API ${response.status}: ${body}`);
  }
  return response.json();
}

function argValue(flag, args, fallback = '') {
  const index = args.indexOf(flag);
  if (index === -1) return fallback;
  return args[index + 1] || fallback;
}

async function runChat(message) {
  const data = await api('/api/assistant/chat', {
    method: 'POST',
    body: JSON.stringify({
      user_id: USER_ID,
      session_id: `cli-${Date.now()}`,
      message,
      complexity: 'normal',
    }),
  });
  console.log(`\n${data.reply}\n`);
  if (data.skill_generated) {
    console.log(`Generated skill: ${data.skill_generated}`);
  }
}

async function runCase(caseText) {
  const data = await api('/api/assistant/case/analyze', {
    method: 'POST',
    body: JSON.stringify({
      user_id: USER_ID,
      session_id: `case-${Date.now()}`,
      case_text: caseText,
    }),
  });

  console.log('\nScenario Summary:');
  console.log(data.scenario_summary || 'No summary');
  console.log('\nClarifying Questions:');
  for (const q of data.clarifying_questions || []) {
    console.log(`- ${q}`);
  }
}

async function runConfig(args) {
  const provider = argValue('--provider', args, 'ollama');
  const model = argValue('--model', args, 'qwen2.5:0.5b');
  const baseUrl = argValue('--base-url', args, provider === 'ollama' ? 'http://localhost:11434' : '');
  const apiKey = argValue('--api-key', args, '');

  const data = await api('/api/assistant/llm-settings', {
    method: 'POST',
    body: JSON.stringify({
      provider,
      model,
      base_url: baseUrl,
      api_key: apiKey,
    }),
  });

  console.log('\nSaved model settings:');
  console.log(JSON.stringify(data, null, 2));
}

async function runSchedule(args) {
  const time = argValue('--time', args, '08:00');
  const prompt = argValue('--prompt', args, 'Send a concise daily investigation report.');
  const destination = argValue('--destination', args, 'local');

  const data = await api('/api/assistant/schedules', {
    method: 'POST',
    body: JSON.stringify({
      user_id: USER_ID,
      name: `Daily Report ${time}`,
      prompt,
      daily_time_utc: time,
      destination,
    }),
  });

  console.log('\nCreated schedule:');
  console.log(JSON.stringify(data, null, 2));
}

async function runReset() {
  const data = await api('/api/system/factory-reset', { method: 'POST' });
  console.log(`\n${data.message}\n`);
}

async function runRepl() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'assistant> ',
  });

  console.log('\nInteractive mode. Type /exit to quit, /help for tips.\n');
  rl.prompt();

  rl.on('line', async (line) => {
    const text = line.trim();
    if (!text) {
      rl.prompt();
      return;
    }
    if (text === '/exit') {
      rl.close();
      return;
    }
    if (text === '/help') {
      console.log('Commands: /exit, /help');
      rl.prompt();
      return;
    }

    try {
      await runChat(text);
    } catch (error) {
      console.error(String(error));
    }
    rl.prompt();
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  try {
    if (command === 'chat') {
      const msg = args.slice(1).join(' ').trim();
      if (!msg) throw new Error('chat command requires a message');
      await runChat(msg);
      return;
    }

    if (command === 'case') {
      const caseText = args.slice(1).join(' ').trim();
      if (!caseText) throw new Error('case command requires case study text');
      await runCase(caseText);
      return;
    }

    if (command === 'config') {
      await runConfig(args.slice(1));
      return;
    }

    if (command === 'schedule') {
      await runSchedule(args.slice(1));
      return;
    }

    if (command === 'reset') {
      await runReset();
      return;
    }

    if (command === 'repl') {
      await runRepl();
      return;
    }

    printHelp();
  } catch (error) {
    console.error(String(error));
    process.exit(1);
  }
}

main();
