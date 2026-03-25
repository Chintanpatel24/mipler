<div align=center>
<pre>
╔══════════════════════════════════════════════════╗
║  ███╗   ███╗██╗██████╗ ██╗     ███████╗██████╗   ║
║  ████╗ ████║██║██╔══██╗██║     ██╔════╝██╔══██╗  ║
║  ██╔████╔██║██║██████╔╝██║     █████╗  ██████╔╝  ║
║  ██║╚██╔╝██║██║██╔═══╝ ██║     ██╔══╝  ██╔══██╗  ║
║  ██║ ╚═╝ ██║██║██║     ███████╗███████╗██║  ██║  ║
║  ╚═╝     ╚═╝╚═╝╚═╝     ╚══════╝╚══════╝╚═╝  ╚═╝  ║
╚══════════════════════════════════════════════════╝
</pre>
</div>


# MIPLER - OSINT Investigation Workspace

A powerful, open-source desktop application for OSINT (Open Source Intelligence) investigations. MIPLER provides a visual, node-based workflow system similar to n8n, with 14+ pre-built OSINT tools, customizable integrations, and auto-saving investigation workspaces.

## Key Features

- **Node-Based Workflow Editor**: Drag-and-drop interface for building OSINT workflows, similar to n8n
- **14+ Pre-built OSINT Tools**: URL decoding, hashing (MD5/SHA256), email extraction, IP validation, domain extraction, Base64 encoding, JSON formatting, phone extraction, and more
- **Custom Tool Integration**: Add your own API-based tools with encrypted credential management
- **Investigation Management**: Create, organize, and manage multiple investigations with automatic saves
- **Mind Map Visualization**: Visual representation of your investigation structure and tool connections
- **Local-First Storage**: All data stored locally in JSON format (no cloud dependency)
- **Matblack Theme**: Professional, dark-themed UI optimized for security analysts
- **Desktop App**: Run locally on Windows, macOS, and Linux with Electron

## Technology Stack

- **Frontend**: Next.js 16, React 19.2, TypeScript
- **Workflow**: React Flow for node-based interfaces
- **Desktop**: Electron for cross-platform distribution
- **State Management**: Zustand
- **Storage**: JSON file-based with auto-save and backup
- **Encryption**: CryptoJS for credential encryption
- **UI**: shadcn/ui components with custom matblack theme
- **Styling**: Tailwind CSS v4

## Installation

### Prerequisites

- Node.js 16+ and npm/pnpm
- Electron (installed automatically)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Chintanpatel24/mipler.git
   cd mipler
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Run locally (development)**
   ```bash
   pnpm run dev
   ```
   This starts the Next.js dev server at `http://localhost:3000`

4. **Run Electron app (development)**
   ```bash
   pnpm run electron-dev
   ```
   This launches the Electron app pointing to the dev server

5. **Build for production**
   ```bash
   pnpm run electron-build
   ```

## Usage

### Creating an Investigation

1. Launch the app
2. Enter a name in the "Investigations" panel
3. Click "New" to create your investigation
4. You'll see the investigation appear in the list with a workflow canvas

### Building a Workflow

1. Select an investigation from the sidebar
2. In the workflow canvas:
   - **Add Input Node**: Start with input data
   - **Add Tools**: Drag tools from the left sidebar (organized by category)
   - **Add Output Node**: Capture results
3. **Connect nodes** by dragging from output handles to input handles
4. Click **Save** or let auto-save handle it (saves every 10 seconds)

### Running Tools

- **Input Node**: Stores initial data (text, URLs, emails, IPs, etc.)
- **Tool Nodes**: Click to select a tool, enter input, execute
- **Output Node**: Displays results from connected tools
- All results can be copied to clipboard

### Example Workflow

```
Input (URL)
    ↓
URL Decoder
    ↓
Base64 Decoder
    ↓
Output (Decoded Result)
```

## Pre-Built Tools

### Encoding
- **URL Decoder**: Decode URL-encoded strings
- **URL Encoder**: Encode strings as URL-safe
- **Base64 Encoder**: Convert text to Base64
- **Base64 Decoder**: Decode Base64 to text

### Hashing
- **MD5 Hash**: Generate MD5 hashes
- **SHA256 Hash**: Generate SHA256 hashes

### Email
- **Email Validator**: Validate email format
- **Email Extractor**: Extract all emails from text

### Network
- **IP Validator**: Validate IPv4/IPv6 addresses
- **IP Extractor**: Extract all IPs from text
- **Domain Extractor**: Extract domain names
- **Domain Validator**: Validate domain format

### Formatting
- **JSON Formatter**: Format and validate JSON
- **Phone Extractor**: Extract phone numbers from text

## Custom Tools

Add API-based tools with encrypted credentials:

1. Go to the Custom Tools section
2. Click **New Tool**
3. Configure:
   - **Tool Name**: Display name
   - **Description**: What the tool does
   - **Category**: Custom category
   - **API Endpoint**: Full URL to the API
   - **API Method**: GET or POST
   - **Credentials**: JSON with API keys (encrypted locally)
4. Click **Test Endpoint** to verify connectivity
5. Click **Create Tool**

### Example Custom Tool

```json
{
  "name": "VirusTotal Scanner",
  "description": "Scan files/URLs with VirusTotal",
  "category": "Threat Intelligence",
  "apiEndpoint": "https://www.virustotal.com/api/v3/files",
  "apiMethod": "POST",
  "credentials": {
    "api_key": "your-api-key-here"
  }
}
```

## Data Storage

