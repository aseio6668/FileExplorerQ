export interface FileItem {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  lastModified: Date;
  extension?: string;
  icon?: string;
}

export interface DirectoryContent {
  files: FileItem[];
  directories: FileItem[];
  parent?: string;
  currentPath: string;
}

export interface ViewSettings {
  viewMode: 'grid' | 'list' | 'details';
  sortBy: 'name' | 'size' | 'modified' | 'type';
  sortOrder: 'asc' | 'desc';
  showHidden: boolean;
}

export interface WindowState {
  currentPath: string;
  history: string[];
  historyIndex: number;
  viewSettings: ViewSettings;
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  contextMenuItems?: ContextMenuItem[];
  fileActions?: FileAction[];
}

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  action: (items: FileItem[]) => void;
  separator?: boolean;
}

export interface FileAction {
  id: string;
  label: string;
  icon?: string;
  supportedExtensions?: string[];
  action: (file: FileItem) => void;
}

export interface Drive {
  letter: string;
  path: string;
  type: string;
  isReady: boolean;
  name: string;
}