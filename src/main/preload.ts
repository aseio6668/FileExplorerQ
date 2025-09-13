import { contextBridge, ipcRenderer } from 'electron';
import { DirectoryContent, Drive } from '../types';

const fileSystemAPI = {
  getDirectoryContent: (path: string): Promise<DirectoryContent> =>
    ipcRenderer.invoke('get-directory-content', path),
  
  getHomeDirectory: (): Promise<string> =>
    ipcRenderer.invoke('get-home-directory'),
  
  getAvailableDrives: (): Promise<Drive[]> =>
    ipcRenderer.invoke('get-available-drives'),
  
  openFile: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('open-file', filePath),
  
  showItemInFolder: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('show-item-in-folder', filePath),
  
  createFolder: (parentPath: string, folderName: string): Promise<string> =>
    ipcRenderer.invoke('create-folder', parentPath, folderName),
  
  createFile: (parentPath: string, fileName: string, content?: string): Promise<string> =>
    ipcRenderer.invoke('create-file', parentPath, fileName, content),
  
  deleteItems: (itemPaths: string[]): Promise<void> =>
    ipcRenderer.invoke('delete-items', itemPaths),
  
  renameItem: (oldPath: string, newName: string): Promise<string> =>
    ipcRenderer.invoke('rename-item', oldPath, newName),
  
  copyItems: (sourcePaths: string[], destinationPath: string): Promise<void> =>
    ipcRenderer.invoke('copy-items', sourcePaths, destinationPath),
  
  moveItems: (sourcePaths: string[], destinationPath: string): Promise<void> =>
    ipcRenderer.invoke('move-items', sourcePaths, destinationPath),
  
  showOpenDialog: (options: any): Promise<string[] | null> =>
    ipcRenderer.invoke('show-open-dialog', options),

  showSaveDialog: (options: any): Promise<string | null> =>
    ipcRenderer.invoke('show-save-dialog', options),

  compressItems: (itemPaths: string[], archivePath: string, format?: 'zip' | 'tar' | '7z'): Promise<void> =>
    ipcRenderer.invoke('compress-items', itemPaths, archivePath, format),
  
  getItemProperties: (itemPath: string): Promise<any> =>
    ipcRenderer.invoke('get-item-properties', itemPath),
};

contextBridge.exposeInMainWorld('fileSystemAPI', fileSystemAPI);

declare global {
  interface Window {
    fileSystemAPI: typeof fileSystemAPI;
  }
}