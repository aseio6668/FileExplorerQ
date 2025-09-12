import React from 'react';
import styled from 'styled-components';
import { FileItem } from '@/types';
import { FileIcon } from './FileIcon';

const GridContainer = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  align-content: start;
`;

const GridItem = styled.div<{ selected?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border-radius: 6px;
  cursor: pointer;
  background-color: ${props => props.selected ? '#094771' : 'transparent'};
  border: ${props => props.selected ? '1px solid #0078d4' : '1px solid transparent'};
  user-select: none;
  
  &:hover {
    background-color: ${props => props.selected ? '#0e639c' : '#2a2d2e'};
  }
  
  &:active {
    background-color: #094771;
  }
`;

const IconContainer = styled.div`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
`;

const ItemName = styled.div`
  font-size: 12px;
  color: #ffffff;
  text-align: center;
  word-break: break-word;
  line-height: 1.3;
  max-height: 2.6em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

interface FileGridProps {
  items: FileItem[];
  selectedItems: string[];
  onSelectionChange: (selectedItems: string[]) => void;
  onItemDoubleClick: (path: string, isDirectory: boolean) => void;
  onContextMenu: (event: React.MouseEvent, items: FileItem[]) => void;
}

export const FileGrid: React.FC<FileGridProps> = ({
  items,
  selectedItems,
  onSelectionChange,
  onItemDoubleClick,
  onContextMenu,
}) => {
  const handleItemClick = (event: React.MouseEvent, item: FileItem) => {
    event.stopPropagation();
    
    if (event.ctrlKey) {
      // Toggle selection
      const newSelection = selectedItems.includes(item.path)
        ? selectedItems.filter(path => path !== item.path)
        : [...selectedItems, item.path];
      onSelectionChange(newSelection);
    } else if (event.shiftKey && selectedItems.length > 0) {
      // Range selection
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
      // Single selection
      onSelectionChange([item.path]);
    }
  };

  const handleItemDoubleClick = (event: React.MouseEvent, item: FileItem) => {
    event.stopPropagation();
    onItemDoubleClick(item.path, item.isDirectory);
  };

  const handleItemContextMenu = (event: React.MouseEvent, item: FileItem) => {
    event.stopPropagation();
    
    // Select the item if it's not already selected
    if (!selectedItems.includes(item.path)) {
      onSelectionChange([item.path]);
    }
    
    const selectedFiles = items.filter(i => selectedItems.includes(i.path));
    onContextMenu(event, selectedFiles);
  };

  const handleContainerClick = () => {
    onSelectionChange([]);
  };

  return (
    <GridContainer onClick={handleContainerClick}>
      {items.map((item) => (
        <GridItem
          key={item.path}
          selected={selectedItems.includes(item.path)}
          onClick={(e) => handleItemClick(e, item)}
          onDoubleClick={(e) => handleItemDoubleClick(e, item)}
          onContextMenu={(e) => handleItemContextMenu(e, item)}
        >
          <IconContainer>
            <FileIcon file={item} size={48} />
          </IconContainer>
          <ItemName title={item.name}>
            {item.name}
          </ItemName>
        </GridItem>
      ))}
    </GridContainer>
  );
};