# FileExplorer Q

An elegant, extensible file explorer for Windows built with Electron, React, and TypeScript.

## Features

- **Modern UI**: Dark theme with intuitive design
- **Multiple View Modes**: Grid, List, and Details views
- **File Operations**: Create, delete, rename, copy, cut
- **Context Menus**: Right-click support for file operations
- **Keyboard Shortcuts**: Standard Windows explorer shortcuts
- **Extensible Architecture**: Plugin system for easy feature expansion

## Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Create installer
npm run dist:win
```

### Scripts

- `npm run dev` - Start development mode with hot reload
- `npm run build` - Build for production
- `npm run start` - Start the built application
- `npm run dist` - Create distributable packages
- `npm run dist:win` - Create Windows installer
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler check

## Architecture

The application follows a modular architecture with clear separation of concerns:

- **Main Process** (`src/main/`): Electron main process handling file system operations
- **Renderer Process** (`src/renderer/`): React frontend with styled-components
- **Types** (`src/types/`): Shared TypeScript interfaces
- **Components**: Modular React components for UI elements

### Key Components

- `App`: Main application component managing state
- `FileExplorer`: Core file browsing functionality
- `NavigationBar`: Address bar and navigation controls
- `Sidebar`: Quick access to common locations
- `FileGrid/FileList/FileDetails`: Different view modes for files
- `ContextMenu`: Right-click menu functionality

## Plugin System

The application is designed to support plugins for extending functionality:

```typescript
interface Plugin {
  id: string;
  name: string;
  version: string;
  contextMenuItems?: ContextMenuItem[];
  fileActions?: FileAction[];
}
```

## Building Installer

The project uses `electron-builder` to create Windows installers:

```bash
npm run dist:win
```

This creates an NSIS installer in the `release` directory with:
- Desktop shortcut
- Start menu entry
- Uninstaller
- Auto-updater support (configurable)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and type checking
6. Submit a pull request

## License

MIT License - see LICENSE file for details.