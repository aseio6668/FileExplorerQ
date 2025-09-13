# FileExplorer Q - Build Scripts

Easy-to-use batch scripts for building and packaging your FileExplorer Q application.

## 🚀 Quick Start

After making code changes, simply double-click the appropriate batch file:

### **quick-package.bat** ⭐ *Most Common*
- **Use this for:** Final builds after code changes
- **What it does:** Builds + Creates installer in one step
- **Output:** Ready-to-distribute installer

### **dev.bat** 🔧 *For Development*
- **Use this for:** Active development
- **What it does:** Runs development server with hot-reload
- **Output:** Development window that updates as you code

## 📋 All Available Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| **quick-package.bat** | Build + Package | After code changes, ready to distribute |
| **dev.bat** | Development mode | While coding (auto-reload) |
| **build.bat** | Build only | Test compilation without packaging |
| **package.bat** | Package only | Already built, just need installer |
| **clean.bat** | Clean everything | Start fresh / fix build issues |

## 🔄 Typical Workflow

1. **During Development:**
   ```
   Double-click: dev.bat
   → Make your code changes
   → App auto-reloads to show changes
   ```

2. **Ready to Release:**
   ```
   Double-click: quick-package.bat
   → Wait for build completion
   → Installer ready in /release folder
   ```

## 📁 Output Files

After running **quick-package.bat**, you'll find:

```
📂 release/
  📄 FileExplorer Q Setup 1.0.0.exe    ← Full installer
  📂 win-unpacked/
    📄 FileExplorer Q.exe               ← Portable version
```

## 🛠️ Manual Commands (if needed)

If batch files don't work, you can run these manually in Command Prompt:

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Build only
npm run build

# Create installer
npm run dist:win

# Run built app
npm start
```

## 🔧 Troubleshooting

**Build fails?**
1. Run `clean.bat` first
2. Then run `quick-package.bat`

**Dependencies issues?**
- Delete `node_modules` folder
- Run `npm install`

**Permission errors?**
- Run Command Prompt as Administrator
- Then run the batch files

## 🎯 Version Updates

To update version number:
1. Edit `package.json` → change `"version": "1.0.0"`
2. Run `quick-package.bat`
3. New installer will have updated version number

---

💡 **Pro Tip:** Create desktop shortcuts to these batch files for even faster access!