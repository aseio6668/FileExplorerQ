import { useEffect, useCallback } from 'react';
import { logger } from '@/utils/Logger';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const matchingShortcut = shortcuts.find(shortcut => {
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = !!shortcut.ctrl === event.ctrlKey;
      const altMatch = !!shortcut.alt === event.altKey;
      const shiftMatch = !!shortcut.shift === event.shiftKey;
      
      return keyMatch && ctrlMatch && altMatch && shiftMatch;
    });

    if (matchingShortcut) {
      event.preventDefault();
      event.stopPropagation();
      
      logger.debug('Keyboard shortcut triggered', { 
        key: matchingShortcut.key,
        ctrl: matchingShortcut.ctrl,
        alt: matchingShortcut.alt,
        shift: matchingShortcut.shift,
        description: matchingShortcut.description
      });
      
      matchingShortcut.action();
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);

  return {
    shortcuts,
    enabled,
  };
};

// Common keyboard shortcuts for file explorer
export const createFileExplorerShortcuts = (actions: {
  onRefresh: () => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onGoUp: () => void;
  onGoHome: () => void;
  onCreateFolder: () => void;
  onDelete: () => void;
  onRename: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onSelectAll: () => void;
  onSearch: () => void;
  onToggleView: () => void;
}): KeyboardShortcut[] => [
  // Navigation
  { key: 'F5', action: actions.onRefresh, description: 'Refresh current directory' },
  { key: 'ArrowLeft', alt: true, action: actions.onGoBack, description: 'Go back' },
  { key: 'ArrowRight', alt: true, action: actions.onGoForward, description: 'Go forward' },
  { key: 'ArrowUp', alt: true, action: actions.onGoUp, description: 'Go up one level' },
  { key: 'Home', alt: true, action: actions.onGoHome, description: 'Go to home directory' },
  
  // File operations
  { key: 'n', ctrl: true, shift: true, action: actions.onCreateFolder, description: 'Create new folder' },
  { key: 'Delete', action: actions.onDelete, description: 'Delete selected items' },
  { key: 'F2', action: actions.onRename, description: 'Rename selected item' },
  { key: 'c', ctrl: true, action: actions.onCopy, description: 'Copy selected items' },
  { key: 'x', ctrl: true, action: actions.onCut, description: 'Cut selected items' },
  { key: 'v', ctrl: true, action: actions.onPaste, description: 'Paste items' },
  
  // Selection
  { key: 'a', ctrl: true, action: actions.onSelectAll, description: 'Select all items' },
  
  // Search and view
  { key: 'f', ctrl: true, action: actions.onSearch, description: 'Focus search' },
  { key: 'F3', action: actions.onToggleView, description: 'Toggle view mode' },
  
  // Accessibility
  { key: 'F1', action: () => {}, description: 'Show help' },
];

// Hook for handling arrow key navigation in file grids
export const useArrowKeyNavigation = (
  items: any[],
  selectedItems: string[],
  onSelectionChange: (items: string[]) => void,
  getItemPath: (item: any) => string,
  itemsPerRow?: number
) => {
  const handleArrowNavigation = useCallback((event: KeyboardEvent) => {
    if (items.length === 0) return;

    const currentSelection = selectedItems[selectedItems.length - 1];
    const currentIndex = currentSelection 
      ? items.findIndex(item => getItemPath(item) === currentSelection)
      : 0;

    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowDown':
        if (itemsPerRow && currentIndex + itemsPerRow < items.length) {
          newIndex = currentIndex + itemsPerRow;
        } else if (!itemsPerRow && currentIndex < items.length - 1) {
          newIndex = currentIndex + 1;
        }
        break;
        
      case 'ArrowUp':
        if (itemsPerRow && currentIndex - itemsPerRow >= 0) {
          newIndex = currentIndex - itemsPerRow;
        } else if (!itemsPerRow && currentIndex > 0) {
          newIndex = currentIndex - 1;
        }
        break;
        
      case 'ArrowRight':
        if (currentIndex < items.length - 1) {
          newIndex = currentIndex + 1;
        }
        break;
        
      case 'ArrowLeft':
        if (currentIndex > 0) {
          newIndex = currentIndex - 1;
        }
        break;
        
      case 'Home':
        newIndex = 0;
        break;
        
      case 'End':
        newIndex = items.length - 1;
        break;
        
      default:
        return;
    }

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < items.length) {
      event.preventDefault();
      const newPath = getItemPath(items[newIndex]);
      
      if (event.shiftKey && selectedItems.length > 0) {
        // Range selection
        const start = Math.min(currentIndex, newIndex);
        const end = Math.max(currentIndex, newIndex);
        const rangeSelection = items.slice(start, end + 1).map(getItemPath);
        onSelectionChange([...new Set([...selectedItems, ...rangeSelection])]);
      } else {
        // Single selection
        onSelectionChange([newPath]);
      }
    }
  }, [items, selectedItems, onSelectionChange, getItemPath, itemsPerRow]);

  useEffect(() => {
    document.addEventListener('keydown', handleArrowNavigation);
    return () => document.removeEventListener('keydown', handleArrowNavigation);
  }, [handleArrowNavigation]);
};