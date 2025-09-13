import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { favoritesManager } from '@/utils/FavoritesManager';
import type { FavoriteItem as FavoriteItemType } from '@/utils/FavoritesManager';
import type { Drive } from '@/types';
import { 
  FaHome, 
  FaDesktop, 
  FaFolder, 
  FaHdd as FaHardDrive,
  FaUsb,
  FaCompactDisc,
  FaChevronRight,
  FaChevronDown,
  FaStar,
  FaRegStar,
  FaTimes,
  FaExclamationTriangle,
  FaTrash
} from 'react-icons/fa';

const SidebarContainer = styled.div`
  width: 250px;
  background-color: #252526;
  border-right: 1px solid #404040;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

const SidebarSection = styled.div`
  padding: 12px 0;
  border-bottom: 1px solid #404040;
`;

const SectionTitle = styled.div`
  font-size: 12px;
  color: #a0a0a0;
  font-weight: 600;
  text-transform: uppercase;
  padding: 0 16px 8px;
  letter-spacing: 0.5px;
`;

const SidebarItem = styled.div<{ active?: boolean; level?: number }>`
  padding: 8px 16px;
  padding-left: ${props => 16 + (props.level || 0) * 20}px;
  display: flex;
  align-items: center;
  cursor: pointer;
  color: ${props => props.active ? '#ffffff' : '#cccccc'};
  background-color: ${props => props.active ? '#094771' : 'transparent'};
  
  &:hover {
    background-color: ${props => props.active ? '#0e639c' : '#2a2d2e'};
  }
`;

const ItemIcon = styled.div`
  margin-right: 8px;
  display: flex;
  align-items: center;
  font-size: 14px;
`;

const ItemText = styled.span`
  font-size: 13px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ExpandIcon = styled.div<{ expanded?: boolean }>`
  margin-right: 4px;
  display: flex;
  align-items: center;
  font-size: 10px;
  color: #a0a0a0;
  transform: ${props => props.expanded ? 'rotate(90deg)' : 'none'};
  transition: transform 0.2s ease;
`;

const FavoriteItem = styled.div<{ active?: boolean; invalid?: boolean }>`
  padding: 8px 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
  color: ${props => {
    if (props.invalid) return '#cc6666';
    return props.active ? '#ffffff' : '#cccccc';
  }};
  background-color: ${props => props.active ? '#094771' : 'transparent'};
  position: relative;
  
  &:hover {
    background-color: ${props => props.active ? '#0e639c' : '#2a2d2e'};
    
    .favorite-actions {
      opacity: 1;
    }
  }
`;

const FavoriteActions = styled.div`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
  padding: 2px;
  font-size: 12px;
  
  &:hover {
    color: #ffffff;
  }
`;

const InvalidBadge = styled.div`
  margin-left: auto;
  margin-right: 8px;
  color: #cc6666;
  font-size: 12px;
`;

