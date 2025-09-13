import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { FileItem } from '@/types';
import { FileIcon } from './FileIcon';

const GridContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
`;

const GridContent = styled.div<{ height: number }>`
  height: ${props => props.height}px;
  position: relative;
`;

const VirtualRow = styled.div<{ top: number }>`
  position: absolute;
  top: ${props => props.top}px;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  padding: 0 16px;
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
  height: 100px;
  
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

interface VirtualizedFileGridProps {
  items: FileItem[];
  selectedItems: string[];
  onSelectionChange: (selectedItems: string[]) => void;
  onItemDoubleClick: (path: string, isDirectory: boolean) => void;
  onContextMenu: (event: React.MouseEvent, items: FileItem[]) => void;
  itemHeight?: number;
  containerHeight?: number;
}

export const VirtualizedFileGrid: React.FC<VirtualizedFileGridProps> = ({
  items,
  selectedItems,
  onSelectionChange,
  onItemDoubleClick,
  onContextMenu,
  itemHeight = 116, // 100px item + 16px gap
  containerHeight = 600,
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);

  // Calculate how many items fit per row
  const itemsPerRow = useMemo(() => {
    const itemWidth = 120; // minmax(120px, 1fr)
    const gap = 16;
    const padding = 32; // 16px on each side
    const availableWidth = containerWidth - padding;
    return Math.max(1, Math.floor((availableWidth + gap) / (itemWidth + gap)));
  }, [containerWidth]);

  // Calculate total rows and virtual window
  const totalRows = Math.ceil(items.length / itemsPerRow);
  const totalHeight = totalRows * itemHeight;

  // Calculate visible range
  const visibleStartRow = Math.floor(scrollTop / itemHeight);
  const visibleEndRow = Math.min(
    totalRows - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight)
  );

  // Buffer for smooth scrolling
  const bufferSize = 2;
  const startRow = Math.max(0, visibleStartRow - bufferSize);
  const endRow = Math.min(totalRows - 1, visibleEndRow + bufferSize);

  // Get visible items
  const visibleItems = useMemo(() => {
    const result: Array<{ item: FileItem; rowIndex: number; colIndex: number }> = [];
    
    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      for (let colIndex = 0; colIndex < itemsPerRow; colIndex++) {
        const itemIndex = rowIndex * itemsPerRow + colIndex;
        if (itemIndex < items.length) {
          result.push({
            item: items[itemIndex],
            rowIndex,
            colIndex,
          });
        }
      }
    }
    
    return result;
  }, [items, startRow, endRow, itemsPerRow]);

  // Group items by row for rendering
  const itemRows = useMemo(() => {
    const rows: Array<{ rowIndex: number; items: Array<{ item: FileItem; colIndex: number }> }> = [];
    
    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      const rowItems: Array<{ item: FileItem; colIndex: number }> = [];
      
      for (let colIndex = 0; colIndex < itemsPerRow; colIndex++) {
        const itemIndex = rowIndex * itemsPerRow + colIndex;
        if (itemIndex < items.length) {
          rowItems.push({
            item: items[itemIndex],
            colIndex,
          });
        }
      }
      
      if (rowItems.length > 0) {
        rows.push({ rowIndex, items: rowItems });
      }
    }
    
    return rows;
  }, [items, startRow, endRow, itemsPerRow]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Handle container resize
  useEffect(() => {
    if (!containerElement) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(containerElement);
    return () => resizeObserver.disconnect();
  }, [containerElement]);

  const handleItemClick = useCallback((event: React.MouseEvent, item: FileItem) => {
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
  }, [selectedItems, onSelectionChange, items]);

  const handleItemDoubleClick = useCallback((event: React.MouseEvent, item: FileItem) => {
    event.stopPropagation();
    onItemDoubleClick(item.path, item.isDirectory);
  }, [onItemDoubleClick]);

  const handleItemContextMenu = useCallback((event: React.MouseEvent, item: FileItem) => {
    event.stopPropagation();
    
    if (!selectedItems.includes(item.path)) {
      onSelectionChange([item.path]);
    }
    
    const selectedFiles = items.filter(i => selectedItems.includes(i.path));
    onContextMenu(event, selectedFiles);
  }, [selectedItems, onSelectionChange, items, onContextMenu]);

  const handleContainerClick = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  return (
    <GridContainer
      ref={setContainerElement}
      onScroll={handleScroll}
      onClick={handleContainerClick}
    >
      <GridContent height={totalHeight}>
        {itemRows.map(({ rowIndex, items: rowItems }) => (
          <VirtualRow key={rowIndex} top={rowIndex * itemHeight}>
            {rowItems.map(({ item, colIndex }) => (
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
          </VirtualRow>
        ))}
      </GridContent>
    </GridContainer>
  );
};