### Location
All data is stored in your home directory:
- **Windows**: `C:\Users\{username}\.mipler\`
- **macOS**: `/Users/{username}/.mipler/`
- **Linux**: `/home/{username}/.mipler/`

### Structure
```
~/.mipler/
├── investigations/
│   ├── inv_1234567890_abc123/
│   │   └── index.json          (investigation workflow)
│   └── inv_9876543210_xyz789/
│       └── index.json
└── custom_tools/
    ├── custom_1234567890_abc.json
    └── custom_9876543890_def.json
```

### Auto-Save & Backup
- Investigations auto-save every 10 seconds
- Before each write, a backup is created (.backup files)
- No cloud sync - everything is local

## Security

### Credential Management
- Credentials are encrypted using AES encryption before storage
- Encryption key: Use environment variable or defaults to demo key
- **Important**: For production, set `NEXT_PUBLIC_MIPLER_KEY` environment variable:
  ```bash
  export NEXT_PUBLIC_MIPLER_KEY="your-secure-random-key"
  ```

### Best Practices
1. Never share your `.mipler` directory
2. Change the encryption key in production
3. Don't commit API keys to version control
4. Use strong, unique API keys for each service
5. Regularly backup your investigations

## File Formats

### Investigation JSON
```json
{
  "id": "inv_1234567890_abc123",
  "name": "Target Investigation",
  "description": "Optional description",
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T14:45:00Z",
  "nodes": [
    {
      "id": "node_123",
      "type": "input",
      "position": {"x": 100, "y": 100},
      "data": {"label": "Input Data", "value": ""}
    }
  ],
  "edges": [
    {
      "id": "edge_123",
      "source": "node_123",
      "target": "node_456"
    }
  ],
  "metadata": {}
}
```

## Development

### Project Structure
```
mipler/
├── app/
│   ├── page.tsx              (main dashboard)
│   ├── layout.tsx            (root layout)
│   └── globals.css           (matblack theme)
├── components/
│   ├── workflow-editor.tsx   (react-flow canvas)
│   ├── nodes/                (custom nodes)
│   │   ├── tool-node.tsx
│   │   ├── input-node.tsx
│   │   └── output-node.tsx
│   ├── investigation-manager.tsx
│   ├── investigation-mindmap.tsx
│   ├── tool-executor.tsx
│   └── custom-tool-manager.tsx
├── lib/
│   ├── storage.ts            (file operations)
│   ├── osint-tools.ts        (tool definitions)
│   ├── osint-engine.ts       (workflow execution)
│   ├── custom-tools.ts       (custom tool manager)
│   ├── workflow-store.ts     (zustand store)
│   └── utils.ts              (tailwind cn)
├── public/
│   ├── electron.js           (electron main process)
│   └── preload.js            (electron preload)
└── package.json
```

### Adding New Tools

Edit `lib/osint-tools.ts`:

```typescript
export const MyTool: OSINTTool = {
  id: 'my_tool',
  name: 'My Tool',
  category: 'Category',
  description: 'What it does',
  icon: 'IconName',
  execute: async (input: string) => {
    try {
      // Your logic here
      return {
        success: true,
        result: 'output',
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};
```

Then add to `OSINT_TOOLS` array at the bottom.

### Building a Custom Workflow Component

Use the provided hook:

```tsx
import { useWorkflowStore } from '@/lib/workflow-store';

export function MyComponent() {
  const { currentInvestigation, nodes, edges, addNode } = useWorkflowStore();
  // Your component logic
}
```

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Contribution Ideas
- New OSINT tools
- UI/UX improvements
- Additional workflow node types
- Tool integrations
- Documentation translations
- Bug fixes

## Building for Distribution

### macOS
```bash
pnpm run electron-build
# Creates .dmg file in dist/
```

### Windows
```bash
pnpm run electron-build
# Creates .exe installer in dist/
```

### Linux
```bash
pnpm run electron-build
# Creates AppImage and .deb in dist/
```

## Troubleshooting

### App won't start
- Check Node.js version: `node --version` (should be 16+)
- Clear node_modules: `rm -rf node_modules && pnpm install`
- Check Electron cache: `rm -rf ~/.electron`

### Investigations not saving
- Verify `.mipler` directory exists and is writable
- Check file permissions: `ls -la ~/.mipler/`
- Look for backup files with `.backup` extension

### Custom tools not working
- Verify API endpoint is accessible
- Check credentials are valid
- Review error message in tool result

### Electron won't build
- Update electron: `pnpm update electron`
- Check for platform-specific issues in electron-builder docs

## License

MIPLER is released under the MIT License. See LICENSE file for details.

## Support & Community

- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Share ideas and questions on Discussions
- **Security**: Report vulnerabilities to security@mipler.dev (responsibly)

## Roadmap

- [ ] Workflow execution engine (automatic workflow runs)
- [ ] Report generation (PDF/HTML)
- [ ] Timeline view for investigations
- [ ] Collaboration features (shared workspaces)
- [ ] Plugin system
- [ ] Database support (optional)
- [ ] Cloud sync (optional)
- [ ] Multi-language support

## Disclaimer

MIPLER is a tool for security research and authorized testing only. Users are responsible for:
- Ensuring all activities are legal and authorized
- Not using tools for unauthorized access or malicious purposes
- Complying with all applicable laws and regulations
- Obtaining necessary permissions before testing

## Authors

- **Creator**: Chintanpatel24
- **Contributors**: See CONTRIBUTORS.md

## Changelog

### v1.0.0 (Initial Release)
- Node-based workflow editor
- 14+ pre-built OSINT tools
- Custom tool integration with encrypted credentials
- Investigation management and auto-save
- Mind map visualization
- Electron desktop app
- Matblack UI theme

---

**Built with** for security researchers and OSINT enthusiasts.

Happy investigating!
