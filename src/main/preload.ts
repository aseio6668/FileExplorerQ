import { contextBridge, ipcRenderer } from 'electron';
import { DirectoryContent } from '../types';

const fileSystemAPI = {
  getDirectoryContent: (path: string): Promise<DirectoryContent> =>
    ipcRenderer.invoke('get-directory-content', path),
  
  getHomeDirectory: (): Promise<string> =>
    ipcRenderer.invoke('get-home-directory'),
  
  openFile: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('open-file', filePath),
  
  showItemInFolder: (filePath: string): Promise<void> =>
    ipcRenderer.invoke('show-item-in-folder', filePath),
  
  createFolder: (parentPath: string, folderName: string): Promise<string> =>
    ipcRenderer.invoke('create-folder', parentPath, folderName),
  
  deleteItems: (itemPaths: string[]): Promise<void> =>
    ipcRenderer.invoke('delete-items', itemPaths),
  
  renameItem: (oldPath: string, newName: string): Promise<string> =>
    ipcRenderer.invoke('rename-item', oldPath, newName),
  
  showOpenDialog: (options: any): Promise<string[] | null> =>
    ipcRenderer.invoke('show-open-dialog', options),
};

contextBridge.exposeInMainWorld('fileSystemAPI', fileSystemAPI);

declare global {
  interface Window {
    fileSystemAPI: typeof fileSystemAPI;
  }
}