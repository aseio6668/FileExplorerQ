import React from 'react';
import styled from 'styled-components';
import { FileItem } from '@/types';
import { FileIcon } from './FileIcon';

const ListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ListItem = styled.div<{ selected?: boolean }>`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  background-color: ${props => props.selected ? '#094771' : 'transparent'};
  border-left: ${props => props.selected ? '3px solid #0078d4' : '3px solid transparent'};
  user-select: none;
  
  &:hover {
    background-color: ${props => props.selected ? '#0e639c' : '#2a2d2e'};
  }
`;

const IconContainer = styled.div`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
`;

const ItemName = styled.div`
  font-size: 13px;
  color: #ffffff;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ItemSize = styled.div`
  font-size: 12px;
  color: #a0a0a0;
  width: 100px;
  text-align: right;
`;

interface FileListProps {
  items: FileItem[];
  selectedItems: string[];
  onSelectionChange: (selectedItems: string[]) => void;
  onItemDoubleClick: (path: string, isDirectory: boolean) => void;
  onContextMenu: (event: React.MouseEvent, items: FileItem[]) => void;
}

export const FileList: React.FC<FileListProps> = ({
  items,
  selectedItems,
  onSelectionChange,
  onItemDoubleClick,
  onContextMenu,
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleItemClick = (event: React.MouseEvent, item: FileItem) => {
    event.stopPropagation();
    
    if (event.ctrlKey) {
      const newSelection = selectedItems.includes(item.path)
        ? selectedItems.filter(path => path !== item.path)
        : [...selectedItems, item.path];
      onSelectionChange(newSelection);
    } else if (event.shiftKey && selectedItems.length > 0) {
      const lastSelected = selectedItems[selectedItems.length - 1];
      const lastIndex = items.findIndex(i => i.path === lastSelected);
      const currentIndex = items.findIndex(i => i.path === item.path);
      
      if (lastIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeItems = items.slice(start, end + 1).map(i => i.path);
        onSelectionChange([...new Set([...selectedItems, ...rangeItems])]);
      } else {
        onSelectionChange([item.path]);
      }
    } else {
      onSelectionChange([item.path]);
    }
  };

  const handleItemDoubleClick = (event: React.MouseEvent, item: FileItem) => {
    event.stopPropagation();
    onItemDoubleClick(item.path, item.isDirectory);
  };

  const handleItemContextMenu = (event: React.MouseEvent, item: FileItem) => {
    event.stopPropagation();
    
    if (!selectedItems.includes(item.path)) {
      onSelectionChange([item.path]);
    }
    
    const selectedFiles = items.filter(i => selectedItems.includes(i.path));
    onContextMenu(event, selectedFiles);
  };

  return (
    <ListContainer>
      {items.map((item) => (
        <ListItem
          key={item.path}
          selected={selectedItems.includes(item.path)}
          onClick={(e) => handleItemClick(e, item)}
          onDoubleClick={(e) => handleItemDoubleClick(e, item)}
          onContextMenu={(e) => handleItemContextMenu(e, item)}
        >
          <IconContainer>
            <FileIcon file={item} size={20} />
          </IconContainer>
          <ItemName title={item.name}>
            {item.name}
          </ItemName>
          <ItemSize>
            {!item.isDirectory && formatFileSize(item.size)}
          </ItemSize>
        </ListItem>
      ))}
    </ListContainer>
  );
};