import React from 'react';
import styled from 'styled-components';
import { FileItem, ViewSettings } from '@/types';
import { FileIcon } from './FileIcon';
import { FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

const DetailsContainer = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: 300px 100px 120px 150px;
  gap: 16px;
  padding: 12px 16px;
  background-color: #2d2d30;
  border-bottom: 1px solid #404040;
  font-size: 12px;
  color: #a0a0a0;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 1;
`;

const HeaderColumn = styled.div<{ clickable?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  padding: 2px 0;
  border-radius: 2px;

  &:hover {
    background-color: ${props => props.clickable ? '#404040' : 'transparent'};
  }
`;

const SortIcon = styled.div`
  display: flex;
  align-items: center;
  font-size: 10px;
  opacity: 0.7;
`;

const DetailItem = styled.div<{ selected?: boolean }>`
  display: grid;
  grid-template-columns: 300px 100px 120px 150px;
  gap: 16px;
  padding: 8px 16px;
  cursor: pointer;
  background-color: ${props => props.selected ? '#094771' : 'transparent'};
  border-left: ${props => props.selected ? '3px solid #0078d4' : '3px solid transparent'};
  user-select: none;
  align-items: center;
  
  &:hover {
    background-color: ${props => props.selected ? '#0e639c' : '#2a2d2e'};
  }
`;

const NameCell = styled.div`
  display: flex;
  align-items: center;
  overflow: hidden;
`;

const IconContainer = styled.div`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  flex-shrink: 0;
`;

const NameText = styled.div`
  font-size: 13px;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CellText = styled.div`
  font-size: 12px;
  color: #a0a0a0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

interface FileDetailsProps {
  items: FileItem[];
  selectedItems: string[];
  viewSettings: ViewSettings;
  onSelectionChange: (selectedItems: string[]) => void;
  onItemDoubleClick: (path: string, isDirectory: boolean) => void;
  onContextMenu: (event: React.MouseEvent, items: FileItem[]) => void;
  onViewSettingsChange: (settings: ViewSettings) => void;
}

export const FileDetails: React.FC<FileDetailsProps> = ({
  items,
  selectedItems,
  viewSettings,
  onSelectionChange,
  onItemDoubleClick,
  onContextMenu,
  onViewSettingsChange,
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getFileType = (item: FileItem): string => {
    if (item.isDirectory) return 'File folder';
    if (!item.extension) return 'File';

    const ext = item.extension.toLowerCase();
    const typeMap: { [key: string]: string } = {
      '.txt': 'Text Document',
      '.pdf': 'PDF Document',
      '.doc': 'Word Document',
      '.docx': 'Word Document',
      '.xls': 'Excel Spreadsheet',
      '.xlsx': 'Excel Spreadsheet',
      '.ppt': 'PowerPoint Presentation',
      '.pptx': 'PowerPoint Presentation',
      '.jpg': 'JPEG Image',
      '.jpeg': 'JPEG Image',
      '.png': 'PNG Image',
      '.gif': 'GIF Image',
      '.mp4': 'MP4 Video',
      '.mp3': 'MP3 Audio',
      '.zip': 'ZIP Archive',
      '.rar': 'RAR Archive',
      '.exe': 'Application',
    };

    return typeMap[ext] || `${ext.substring(1).toUpperCase()} File`;
  };

  const handleColumnSort = (column: 'name' | 'size' | 'modified' | 'type') => {
    const newSortOrder = viewSettings.sortBy === column && viewSettings.sortOrder === 'asc'
      ? 'desc'
      : 'asc';

    onViewSettingsChange({
      ...viewSettings,
      sortBy: column,
      sortOrder: newSortOrder
    });
  };

  const getSortIcon = (column: 'name' | 'size' | 'modified' | 'type') => {
    if (viewSettings.sortBy !== column) {
      return <FaSort />;
    }
    return viewSettings.sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const sortedItems = React.useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      // Always put directories first, then files
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }

      let comparison = 0;

      switch (viewSettings.sortBy) {
        case 'name':
          comparison = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'modified':
          comparison = a.lastModified.getTime() - b.lastModified.getTime();
          break;
        case 'type':
          const typeA = getFileType(a);
          const typeB = getFileType(b);
          comparison = typeA.localeCompare(typeB);
          break;
      }

      return viewSettings.sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [items, viewSettings.sortBy, viewSettings.sortOrder]);

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
    <DetailsContainer>
      <Header>
        <HeaderColumn clickable onClick={() => handleColumnSort('name')}>
          Name
          <SortIcon>{getSortIcon('name')}</SortIcon>
        </HeaderColumn>
        <HeaderColumn clickable onClick={() => handleColumnSort('size')}>
          Size
          <SortIcon>{getSortIcon('size')}</SortIcon>
        </HeaderColumn>
        <HeaderColumn clickable onClick={() => handleColumnSort('type')}>
          Type
          <SortIcon>{getSortIcon('type')}</SortIcon>
        </HeaderColumn>
        <HeaderColumn clickable onClick={() => handleColumnSort('modified')}>
          Date Modified
          <SortIcon>{getSortIcon('modified')}</SortIcon>
        </HeaderColumn>
      </Header>
      {sortedItems.map((item) => (
        <DetailItem
          key={item.path}
          selected={selectedItems.includes(item.path)}
          onClick={(e) => handleItemClick(e, item)}
          onDoubleClick={(e) => handleItemDoubleClick(e, item)}
          onContextMenu={(e) => handleItemContextMenu(e, item)}
        >
          <NameCell>
            <IconContainer>
              <FileIcon file={item} size={20} />
            </IconContainer>
            <NameText title={item.name}>
              {item.name}
            </NameText>
          </NameCell>
          <CellText>
            {!item.isDirectory && formatFileSize(item.size)}
          </CellText>
          <CellText>
            {getFileType(item)}
          </CellText>
          <CellText>
            {formatDate(item.lastModified)}
          </CellText>
        </DetailItem>
      ))}
    </DetailsContainer>
  );
};