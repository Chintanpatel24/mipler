import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.MIPLER_DATA || join(__dirname, 'mipler-data');

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

app.use(express.json({ limit: '50mb' }));
app.use(express.static(join(__dirname, 'dist')));

// Save workspace
app.post('/api/workspace/save', (req, res) => {
  try {
    const { filename, data } = req.body;
    const safeName = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const filePath = join(DATA_DIR, safeName);
    writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    res.json({ success: true, path: filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Load workspace
app.get('/api/workspace/load/:filename', (req, res) => {
  try {
    const safeName = req.params.filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const filePath = join(DATA_DIR, safeName);
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    const data = readFileSync(filePath, 'utf-8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List workspaces
app.get('/api/workspace/list', (_req, res) => {
  try {
    const files = readdirSync(DATA_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const stat = statSync(join(DATA_DIR, f));
        return { name: f, modified: stat.mtime };
      })
      .sort(
        (a, b) =>
          new Date(b.modified).getTime() - new Date(a.modified).getTime()
      );
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save asset
app.post('/api/assets/save', (req, res) => {
  try {
    const assetsDir = join(DATA_DIR, 'assets');
    if (!existsSync(assetsDir)) mkdirSync(assetsDir, { recursive: true });
    const { filename, data } = req.body;
    const safeName = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const buffer = Buffer.from(data, 'base64');
    writeFileSync(join(assetsDir, safeName), buffer);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Load asset
app.get('/api/assets/:filename', (req, res) => {
  try {
    const safeName = req.params.filename.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const filePath = join(DATA_DIR, 'assets', safeName);
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.sendFile(resolve(filePath));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║                                              ║
  ║   Mipler Investigation Wall                  ║
  ║   Running at http://localhost:${PORT}            ║
  ║   Data dir: ${DATA_DIR}
  ║                                              ║
  ╚══════════════════════════════════════════════╝
  `);
});