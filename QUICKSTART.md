# MIPLER Quick Start Guide

Get up and running with MIPLER in 5 minutes.

## Installation

### 1. Install Node.js
Make sure you have Node.js 16 or higher:
```bash
node --version  # Should be v16 or higher
```

### 2. Clone and Install
```bash
git clone https://github.com/mipler/mipler.git
cd mipler
pnpm install
```

### 3. Run the App (Choose One)

**Option A: Development Mode**
```bash
# Terminal 1 - Start Next.js dev server
pnpm run dev

# Terminal 2 - Start Electron app (after next dev starts)
pnpm run electron-dev
```

**Option B: Build & Run**
```bash
# Build everything
pnpm run electron-build

# Run built app from dist/
```

## Your First Investigation

### Step 1: Create an Investigation
1. Launch MIPLER
2. In the left sidebar under "Investigations"
3. Enter a name: "My First OSINT"
4. Click "New"

### Step 2: Build a Simple Workflow
1. Click on your investigation to open it
2. On the left panel, find "Nodes" section
3. Click "Input Node" to add starting point
4. From "Encoding" section, click "Base64 Encoder"
5. Click "Output Node" to see results

### Step 3: Connect the Workflow
1. Click the small circle at the bottom of Input Node
2. Drag to the top of Base64 Encoder node
3. Click the bottom of Base64 Encoder
4. Drag to the top of Output Node
5. Now you have: Input → Encode → Output

### Step 4: Test It!
1. Look at the "Encoding" tools in left sidebar
2. Click "Base64 Encoder" tool
3. Enter text: `Hello World`
4. Click "Execute"
5. See the encoded result
6. The result appears in connected Output node

### Step 5: Save
1. Click "Save" button at top
2. Or just wait - auto-saves every 10 seconds

## Common Workflows

### Extract Emails from Text
1. Add Input Node
2. Add Email Extractor tool
3. Add Output Node
4. Connect: Input → Extractor → Output
5. Paste text into executor
6. Results show extracted emails

### Hash a Password
1. Add Input Node
2. Add SHA256 Hash tool
3. Add Output Node
4. Connect all three
5. Enter password to hash
6. See the hash result

### Validate Multiple IPs
1. Add Input Node
2. Add IP Extractor (gets all IPs from text)
3. Add IP Validator (validates each)
4. Add Output Node
5. Paste text with multiple IPs
6. See which are valid IPv4/IPv6

### URL Decoding Chain
1. Add Input Node
2. Add URL Decoder
3. Add Base64 Decoder
4. Add Output Node
5. Connect: Input → Decoder 1 → Decoder 2 → Output
6. Enter encoded URL
7. Watch it decode through chain

## Using Custom Tools

### Add VirusTotal Scanner
1. Open Custom Tool Manager
2. Click "New Tool"
3. Fill in:
   - Name: `VirusTotal`
   - Description: `Scan files with VirusTotal`
   - Category: `Threat Intel`
   - API Endpoint: `https://www.virustotal.com/api/v3/files`
   - API Method: `POST`
   - Credentials: `{"api_key": "YOUR_KEY_HERE"}`
4. Click "Test Endpoint"
5. Click "Create Tool"

Now your custom tool appears in workflows!

## Tips & Tricks

### Keyboard Shortcuts
- `Delete` - Remove selected node
- `Ctrl+A` - Select all nodes
- `Ctrl+C` - Copy workflow structure (coming soon)

### Auto-Save
- Auto-saves every 10 seconds
- Manual save: Click "Save" button
- All data stored locally in `~/.mipler/`

### View Investigation Structure
- Right sidebar shows mind map of your workflow
- Expandable/collapsible nodes
- Color-coded by type (blue=input, cyan=tool, green=output)

### Copy Results
- Click "Copy" button on output node
- Result copied to clipboard
- Paste anywhere you need it

### Investigation Management
- Create multiple investigations
- Switch between them in left sidebar
- Delete old ones (can't undo!)
- Each saves independently

## Troubleshooting

### App Won't Start
```bash
# Clear everything and reinstall
rm -rf node_modules dist .next
pnpm install
pnpm run dev
```

### Tool Not Executing
- Check input is not empty
- Some tools need specific formats (email, IP, URL)
- Check error message in result
- Verify internet connection (for custom tools)

### Data Lost
- Check `~/.mipler/investigations/` for backup files
- Look for `.backup` files
- Can restore from backups manually

### Electron App Crashes
```bash
# Remove Electron cache
rm -rf ~/.electron

# Rebuild
pnpm run electron-build
```

## Next Steps

- Read full [README.md](./README.md)
- Explore all [pre-built tools](./README.md#pre-built-tools)
- Create custom tools for your workflow
- Try complex workflows with many tools
- Contribute back to project!

## Need Help?

- Check [README.md](./README.md) for detailed docs
- Review [CONTRIBUTING.md](./CONTRIBUTING.md)
- Open an issue on GitHub
- Join discussions

---

Happy investigating! 🔍
