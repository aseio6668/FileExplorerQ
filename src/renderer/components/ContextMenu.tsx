import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { FileItem } from '@/types';
import { clipboardManager } from '@/utils/ClipboardManager';
import {
  FaFolderOpen,
  FaCopy,
  FaCut,
  FaPaste,
  FaTrash,
  FaEdit,
  FaCog,
  FaFolderPlus,
  FaFileAlt,
  FaStar,
  FaRegStar,
  FaEye,
  FaShareAlt,
  FaDownload,
  FaCompress
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
  currentPath?: string;
  isEmpty?: boolean;
  favorites?: string[];
  onAction: (action: string, items: FileItem[], data?: any) => void;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  items,
  currentPath,
  isEmpty = false,
  favorites = [],
  onAction,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [canPaste, setCanPaste] = useState(false);
  
  useEffect(() => {
    const updateClipboardState = () => {
      setCanPaste(clipboardManager.canPaste());
    };
    
    updateClipboardState();
    const unsubscribe = clipboardManager.addListener(updateClipboardState);
    
    return unsubscribe;
  }, []);

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

  const handleAction = (action: string, data?: any) => {
    onAction(action, items, data);
  };

  const isSingleItem = items.length === 1;
  const hasDirectories = items.some(item => item.isDirectory);
  const hasFiles = items.some(item => !item.isDirectory);
  const isInFavorites = isSingleItem && favorites.includes(items[0].path);

  // If no items selected, show empty area context menu
  if (isEmpty || items.length === 0) {
    return (
      <MenuContainer ref={menuRef} x={x} y={y}>
        {canPaste && (
          <>
            <MenuItem onClick={() => handleAction('paste')}>
              <IconContainer>
                <FaPaste />
              </IconContainer>
              Paste ({clipboardManager.getOperationDescription()})
            </MenuItem>
            <MenuSeparator />
          </>
        )}
        
        <MenuItem onClick={() => handleAction('new-folder')}>
          <IconContainer>
            <FaFolderPlus />
          </IconContainer>
          New Folder
        </MenuItem>
        
        <MenuItem onClick={() => handleAction('new-file')}>
          <IconContainer>
            <FaFileAlt />
          </IconContainer>
          New File
        </MenuItem>

        <MenuSeparator />

        <MenuItem onClick={() => handleAction('refresh')}>
          <IconContainer>
            <FaEye />
          </IconContainer>
          Refresh
        </MenuItem>

        {currentPath && (
          <>
            <MenuSeparator />
            <MenuItem onClick={() => handleAction('add-to-favorites')}>
              <IconContainer>
                <FaStar />
              </IconContainer>
              Add to Favorites
            </MenuItem>
          </>
        )}

        <MenuSeparator />

        <MenuItem onClick={() => handleAction('properties')}>
          <IconContainer>
            <FaCog />
          </IconContainer>
          Folder Properties
        </MenuItem>
      </MenuContainer>
    );
  }

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

      {isSingleItem && !items[0].isDirectory && (
        <MenuItem onClick={() => handleAction('open-with')}>
          <IconContainer>
            <FaShareAlt />
          </IconContainer>
          Open with...
        </MenuItem>
      )}

      {isSingleItem && (
        <MenuItem onClick={() => handleAction('show-in-folder')}>
          <IconContainer>
            <FaEye />
          </IconContainer>
          Show in Explorer
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

      {canPaste && (
        <MenuItem onClick={() => handleAction('paste')}>
          <IconContainer>
            <FaPaste />
          </IconContainer>
          Paste ({clipboardManager.getOperationDescription()})
        </MenuItem>
      )}

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

      {isSingleItem && items[0].isDirectory && (
        <MenuItem onClick={() => handleAction(isInFavorites ? 'remove-from-favorites' : 'add-to-favorites')}>
          <IconContainer>
            {isInFavorites ? <FaStar /> : <FaRegStar />}
          </IconContainer>
          {isInFavorites ? 'Remove from Favorites' : 'Add to Favorites'}
        </MenuItem>
      )}

      {hasFiles && (
        <MenuItem onClick={() => handleAction('compress')}>
          <IconContainer>
            <FaCompress />
          </IconContainer>
          Compress to Archive
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