const CleanupButton = styled.button`
  background: none;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
  padding: 4px 16px;
  font-size: 11px;
  text-align: left;
  width: 100%;
  
  &:hover {
    color: #ffffff;
    background-color: #2a2d2e;
  }
`;

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate }) => {
  const [drives, setDrives] = useState<Drive[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<FavoriteItemType[]>([]);

  useEffect(() => {
    // Load real drive information
    const loadDrives = async () => {
      try {
        const detectedDrives = await window.fileSystemAPI.getAvailableDrives();
        console.log('Detected drives:', detectedDrives);
        setDrives(detectedDrives);
      } catch (error) {
        console.error('Failed to load drives:', error);
        // Fallback to basic C: drive if detection fails
        setDrives([{
          letter: 'C',
          path: 'C:\\',
          type: 'System',
          isReady: true,
          name: 'System (C:)'
        }]);
      }
    };
    
    loadDrives();
  }, []);

  useEffect(() => {
    const updateFavorites = (newFavorites: FavoriteItemType[]) => {
      setFavorites(newFavorites);
    };
    
    updateFavorites(favoritesManager.getFavorites());
    const unsubscribe = favoritesManager.addListener(updateFavorites);
    
    return unsubscribe;
  }, []);

  const getDriveIcon = (drive: Drive) => {
    if (drive.type === 'System') {
      return <FaHardDrive />;
    } else if (drive.type === 'Removable/External') {
      return <FaUsb />;
    } else if (drive.type === 'Local') {
      return <FaHardDrive />;
    } else {
      return <FaCompactDisc />;
    }
  };

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFavoriteClick = (favorite: FavoriteItemType) => {
    if (favorite.isValid !== false) {
      favoritesManager.updateLastAccessed(favorite.id);
      onNavigate(favorite.path);
    }
  };

  const handleRemoveFavorite = (e: React.MouseEvent, favoriteId: string) => {
    e.stopPropagation();
    favoritesManager.removeFavorite(favoriteId);
  };

  const handleCleanupInvalidFavorites = () => {
    const removed = favoritesManager.cleanupInvalidFavorites();
    if (removed > 0) {
      console.log(`Removed ${removed} invalid favorites`);
    }
  };

  const getQuickAccessItems = () => [
    {
      name: 'Home',
      path: 'HOME',
      icon: <FaHome />,
      onClick: async () => {
        try {
          const homeDir = await window.fileSystemAPI.getHomeDirectory();
          onNavigate(homeDir);
        } catch (error) {
          console.error('Failed to navigate to home:', error);
        }
      }
    },
    {
      name: 'Desktop',
      path: 'DESKTOP',
      icon: <FaDesktop />,
      onClick: async () => {
        try {
          const homeDir = await window.fileSystemAPI.getHomeDirectory();
          onNavigate(`${homeDir}\\Desktop`);
        } catch (error) {
          console.error('Failed to navigate to desktop:', error);
        }
      }
    }
  ];

  const validFavorites = favorites.filter(fav => fav.isValid !== false);
  const invalidFavorites = favorites.filter(fav => fav.isValid === false);

  return (
    <SidebarContainer>
      <SidebarSection>
        <SectionTitle>Quick Access</SectionTitle>
        {getQuickAccessItems().map(item => (
          <SidebarItem
            key={item.path}
            active={currentPath === item.path}
            onClick={item.onClick}
          >
            <ItemIcon>{item.icon}</ItemIcon>
            <ItemText>{item.name}</ItemText>
          </SidebarItem>
        ))}
      </SidebarSection>

      <SidebarSection>
        <SectionTitle>This PC</SectionTitle>
        {drives.map(drive => (
          <SidebarItem
            key={drive.letter}
            active={currentPath.startsWith(drive.path)}
            onClick={() => drive.isReady && onNavigate(drive.path)}
            style={{ 
              opacity: drive.isReady ? 1 : 0.6,
              cursor: drive.isReady ? 'pointer' : 'not-allowed'
            }}
          >
            <ItemIcon>
              {getDriveIcon(drive)}
            </ItemIcon>
            <ItemText title={`${drive.name} - ${drive.isReady ? 'Ready' : 'Not Ready'}`}>
              {drive.name}
            </ItemText>
            {!drive.isReady && (
              <InvalidBadge>Not Ready</InvalidBadge>
            )}
          </SidebarItem>
        ))}
      </SidebarSection>

      <SidebarSection>
        <SectionTitle>Favorites</SectionTitle>
        
        {validFavorites.length === 0 && invalidFavorites.length === 0 && (
          <SidebarItem>
            <ItemIcon>
              <FaRegStar />
            </ItemIcon>
            <ItemText>No favorites yet</ItemText>
          </SidebarItem>
        )}

        {validFavorites.map(favorite => (
          <FavoriteItem
            key={favorite.id}
            active={currentPath === favorite.path}
            onClick={() => handleFavoriteClick(favorite)}
          >
            <ItemIcon>
              <FaStar />
            </ItemIcon>
            <ItemText>{favorite.name}</ItemText>
            
            <FavoriteActions className="favorite-actions">
              <ActionButton
                onClick={(e) => handleRemoveFavorite(e, favorite.id)}
                title="Remove from favorites"
              >
                <FaTimes />
              </ActionButton>
            </FavoriteActions>
          </FavoriteItem>
        ))}

        {invalidFavorites.length > 0 && (
          <>
            <SidebarItem style={{ color: '#666', fontSize: '12px', paddingTop: '12px' }}>
              Invalid Favorites:
            </SidebarItem>
            
            {invalidFavorites.map(favorite => (
              <FavoriteItem
                key={favorite.id}
                invalid
              >
                <ItemIcon>
                  <FaExclamationTriangle />
                </ItemIcon>
                <ItemText>{favorite.name}</ItemText>
                <InvalidBadge>Missing</InvalidBadge>
                
                <FavoriteActions className="favorite-actions">
                  <ActionButton
                    onClick={(e) => handleRemoveFavorite(e, favorite.id)}
                    title="Remove invalid favorite"
                  >
                    <FaTimes />
                  </ActionButton>
                </FavoriteActions>
              </FavoriteItem>
            ))}
            
            <CleanupButton
              onClick={handleCleanupInvalidFavorites}
              title="Remove all invalid favorites"
            >
              <FaTrash style={{ marginRight: '8px' }} />
              Clean up invalid favorites
            </CleanupButton>
          </>
        )}
      </SidebarSection>
    </SidebarContainer>
  );
};