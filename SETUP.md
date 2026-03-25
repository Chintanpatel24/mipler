# MIPLER Setup Instructions

Complete setup guide for MIPLER - OSINT Investigation Workspace

## Prerequisites

### System Requirements
- **OS**: Windows 10+, macOS 10.13+, or Linux (Ubuntu 18.04+)
- **RAM**: 2GB minimum (4GB recommended)
- **Disk**: 500MB free space
- **Internet**: For custom tools only; core functionality is offline

### Software Requirements
- **Node.js**: v16.0.0 or higher
- **npm/pnpm**: Latest version recommended

### Check Your Setup
```bash
node --version    # Should be v16.0.0 or higher
pnpm --version    # Should be 7.0.0 or higher (if using pnpm)
npm --version     # Or npm if you prefer
```

If Node.js is not installed:
- **Windows/macOS**: Download from https://nodejs.org/
- **Linux**: `sudo apt-get install nodejs npm`

## Installation Steps

### Step 1: Get the Code

**Option A: Clone from GitHub**
```bash
git clone https://github.com/mipler/mipler.git
cd mipler
```

**Option B: Download ZIP**
1. Visit https://github.com/mipler/mipler
2. Click "Code" → "Download ZIP"
3. Extract the ZIP file
4. Open terminal in the extracted folder

### Step 2: Install Dependencies

Using pnpm (recommended):
```bash
pnpm install
```

Or using npm:
```bash
npm install
```

This will:
- Download all required packages
- Install Electron
- Set up development tools
- Configure TypeScript

**Expected Duration**: 2-5 minutes

### Step 3: Run the Application

#### Development Mode (Recommended for Testing)

**Terminal 1** - Start the development server:
```bash
pnpm run dev
```

Wait for output like:
```
▲ Next.js 16.2.0
- Local:        http://localhost:3000
```

**Terminal 2** - Start the Electron app:
```bash
pnpm run electron-dev
```

The Electron window will open after a few seconds.

#### Production Mode (Built Application)

Build everything:
```bash
pnpm run electron-build
```

Then run from the `dist/` folder:
- **Windows**: `dist/Mipler-1.0.0-setup.exe`
- **macOS**: `dist/Mipler-1.0.0.dmg`
- **Linux**: `dist/Mipler-1.0.0.AppImage`

## Verification

### Verify Installation
The app is working correctly if you see:
1. Electron window opens
2. Matblack interface with MIPLER logo
3. "Investigations" panel on the left
4. Workflow canvas in the main area
5. No errors in the terminal

### Test the Setup

1. **Create Investigation**:
   - Type "Test Investigation"
   - Click "New"
   - See it appear in the list

2. **Add a Node**:
   - Click "Input Node"
   - A node appears on the canvas

3. **Save Data**:
   - Click "Save"
   - Should see success toast

## Data Storage

### Where Files Are Stored
Data is automatically created in:
- **Windows**: `C:\Users\{username}\.mipler\`
- **macOS**: `/Users/{username}/.mipler/`
- **Linux**: `/home/{username}/.mipler/`

### What's Stored
```
.mipler/
├── investigations/
│   └── inv_12345678_abc123/
│       └── index.json
└── custom_tools/
    └── custom_12345678_abc.json
```

## Configuration

### Environment Variables (Optional)

For enhanced security, set an encryption key:

```bash
# Create .env.local file in project root
echo 'NEXT_PUBLIC_MIPLER_KEY=your-secure-random-key' > .env.local
```

### Development Config (.env.local)
```env
# Encryption key for credentials (change from default)
NEXT_PUBLIC_MIPLER_KEY=your-very-secure-random-key-here

# Optional: Disable telemetry
NEXT_TELEMETRY_DISABLED=1
```

## Common Setup Issues

### Issue: "Node command not found"

**Solution**: Node.js not installed
```bash
# Check installation
node --version

# If not found, install from https://nodejs.org/
```

### Issue: "pnpm not found"

**Solution**: Install pnpm globally
```bash
npm install -g pnpm
```

Or use npm instead:
```bash
npm install
npm run dev
```

### Issue: Port 3000 already in use

**Solution**: Kill the process or use different port
```bash
# macOS/Linux
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: Electron app won't start

**Solution**: Clear Electron cache
```bash
# Remove Electron cache
rm -rf ~/.electron/  # macOS/Linux
# or
rmdir %APPDATA%\.electron /s  # Windows

# Try again
pnpm run electron-dev
```

### Issue: "Cannot find module" errors

