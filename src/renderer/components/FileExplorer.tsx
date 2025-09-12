import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { DirectoryContent, ViewSettings, FileItem } from '@/types';
import { FileGrid } from './FileGrid';
import { FileList } from './FileList';
import { FileDetails } from './FileDetails';
import { ContextMenu } from './ContextMenu';

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
}) => {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    items: FileItem[];
  } | null>(null);

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
    });
  };

  const handleContextMenuAction = (action: string, items: FileItem[]) => {
    setContextMenu(null);
    
    switch (action) {
      case 'open':
        if (items.length === 1) {
          onItemDoubleClick(items[0].path, items[0].isDirectory);
        }
        break;
      case 'delete':
        onDeleteItems(items.map(item => item.path));
        break;
      case 'rename':
        if (items.length === 1) {
          const newName = prompt('Enter new name:', items[0].name);
          if (newName && newName.trim() !== items[0].name) {
            onRenameItem(items[0].path, newName.trim());
          }
        }
        break;
      case 'copy':
        // TODO: Implement copy functionality
        break;
      case 'cut':
        // TODO: Implement cut functionality
        break;
      case 'properties':
        // TODO: Implement properties dialog
        break;
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
      <ExplorerContainer>
        <EmptyContainer>
          <div>This folder is empty</div>
        </EmptyContainer>
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
    <ExplorerContainer>
      {renderFileView()}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onAction={handleContextMenuAction}
          onClose={() => setContextMenu(null)}
        />
      )}
    </ExplorerContainer>
  );
};