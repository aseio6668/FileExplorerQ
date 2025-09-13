import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { DirectoryContent, ViewSettings, FileItem } from '@/types';
import { FileGrid } from './FileGrid';
import { FileList } from './FileList';
import { FileDetails } from './FileDetails';
import { ContextMenu } from './ContextMenu';
import { PromptModal, ConfirmModal } from './Modal';
import { RenameModal } from './RenameModal';
import { clipboardManager } from '@/utils/ClipboardManager';
import { favoritesManager } from '@/utils/FavoritesManager';

const ExplorerContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #1e1e1e;
`;

const LoadingContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a0a0a0;
  font-size: 14px;
`;

const ErrorContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #e74c3c;
  font-size: 14px;
  padding: 20px;
  text-align: center;
`;

const EmptyContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #a0a0a0;
  font-size: 14px;
`;

interface FileExplorerProps {
  directoryContent: DirectoryContent | null;
  loading: boolean;
  error: string;
  selectedItems: string[];
  viewSettings: ViewSettings;
  onItemDoubleClick: (path: string, isDirectory: boolean) => void;
  onSelectionChange: (selectedItems: string[]) => void;
  onViewSettingsChange: (settings: ViewSettings) => void;
  onDeleteItems: (itemPaths: string[]) => void;
  onRenameItem: (oldPath: string, newName: string) => void;
  onRefresh: () => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  directoryContent,
  loading,
  error,
  selectedItems,
  viewSettings,
  onItemDoubleClick,
  onSelectionChange,
  onViewSettingsChange,
  onDeleteItems,
  onRenameItem,
  onRefresh,
}) => {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: FileItem[];
    isEmpty?: boolean;
  } | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    defaultValue: string;
    placeholder: string;
    onConfirm: (value: string) => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    defaultValue: '',
    placeholder: '',
    onConfirm: () => {},
  });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'primary' | 'danger';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'primary',
    onConfirm: () => {},
  });
  const [renameModal, setRenameModal] = useState<{
    isOpen: boolean;
    fileName: string;
    isDirectory: boolean;
    onConfirm: (newName: string) => void;
  }>({
    isOpen: false,
    fileName: '',
    isDirectory: false,
    onConfirm: () => {},
  });

  useEffect(() => {
    const updateFavorites = () => {
      setFavorites(favoritesManager.getFavorites().map(fav => fav.path));
    };
    
    updateFavorites();
    const unsubscribe = favoritesManager.addListener(updateFavorites);
    
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleGlobalClick = () => {
      setContextMenu(null);
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleContextMenu = (event: React.MouseEvent, items: FileItem[]) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      items,
      isEmpty: items.length === 0,
    });
  };

  const handleEmptyAreaContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      items: [],
      isEmpty: true,
    });
  };

  const [modalResolvers, setModalResolvers] = useState<{
    promptResolver?: (value: string | null) => void;
    confirmResolver?: (confirmed: boolean) => void;
  }>({});

  const showPrompt = (title: string, message: string, defaultValue = '', placeholder = '') => {
    return new Promise<string | null>((resolve) => {
      setModalResolvers(prev => ({ ...prev, promptResolver: resolve }));
      setPromptModal({
        isOpen: true,
        title,
        message,
        defaultValue,
        placeholder,
        onConfirm: (value: string) => {
          setPromptModal(prev => ({ ...prev, isOpen: false }));
          resolve(value);
          setModalResolvers(prev => ({ ...prev, promptResolver: undefined }));
        },
      });
    });
  };

  const showConfirm = (title: string, message: string, variant: 'primary' | 'danger' = 'primary') => {
    return new Promise<boolean>((resolve) => {
      setModalResolvers(prev => ({ ...prev, confirmResolver: resolve }));
      setConfirmModal({
        isOpen: true,
        title,
        message,
        variant,
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          resolve(true);
          setModalResolvers(prev => ({ ...prev, confirmResolver: undefined }));
        },
      });
    });
  };

  const closePrompt = () => {
    setPromptModal(prev => ({ ...prev, isOpen: false }));
    if (modalResolvers.promptResolver) {
      modalResolvers.promptResolver(null);
      setModalResolvers(prev => ({ ...prev, promptResolver: undefined }));
    }
  };

  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    if (modalResolvers.confirmResolver) {
      modalResolvers.confirmResolver(false);
      setModalResolvers(prev => ({ ...prev, confirmResolver: undefined }));
    }
  };

  const showRename = (fileName: string, isDirectory: boolean, onConfirm: (newName: string) => void) => {
    setRenameModal({
      isOpen: true,
      fileName,
      isDirectory,
      onConfirm: (newName: string) => {
        setRenameModal(prev => ({ ...prev, isOpen: false }));
        onConfirm(newName);
      },
    });
  };

  const closeRename = () => {
    setRenameModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleContextMenuAction = async (action: string, items: FileItem[], data?: any) => {
    setContextMenu(null);
    
    try {
      switch (action) {
        case 'open':
          if (items.length === 1) {
            onItemDoubleClick(items[0].path, items[0].isDirectory);
          }
          break;

        case 'open-with':
          if (items.length === 1 && !items[0].isDirectory) {
            const options = {
              title: 'Open with...',
              filters: [{ name: 'Applications', extensions: ['exe'] }],
              properties: ['openFile'],
            };
            const result = await window.fileSystemAPI.showOpenDialog(options);
            if (result && result.length > 0) {
              // This would need system-specific implementation
              console.log('Opening with:', result[0]);
            }
          }
          break;

        case 'show-in-folder':
          if (items.length === 1) {
            await window.fileSystemAPI.showItemInFolder(items[0].path);
          }
          break;

        case 'copy':
          clipboardManager.copy(items);
          break;

        case 'cut':
          clipboardManager.cut(items);
          break;

        case 'paste':
          const clipboard = clipboardManager.paste();
          if (clipboard && directoryContent) {
            const sourcePaths = clipboard.items.map(item => item.path);
            
            if (clipboard.operation === 'copy') {
              await window.fileSystemAPI.copyItems(sourcePaths, directoryContent.currentPath);
            } else {
              await window.fileSystemAPI.moveItems(sourcePaths, directoryContent.currentPath);
            }
            
            onRefresh();
          }
          break;

        case 'delete':
          if (items.length > 0) {
            const confirmMessage = items.length === 1 
              ? `Are you sure you want to delete "${items[0].name}"?`
              : `Are you sure you want to delete ${items.length} items?`;
            
            const confirmed = await showConfirm('Delete Items', confirmMessage, 'danger');
            if (confirmed) {
              onDeleteItems(items.map(item => item.path));
            }
          }
          break;

        case 'rename':
          if (items.length === 1) {
            const item = items[0];
            showRename(item.name, item.isDirectory, (newName: string) => {
              if (newName !== item.name) {
                onRenameItem(item.path, newName);
              }
            });
          }
          break;

        case 'new-folder':
          if (directoryContent) {
            const folderName = await showPrompt('New Folder', 'Enter folder name:', 'New Folder');
            if (folderName) {
              try {
                // Check if folder already exists before creating
                const directoryContent2 = await window.fileSystemAPI.getDirectoryContent(directoryContent.currentPath);
                const allItems = [...directoryContent2.files, ...directoryContent2.directories];
                const existingItem = allItems.find(item => item.name.toLowerCase() === folderName.toLowerCase());
                
                if (existingItem) {
                  const confirmed = await showConfirm(
                    'Folder Already Exists', 
                    `A ${existingItem.isDirectory ? 'folder' : 'file'} named "${folderName}" already exists. Create with a unique name instead?`, 
                    'primary'
                  );
                  if (!confirmed) {
                    break; // User cancelled, don't create folder
                  }
                }
                
                const createdPath = await window.fileSystemAPI.createFolder(directoryContent.currentPath, folderName);
                onRefresh();
              } catch (error) {
                await showConfirm('Error', `Failed to create folder: ${error instanceof Error ? error.message : 'Unknown error'}`, 'primary');
              }
            }
          }
          break;

        case 'new-file':
          if (directoryContent) {
            const fileName = await showPrompt('New File', 'Enter file name:', 'New File.txt');
            if (fileName) {
              try {
                // Check if file already exists before creating
                const proposedPath = `${directoryContent.currentPath}${directoryContent.currentPath.endsWith('\\') ? '' : '\\'}${fileName}`;
                const directoryContent2 = await window.fileSystemAPI.getDirectoryContent(directoryContent.currentPath);
                const allItems = [...directoryContent2.files, ...directoryContent2.directories];
                const existingItem = allItems.find(item => item.name.toLowerCase() === fileName.toLowerCase());
                
                if (existingItem) {
                  const confirmed = await showConfirm(
                    'File Already Exists', 
                    `A ${existingItem.isDirectory ? 'folder' : 'file'} named "${fileName}" already exists. Create with a unique name instead?`, 
                    'primary'
                  );
                  if (!confirmed) {
                    break; // User cancelled, don't create file
                  }
                }
                
                const createdPath = await window.fileSystemAPI.createFile(directoryContent.currentPath, fileName);
                onRefresh();
              } catch (error) {
                await showConfirm('Error', `Failed to create file: ${error instanceof Error ? error.message : 'Unknown error'}`, 'primary');
              }
            }
          }
          break;

        case 'refresh':
          onRefresh();
          break;

        case 'add-to-favorites':
          const pathToAdd = items.length === 1 ? items[0].path : directoryContent?.currentPath;
          if (pathToAdd) {
            favoritesManager.addFavorite(pathToAdd);
          }
          break;

        case 'remove-from-favorites':
          if (items.length === 1) {
            favoritesManager.removeFavoriteByPath(items[0].path);
          }
          break;

        case 'compress':
          if (items.length > 0 && directoryContent) {
            const defaultName = items.length === 1 ? `${items[0].name}.zip` : 'archive.zip';
            const defaultPath = `${directoryContent.currentPath}\\${defaultName}`;
            
            const options = {
              title: 'Save Archive As',
              defaultPath: defaultPath,
              filters: [
                { name: 'ZIP files', extensions: ['zip'] },
                { name: 'All files', extensions: ['*'] }
              ],
            };
            
            const result = await window.fileSystemAPI.showSaveDialog(options);
            if (result) {
              try {
                const itemPaths = items.map(item => item.path);
                await window.fileSystemAPI.compressItems(itemPaths, result);
                onRefresh();
              } catch (error) {
                await showConfirm('Compression Failed', `Failed to create archive: ${error instanceof Error ? error.message : 'Unknown error'}`, 'primary');
              }
            }
          }
          break;

        case 'properties':
          if (items.length === 1) {
            try {
              const properties = await window.fileSystemAPI.getItemProperties(items[0].path);
              // For now, just show in alert - in a real app, you'd show a proper dialog
              const info = [
                `Name: ${properties.name}`,
                `Path: ${properties.path}`,
                `Size: ${properties.size} bytes`,
                `Type: ${properties.isDirectory ? 'Folder' : 'File'}`,
                `Created: ${new Date(properties.created).toLocaleString()}`,
                `Modified: ${new Date(properties.modified).toLocaleString()}`,
              ].join('\n');
              alert(info);
            } catch (error) {
              alert(`Failed to get properties: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          } else if (directoryContent) {
            // Folder properties
            alert(`Current folder: ${directoryContent.currentPath}`);
          }
          break;

        default:
          console.log('Unhandled context menu action:', action);
          break;
      }
    } catch (error) {
      console.error('Context menu action failed:', error);
      alert(`Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (loading) {
    return (
      <ExplorerContainer>
        <LoadingContainer>Loading...</LoadingContainer>
      </ExplorerContainer>
    );
  }

  if (error) {
    return (
      <ExplorerContainer>
        <ErrorContainer>{error}</ErrorContainer>
      </ExplorerContainer>
    );
  }

  if (!directoryContent) {
    return (
      <ExplorerContainer>
        <EmptyContainer>No directory selected</EmptyContainer>
      </ExplorerContainer>
    );
  }

  const allItems = [...directoryContent.directories, ...directoryContent.files];

  if (allItems.length === 0) {
    return (
      <ExplorerContainer onContextMenu={handleEmptyAreaContextMenu}>
        <EmptyContainer onContextMenu={handleEmptyAreaContextMenu}>
          <div>This folder is empty</div>
        </EmptyContainer>
        
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={contextMenu.items}
            currentPath={directoryContent?.currentPath}
            isEmpty={contextMenu.isEmpty}
            favorites={favorites}
            onAction={handleContextMenuAction}
            onClose={() => setContextMenu(null)}
          />
        )}
        
        <PromptModal
          isOpen={promptModal.isOpen}
          title={promptModal.title}
          message={promptModal.message}
          defaultValue={promptModal.defaultValue}
          placeholder={promptModal.placeholder}
          onConfirm={promptModal.onConfirm}
          onCancel={closePrompt}
        />
        
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          variant={confirmModal.variant}
          onConfirm={confirmModal.onConfirm}
          onCancel={closeConfirm}
        />
        
        <RenameModal
          isOpen={renameModal.isOpen}
          fileName={renameModal.fileName}
          isDirectory={renameModal.isDirectory}
          onConfirm={renameModal.onConfirm}
          onCancel={closeRename}
        />
      </ExplorerContainer>
    );
  }

  const renderFileView = () => {
    const commonProps = {
      items: allItems,
      selectedItems,
      onSelectionChange,
      onItemDoubleClick,
      onContextMenu: handleContextMenu,
    };

    switch (viewSettings.viewMode) {
      case 'list':
        return <FileList {...commonProps} />;
      case 'details':
        return <FileDetails {...commonProps} />;
      default:
        return <FileGrid {...commonProps} />;
    }
  };

  return (
    <ExplorerContainer onContextMenu={handleEmptyAreaContextMenu}>
      {renderFileView()}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          currentPath={directoryContent?.currentPath}
          isEmpty={contextMenu.isEmpty}
          favorites={favorites}
          onAction={handleContextMenuAction}
          onClose={() => setContextMenu(null)}
        />
      )}
      
      <PromptModal
        isOpen={promptModal.isOpen}
        title={promptModal.title}
        message={promptModal.message}
        defaultValue={promptModal.defaultValue}
        placeholder={promptModal.placeholder}
        onConfirm={promptModal.onConfirm}
        onCancel={closePrompt}
      />
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
      />
    </ExplorerContainer>
  );
};