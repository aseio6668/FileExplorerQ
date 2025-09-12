import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import { promises as fs } from 'fs';
import * as path from 'path';
import { FileItem, DirectoryContent } from '../types';

class FileExplorerApp {
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    app.whenReady().then(() => this.createMainWindow());
    
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });

    this.setupIpcHandlers();
  }

  private createMainWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color: '#2f3349',
        symbolColor: '#ffffff',
        height: 40,
      },
      show: false,
    });

    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });
  }

  private setupIpcHandlers(): void {
    ipcMain.handle('get-directory-content', async (_, dirPath: string): Promise<DirectoryContent> => {
      try {
        // Check if path exists and is accessible
        await fs.access(dirPath, fs.constants.R_OK);
        
        const items = await fs.readdir(dirPath, { withFileTypes: true });
        const files: FileItem[] = [];
        const directories: FileItem[] = [];

        for (const item of items) {
          try {
            const itemPath = path.join(dirPath, item.name);
            
            // Skip system files and hidden files that might cause access issues
            if (item.name.startsWith('.') || item.name.startsWith('$')) {
              continue;
            }
            
            let stats;
            try {
              stats = await fs.stat(itemPath);
            } catch (statError) {
              // If we can't stat the file (permission issues), skip it
              console.warn(`Cannot access ${itemPath}:`, statError);
              continue;
            }
            
            const fileItem: FileItem = {
              name: item.name,
              path: itemPath,
              isDirectory: item.isDirectory(),
              size: stats.size,
              lastModified: stats.mtime,
              extension: item.isFile() ? path.extname(item.name) : undefined,
            };

            if (item.isDirectory()) {
              directories.push(fileItem);
            } else {
              files.push(fileItem);
            }
          } catch (itemError) {
            // Skip individual items that can't be processed
            console.warn(`Error processing item ${item.name}:`, itemError);
            continue;
          }
        }

        return {
          files,
          directories,
          parent: path.dirname(dirPath) !== dirPath ? path.dirname(dirPath) : undefined,
          currentPath: dirPath,
        };
      } catch (error: any) {
        let errorMessage = 'Failed to read directory';
        
        if (error.code === 'EACCES') {
          errorMessage = 'Access denied. You do not have permission to access this folder.';
        } else if (error.code === 'ENOENT') {
          errorMessage = 'The specified path does not exist.';
        } else if (error.code === 'ENOTDIR') {
          errorMessage = 'The specified path is not a directory.';
        } else if (error.code === 'EMFILE' || error.code === 'ENFILE') {
          errorMessage = 'Too many files open. Please try again.';
        } else if (error.code === 'EBUSY') {
          errorMessage = 'Resource is busy or locked. Please try again later.';
        }
        
        throw new Error(`${errorMessage} (${error.code || 'Unknown error'})`);
      }
    });

    ipcMain.handle('get-home-directory', () => {
      return require('os').homedir();
    });

    ipcMain.handle('open-file', async (_, filePath: string) => {
      try {
        await shell.openPath(filePath);
      } catch (error) {
        throw new Error(`Failed to open file: ${error}`);
      }
    });

    ipcMain.handle('show-item-in-folder', (_, filePath: string) => {
      shell.showItemInFolder(filePath);
    });

    ipcMain.handle('create-folder', async (_, parentPath: string, folderName: string) => {
      try {
        const folderPath = path.join(parentPath, folderName);
        await fs.mkdir(folderPath);
        return folderPath;
      } catch (error) {
        throw new Error(`Failed to create folder: ${error}`);
      }
    });

    ipcMain.handle('delete-items', async (_, itemPaths: string[]) => {
      try {
        for (const itemPath of itemPaths) {
          const stats = await fs.stat(itemPath);
          if (stats.isDirectory()) {
            await fs.rmdir(itemPath, { recursive: true });
          } else {
            await fs.unlink(itemPath);
          }
        }
      } catch (error) {
        throw new Error(`Failed to delete items: ${error}`);
      }
    });

    ipcMain.handle('rename-item', async (_, oldPath: string, newName: string) => {
      try {
        const newPath = path.join(path.dirname(oldPath), newName);
        await fs.rename(oldPath, newPath);
        return newPath;
      } catch (error) {
        throw new Error(`Failed to rename item: ${error}`);
      }
    });

    ipcMain.handle('show-open-dialog', async (_, options: any) => {
      if (!this.mainWindow) return null;
      
      const result = await dialog.showOpenDialog(this.mainWindow, options);
      return result.canceled ? null : result.filePaths;
    });
  }
}

new FileExplorerApp();