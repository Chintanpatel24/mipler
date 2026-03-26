# Mipler — Investigation Wall for OSINT Research

![License: MIT](https://img.shields.io/badge/License-MIT-gray.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-gray.svg)
![React](https://img.shields.io/badge/React-18-gray.svg)

**Mipler** is an open-source, privacy-first investigation wall application designed for OSINT (Open Source Intelligence) research. Think of it as a digital cork board — place paper-like cards, attach evidence, draw rope-style connections between findings, and keep everything saved locally on your machine.

<p align="center">
  <em>All data stays on your computer. No accounts. No cloud. No tracking.</em>
</p>

---

## ✨ Features

### 🖼 Investigation Wall
- **Infinite canvas** — zoom, pan, and scroll across a large dark workspace
- **Paper-style cards** — drag-and-drop cards with a realistic paper texture
- **Rope connectors** — draw dashed-line connections between any two cards, mimicking strings on an evidence board
- **Snap-to-grid** — optional alignment for tidy layouts

### 📝 Card Types
| Card | Description |
|------|-------------|
| **Note** | Free-form text card (Markdown supported) |
| **Image** | Upload and annotate images |
| **PDF** | Embed and view PDF documents |
| **WHOIS Lookup** | Query domain registration info via RDAP (no API key) |
| **DNS Lookup** | Query DNS records via Cloudflare DoH (no API key) |
| **Reverse Image Search** | Embedded Google Images, TinEye, or Yandex |
| **OSINT Framework** | Quick access to osintframework.com |
| **Custom URL** | Load any URL in a sandboxed iframe |

### 💾 Persistence
- **Auto-save** to browser localStorage (safety net)
- **File System Access API** for saving/loading to a user-chosen folder (Chrome/Edge)
- **JSON download/upload** fallback for all browsers
- **Local server mode** with filesystem persistence (Node.js/Express)

### 📦 Import / Export
- **Export as ZIP**: includes `workspace.json`, `notes/` (Markdown), `assets/` (images, PDFs)
- **Import ZIP**: restore an entire investigation from a previously exported archive
- **JSON export/import**: lightweight workspace-only format
