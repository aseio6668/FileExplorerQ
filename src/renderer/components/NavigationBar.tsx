import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  FaArrowLeft, 
  FaArrowRight, 
  FaArrowUp, 
  FaSyncAlt as FaRefresh, 
  FaHome,
  FaFolderPlus,
  FaTh,
  FaList,
  FaThList
} from 'react-icons/fa';
import { SearchBar } from './SearchBar';
import { FileItem, ViewSettings } from '@/types';

const NavigationContainer = styled.div`
  height: 48px;
  background-color: #252526;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid #404040;
  gap: 8px;
`;

const NavButton = styled.button<{ disabled?: boolean }>`
  background: transparent;
  border: none;
  color: ${props => props.disabled ? '#666' : '#ffffff'};
  padding: 8px;
  border-radius: 4px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  
  &:hover:not(:disabled) {
    background-color: #094771;
  }
  
  &:active:not(:disabled) {
    background-color: #0e639c;
  }
`;

const PathInput = styled.input`
  flex: 1;
  background-color: #3c3c3c;
  border: 1px solid #555555;
  border-radius: 4px;
  padding: 6px 12px;
  color: #ffffff;
  font-size: 14px;
  margin: 0 12px;
  
  &:focus {
    outline: none;
    border-color: #0078d4;
  }
`;

const ViewModeGroup = styled.div`
  display: flex;
  background-color: #3c3c3c;
  border-radius: 4px;
  overflow: hidden;
`;

const ViewModeButton = styled.button<{ active?: boolean }>`
  background: ${props => props.active ? '#0078d4' : 'transparent'};
  border: none;
  color: #ffffff;
  padding: 6px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover:not(.active) {
    background-color: #555555;
  }
`;

const Separator = styled.div`
  width: 1px;
  height: 24px;
  background-color: #555555;
  margin: 0 4px;
`;

interface NavigationBarProps {
  currentPath: string;
  canGoBack: boolean;
  canGoForward: boolean;
  viewSettings: ViewSettings;
  items?: FileItem[];
  onNavigate: (path: string) => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onRefresh: () => void;
  onCreateFolder: (folderName: string) => void;
  onViewSettingsChange: (settings: ViewSettings) => void;
  onSearchResults?: (filteredItems: FileItem[]) => void;
  onSearchChange?: (query: string) => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  currentPath,
  canGoBack,
  canGoForward,
  viewSettings,
  items = [],
  onNavigate,
  onGoBack,
  onGoForward,
  onRefresh,
  onCreateFolder,
  onViewSettingsChange,
  onSearchResults,
  onSearchChange,
}) => {
  const [pathInputValue, setPathInputValue] = useState(currentPath);

  React.useEffect(() => {
    setPathInputValue(currentPath);
  }, [currentPath]);

  const handlePathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pathInputValue.trim() && pathInputValue !== currentPath) {
      onNavigate(pathInputValue.trim());
    }
  };

  const handleGoUp = () => {
    const parentPath = currentPath.split(/[/\\]/).slice(0, -1).join('\\') || 'C:\\';
    onNavigate(parentPath);
  };

  const handleGoHome = async () => {
    try {
      const homeDir = await window.fileSystemAPI.getHomeDirectory();
      onNavigate(homeDir);
    } catch (error) {
      console.error('Failed to navigate to home:', error);
    }
  };

  const handleCreateFolder = () => {
    const folderName = prompt('Enter folder name:');
    if (folderName && folderName.trim()) {
      onCreateFolder(folderName.trim());
    }
  };

  return (
    <NavigationContainer>
      <NavButton disabled={!canGoBack} onClick={onGoBack} title="Back">
        <FaArrowLeft />
      </NavButton>
      
      <NavButton disabled={!canGoForward} onClick={onGoForward} title="Forward">
        <FaArrowRight />
      </NavButton>
      
      <NavButton onClick={handleGoUp} title="Up">
        <FaArrowUp />
      </NavButton>
      
      <Separator />
      
      <NavButton onClick={onRefresh} title="Refresh">
        <FaRefresh />
      </NavButton>
      
      <NavButton onClick={handleGoHome} title="Home">
        <FaHome />
      </NavButton>
      
      <Separator />
      
      <NavButton onClick={handleCreateFolder} title="New Folder">
        <FaFolderPlus />
      </NavButton>
      
      <form onSubmit={handlePathSubmit} style={{ display: 'flex', minWidth: '300px' }}>
        <PathInput
          value={pathInputValue}
          onChange={(e) => setPathInputValue(e.target.value)}
          placeholder="Enter path..."
        />
      </form>
      
      {onSearchResults && onSearchChange && (
        <SearchBar
          items={items}
          onSearchResults={onSearchResults}
          onSearchChange={onSearchChange}
          placeholder="Search files..."
        />
      )}
      
      <ViewModeGroup>
        <ViewModeButton
          active={viewSettings.viewMode === 'grid'}
          onClick={() => onViewSettingsChange({ ...viewSettings, viewMode: 'grid' })}
          title="Grid View"
        >
          <FaTh />
        </ViewModeButton>
        <ViewModeButton
          active={viewSettings.viewMode === 'list'}
          onClick={() => onViewSettingsChange({ ...viewSettings, viewMode: 'list' })}
          title="List View"
        >
          <FaList />
        </ViewModeButton>
        <ViewModeButton
          active={viewSettings.viewMode === 'details'}
          onClick={() => onViewSettingsChange({ ...viewSettings, viewMode: 'details' })}
          title="Details View"
        >
          <FaThList />
        </ViewModeButton>
      </ViewModeGroup>
    </NavigationContainer>
  );
};