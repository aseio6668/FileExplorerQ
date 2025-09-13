import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import { promises as fs } from 'fs';
import * as path from 'path';
import archiver from 'archiver';
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
          // Check if this looks like a drive path (like D:\, F:\)
          if (/^[A-Za-z]:\\?$/.test(dirPath)) {
            errorMessage = 'Drive not ready. Please insert a disk or check if the drive is connected.';
          } else {
            errorMessage = 'The specified path does not exist.';
          }
        } else if (error.code === 'ENOTDIR') {
          errorMessage = 'The specified path is not a directory.';
        } else if (error.code === 'EMFILE' || error.code === 'ENFILE') {
          errorMessage = 'Too many files open. Please try again.';
        } else if (error.code === 'EBUSY') {
          errorMessage = 'Resource is busy or locked. Please try again later.';
        } else if (error.code === 'ENODEV') {
          errorMessage = 'Device not ready. Please insert a disk or check if the drive is connected.';
        } else if (error.code === 'EIO') {
          errorMessage = 'Input/output error. The drive may be corrupted or not properly connected.';
        } else if (error.code === 'UNKNOWN') {
          // Windows often returns UNKNOWN for drive-related errors
          if (/^[A-Za-z]:\\?$/.test(dirPath)) {
            errorMessage = 'Drive not accessible. Please insert a disk or check if the drive is connected.';
          } else {
            errorMessage = 'Unknown error accessing this location.';
          }
        }
        
        throw new Error(`${errorMessage} (${error.code || 'Unknown error'})`);
      }
    });

    ipcMain.handle('get-home-directory', () => {
      return require('os').homedir();
    });

    ipcMain.handle('get-available-drives', async () => {
      try {
        const drives = [];
        const driveLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        for (const letter of driveLetters) {
          const drivePath = `${letter}:\\`;
          try {
            // Try to access the drive to see if it exists
            await fs.access(drivePath, fs.constants.F_OK);
            
            // Try to get additional info about the drive
            let driveType = 'Unknown';
            let isReady = false;
            
            try {
              // Test if drive is readable
              await fs.readdir(drivePath);
              isReady = true;
              
              // Determine drive type based on typical patterns
              if (letter === 'C') {
                driveType = 'System';
              } else if (['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].includes(letter)) {
                // Could be removable/external
                driveType = 'Removable/External';
              } else {
                driveType = 'Local';
              }
            } catch {
              // Drive exists but is not ready (no disk inserted, etc.)
              isReady = false;
              driveType = 'Not Ready';
            }
            
            drives.push({
              letter,
              path: drivePath,
              type: driveType,
              isReady,
              name: `${driveType} (${letter}:)`
            });
          } catch {
            // Drive letter doesn't exist, skip
            continue;
          }
        }
        
        return drives;
      } catch (error) {
        console.error('Failed to get available drives:', error);
        return [];
      }
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
        let finalFolderPath = path.join(parentPath, folderName);
        let counter = 1;
        
        // Check if folder already exists and generate unique name
        while (await this.pathExists(finalFolderPath)) {
          const uniqueName = `${folderName} (${counter})`;
          finalFolderPath = path.join(parentPath, uniqueName);
          counter++;
        }
        
        await fs.mkdir(finalFolderPath);
        return finalFolderPath;
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

    ipcMain.handle('show-save-dialog', async (_, options: any) => {
      if (!this.mainWindow) return null;
      
      const result = await dialog.showSaveDialog(this.mainWindow, options);
      return result.canceled ? null : result.filePath;
    });

    ipcMain.handle('create-file', async (_, parentPath: string, fileName: string, content = '') => {
      try {
        let finalFilePath = path.join(parentPath, fileName);
        let counter = 1;
        
        // Check if file already exists and generate unique name
        while (await this.pathExists(finalFilePath)) {
          const ext = path.extname(fileName);
          const nameWithoutExt = path.basename(fileName, ext);
          const uniqueName = `${nameWithoutExt} (${counter})${ext}`;
          finalFilePath = path.join(parentPath, uniqueName);
          counter++;
        }
        
        await fs.writeFile(finalFilePath, content, 'utf8');
        return finalFilePath;
      } catch (error) {
        throw new Error(`Failed to create file: ${error}`);
      }
    });

    ipcMain.handle('copy-items', async (_, sourcePaths: string[], destinationPath: string) => {
      try {
        for (const sourcePath of sourcePaths) {
          const fileName = path.basename(sourcePath);
          const destPath = path.join(destinationPath, fileName);
          
          const sourceStats = await fs.stat(sourcePath);
          
          if (sourceStats.isDirectory()) {
            await this.copyDirectory(sourcePath, destPath);
          } else {
            // Check if destination file already exists and generate unique name if needed
            let finalDestPath = destPath;
            let counter = 1;
            
            while (await this.pathExists(finalDestPath)) {
              const ext = path.extname(fileName);
              const nameWithoutExt = path.basename(fileName, ext);
              const newName = `${nameWithoutExt} (${counter})${ext}`;
              finalDestPath = path.join(destinationPath, newName);
              counter++;
            }
            
            await fs.copyFile(sourcePath, finalDestPath);
          }
        }
      } catch (error) {
        throw new Error(`Failed to copy items: ${error}`);
      }
    });

    ipcMain.handle('move-items', async (_, sourcePaths: string[], destinationPath: string) => {
      try {
        for (const sourcePath of sourcePaths) {
          const fileName = path.basename(sourcePath);
          const destPath = path.join(destinationPath, fileName);
          
          // Check if destination already exists and generate unique name if needed
          let finalDestPath = destPath;
          let counter = 1;
          
          while (await this.pathExists(finalDestPath)) {
            const ext = path.extname(fileName);
            const nameWithoutExt = path.basename(fileName, ext);
            const newName = `${nameWithoutExt} (${counter})${ext}`;
            finalDestPath = path.join(destinationPath, newName);
            counter++;
          }
          
          await fs.rename(sourcePath, finalDestPath);
        }
      } catch (error) {
        throw new Error(`Failed to move items: ${error}`);
      }
    });

    ipcMain.handle('compress-items', async (_, itemPaths: string[], archivePath: string, format = 'zip') => {
      try {
        return new Promise<void>((resolve, reject) => {
          console.log(`Creating archive: ${archivePath}`);
          console.log(`Items to compress:`, itemPaths);

          const output = require('fs').createWriteStream(archivePath);
          const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
          });

          let hasItems = false;

          // Handle stream events
          output.on('close', () => {
            const totalBytes = archive.pointer();
            console.log(`Archive created successfully: ${totalBytes} total bytes`);
            if (totalBytes > 0) {
              resolve();
            } else {
              reject(new Error('Archive created but appears to be empty'));
            }
          });

          output.on('end', () => {
            console.log('Archive output stream ended');
          });

          output.on('error', (err: any) => {
            console.error('Output stream error:', err);
            reject(new Error(`Output stream error: ${err.message}`));
          });

          archive.on('error', (err: any) => {
            console.error('Archive error:', err);
            reject(new Error(`Archive error: ${err.message}`));
          });

          archive.on('warning', (err: any) => {
            console.warn('Archive warning:', err);
            if (err.code === 'ENOENT') {
              console.warn('File not found:', err.message);
            } else {
              reject(new Error(`Archive warning: ${err.message}`));
            }
          });

          archive.on('entry', (entry: any) => {
            console.log('Added to archive:', entry.name);
            hasItems = true;
          });

          // Pipe archive data to the file
          archive.pipe(output);

          // Add files and directories to archive
          let addedCount = 0;
          for (const itemPath of itemPaths) {
            try {
              console.log(`Processing item: ${itemPath}`);
              const stats = require('fs').statSync(itemPath);
              const itemName = path.basename(itemPath);

              if (stats.isDirectory()) {
                console.log(`Adding directory: ${itemName}`);
                // Add entire directory recursively
                archive.directory(itemPath, itemName);
                addedCount++;
              } else {
                console.log(`Adding file: ${itemName}`);
                // Add single file
                archive.file(itemPath, { name: itemName });
                addedCount++;
              }
            } catch (statError) {
              console.warn(`Skipping item ${itemPath}:`, statError);
            }
          }

          if (addedCount === 0) {
            reject(new Error('No valid items found to compress'));
            return;
          }

          console.log(`Added ${addedCount} items, finalizing archive...`);
          
          // Finalize the archive
          archive.finalize().catch((finalizeError: any) => {
            console.error('Failed to finalize archive:', finalizeError);
            reject(new Error(`Failed to finalize archive: ${finalizeError.message}`));
          });
        });
      } catch (error) {
        console.error('Compression failed:', error);
        throw new Error(`Failed to compress items: ${error}`);
      }
    });

    ipcMain.handle('get-item-properties', async (_, itemPath: string) => {
      try {
        const stats = await fs.stat(itemPath);
        const itemName = path.basename(itemPath);
        const parentPath = path.dirname(itemPath);
        
        return {
          name: itemName,
          path: itemPath,
          parentPath,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          accessed: stats.atime,
          isDirectory: stats.isDirectory(),
          isFile: stats.isFile(),
          permissions: {
            readable: true, // Simplified - would need platform-specific checks
            writable: true,
            executable: true,
          },
          extension: stats.isFile() ? path.extname(itemName) : undefined,
        };
      } catch (error) {
        throw new Error(`Failed to get item properties: ${error}`);
      }
    });
  }

  private async pathExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async copyDirectory(source: string, destination: string): Promise<void> {
    try {
      await fs.mkdir(destination, { recursive: true });
      const entries = await fs.readdir(source, { withFileTypes: true });
      
      for (const entry of entries) {
        const srcPath = path.join(source, entry.name);
        const destPath = path.join(destination, entry.name);
        
        if (entry.isDirectory()) {
          await this.copyDirectory(srcPath, destPath);
        } else {
          await fs.copyFile(srcPath, destPath);
        }
      }
    } catch (error) {
      throw new Error(`Failed to copy directory: ${error}`);
    }
  }
}

new FileExplorerApp();