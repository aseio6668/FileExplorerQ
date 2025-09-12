import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FaHome, 
  FaDesktop, 
  FaFolder, 
  FaHdd as FaHardDrive,
  FaChevronRight,
  FaChevronDown
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

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

interface DriveInfo {
  letter: string;
  label?: string;
  type: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPath, onNavigate }) => {
  const [drives, setDrives] = useState<DriveInfo[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Mock drive detection for now - in a real implementation,
    // you'd use Node.js APIs to detect available drives
    setDrives([
      { letter: 'C:', label: 'Local Disk', type: 'fixed' },
      { letter: 'D:', label: 'Data', type: 'fixed' },
    ]);
  }, []);

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
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
            active={currentPath.startsWith(drive.letter)}
            onClick={() => onNavigate(`${drive.letter}\\`)}
          >
            <ItemIcon>
              <FaHardDrive />
            </ItemIcon>
            <ItemText>
              {drive.label ? `${drive.label} (${drive.letter})` : drive.letter}
            </ItemText>
          </SidebarItem>
        ))}
      </SidebarSection>

      <SidebarSection>
        <SectionTitle>Favorites</SectionTitle>
        <SidebarItem>
          <ItemIcon>
            <FaFolder />
          </ItemIcon>
          <ItemText>Documents</ItemText>
        </SidebarItem>
        <SidebarItem>
          <ItemIcon>
            <FaFolder />
          </ItemIcon>
          <ItemText>Downloads</ItemText>
        </SidebarItem>
        <SidebarItem>
          <ItemIcon>
            <FaFolder />
          </ItemIcon>
          <ItemText>Pictures</ItemText>
        </SidebarItem>
      </SidebarSection>
    </SidebarContainer>
  );
};