**Solution**: Reinstall dependencies
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Issue: Investigations not saving

**Solution**: Check folder permissions
```bash
# macOS/Linux
ls -la ~/.mipler/

# Verify write permissions
touch ~/.mipler/test.txt && rm ~/.mipler/test.txt
```

## First Steps

Once installation is complete:

1. **Read the Guides**:
   - [QUICKSTART.md](./QUICKSTART.md) - 5-minute tutorial
   - [README.md](./README.md) - Full documentation
   - [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Technical overview

2. **Try a Simple Workflow**:
   - Create an investigation
   - Add Input Node
   - Add Base64 Encoder tool
   - Add Output Node
   - Connect them
   - Execute with test data

3. **Explore Built-in Tools**:
   - Email extraction
   - IP validation
   - Domain analysis
   - Hash generation
   - And more!

4. **Create Custom Tools**:
   - Set up custom API tools
   - Store credentials securely
   - Integrate with your services

## Getting Help

### Check Documentation
- **Quick Start**: [QUICKSTART.md](./QUICKSTART.md)
- **Full Docs**: [README.md](./README.md)
- **Contributing**: [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Technical**: [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)

### Report Issues
1. Check existing issues on GitHub
2. Create detailed bug report with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Terminal error messages

### Ask Questions
- Open a GitHub Discussion
- Ask the community
- Review similar issues

## Development Setup

### IDE Setup

**Visual Studio Code** (Recommended):
```bash
# Install extensions
- TypeScript
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- React Extension Pack
```

**WebStorm/IntelliJ**:
- Built-in TypeScript support
- Automatic ESLint integration
- React component support

### Scripts

```bash
# Development
pnpm run dev              # Start Next.js server
pnpm run electron-dev     # Start Electron app

# Building
pnpm run build           # Build Next.js
pnpm run electron-build  # Build Electron app
pnpm run electron-pack   # Pack without installer

# Maintenance
pnpm lint               # Run ESLint
pnpm test               # Run tests (if available)
pnpm update             # Update dependencies
```

## Advanced Configuration

### Building for Distribution

**macOS**:
```bash
pnpm run electron-build
# Output: dist/Mipler-1.0.0.dmg
```

**Windows**:
```bash
pnpm run electron-build
# Output: dist/Mipler-1.0.0-setup.exe (installer)
#         dist/Mipler-1.0.0.exe (portable)
```

**Linux**:
```bash
pnpm run electron-build
# Output: dist/Mipler-1.0.0.AppImage
#         dist/mipler_1.0.0_amd64.deb
```

### Customization

Edit these files to customize:
- `app/globals.css` - Change colors/theme
- `next.config.mjs` - Build configuration
- `package.json` - Project metadata
- `.env.local` - Environment variables

## Performance Tips

1. **Use Production Build**:
   - Faster than dev mode
   - Better memory usage
   - Optimized bundle

2. **Clear Cache**:
   ```bash
   rm -rf .next dist
   ```

3. **Update Dependencies**:
   ```bash
   pnpm update
   ```

4. **Monitor Resources**:
   - Check memory usage in Task Manager
   - Monitor CPU usage
   - Close unused investigations

## Security Best Practices

1. **Protect Your Data**:
   - Backup `~/.mipler/` regularly
   - Don't share `.mipler/` folder
   - Keep backups secure

2. **API Keys**:
   - Use strong, unique keys
   - Rotate regularly
   - Never commit to version control

3. **System Security**:
   - Keep OS updated
   - Keep Node.js updated
   - Use antivirus software

4. **Electron Security**:
   - Don't disable preload security
   - Don't enable remote debugging in production
   - Keep dependencies updated

## Uninstallation

### Remove Application

```bash
# Remove project folder
rm -rf ~/path/to/mipler

# Remove data (optional)
rm -rf ~/.mipler

# Remove from Applications (macOS)
rm -rf /Applications/Mipler.app
```

### Clean Up

```bash
# Remove global packages (if installed)
pnpm remove -g mipler

# Remove npm cache
pnpm store prune
```

## Next Steps

After successful setup:

1. Create your first investigation
2. Explore the 14+ OSINT tools
3. Build a workflow combining multiple tools
4. Try custom tool integration
5. Share your investigations (or keep private)
6. Contribute improvements back to the project

---

**Need Help?**
- Check [QUICKSTART.md](./QUICKSTART.md)
- Review [README.md](./README.md)
- Open an issue on GitHub
- Join community discussions

**Happy investigating!** 🔍
