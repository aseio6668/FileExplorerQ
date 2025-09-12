import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FileItem } from '@/types';
import {
  FaFolderOpen,
  FaCopy,
  FaCut,
  FaTrash,
  FaEdit,
  FaCog
} from 'react-icons/fa';

const MenuContainer = styled.div<{ x: number; y: number }>`
  position: fixed;
  top: ${props => props.y}px;
  left: ${props => props.x}px;
  background: #3c3c3c;
  border: 1px solid #454545;
  border-radius: 4px;
  padding: 4px 0;
  min-width: 200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
`;

const MenuItem = styled.div<{ disabled?: boolean }>`
  padding: 8px 16px;
  cursor: ${props => props.disabled ? 'default' : 'pointer'};
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: ${props => props.disabled ? '#666' : '#ffffff'};
  
  &:hover {
    background: ${props => props.disabled ? 'transparent' : '#094771'};
  }
`;

const MenuSeparator = styled.div`
  height: 1px;
  background: #454545;
  margin: 4px 0;
`;

const IconContainer = styled.div`
  width: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

interface ContextMenuProps {
  x: number;
  y: number;
  items: FileItem[];
  onAction: (action: string, items: FileItem[]) => void;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  items,
  onAction,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position if menu would go off screen
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (rect.right > viewportWidth) {
        adjustedX = x - rect.width;
      }

      if (rect.bottom > viewportHeight) {
        adjustedY = y - rect.height;
      }

      if (adjustedX !== x || adjustedY !== y) {
        menuRef.current.style.left = `${Math.max(0, adjustedX)}px`;
        menuRef.current.style.top = `${Math.max(0, adjustedY)}px`;
      }
    }
  }, [x, y]);

  const handleAction = (action: string) => {
    onAction(action, items);
  };

  const isSingleItem = items.length === 1;
  const hasDirectories = items.some(item => item.isDirectory);
  const hasFiles = items.some(item => !item.isDirectory);

  return (
    <MenuContainer ref={menuRef} x={x} y={y}>
      {isSingleItem && (
        <MenuItem onClick={() => handleAction('open')}>
          <IconContainer>
            <FaFolderOpen />
          </IconContainer>
          Open
        </MenuItem>
      )}

      <MenuSeparator />

      <MenuItem onClick={() => handleAction('copy')}>
        <IconContainer>
          <FaCopy />
        </IconContainer>
        Copy
      </MenuItem>

      <MenuItem onClick={() => handleAction('cut')}>
        <IconContainer>
          <FaCut />
        </IconContainer>
        Cut
      </MenuItem>

      <MenuSeparator />

      <MenuItem onClick={() => handleAction('delete')}>
        <IconContainer>
          <FaTrash />
        </IconContainer>
        Delete
      </MenuItem>

      {isSingleItem && (
        <MenuItem onClick={() => handleAction('rename')}>
          <IconContainer>
            <FaEdit />
          </IconContainer>
          Rename
        </MenuItem>
      )}

      <MenuSeparator />

      <MenuItem onClick={() => handleAction('properties')}>
        <IconContainer>
          <FaCog />
        </IconContainer>
        Properties
      </MenuItem>
    </MenuContainer>
  );
};