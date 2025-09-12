import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { TitleBar } from './TitleBar';
import { NavigationBar } from './NavigationBar';
import { Sidebar } from './Sidebar';
import { FileExplorer } from './FileExplorer';
import { StatusBar } from './StatusBar';
import { DirectoryContent, ViewSettings, FileItem } from '@/types';
import { NavigationHistory } from '@/utils/NavigationHistory';
import { logger } from '@/utils/Logger';
import { settingsManager } from '@/utils/SettingsManager';
import { fileOperationQueue, FileOperationType } from '@/utils/FileOperationQueue';
import { useKeyboardShortcuts, createFileExplorerShortcuts } from '../hooks/useKeyboardShortcuts';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #1e1e1e;
  color: #ffffff;
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const ContentArea = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
`;

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [directoryContent, setDirectoryContent] = useState<DirectoryContent | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [navigationHistory] = useState<NavigationHistory>(() => new NavigationHistory());
  const [canGoBack, setCanGoBack] = useState<boolean>(false);
  const [canGoForward, setCanGoForward] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredItems, setFilteredItems] = useState<FileItem[]>([]);
  const [allItems, setAllItems] = useState<FileItem[]>([]);
  const [viewSettings, setViewSettings] = useState<ViewSettings>({
    viewMode: 'grid',
    sortBy: 'name',
    sortOrder: 'asc',
    showHidden: false,
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load settings and apply them
        const settings = settingsManager.getSettings();
        setViewSettings(prev => ({
          ...prev,
          viewMode: settings.behavior.defaultViewMode,
          sortBy: settings.behavior.defaultSortBy,
          sortOrder: settings.behavior.defaultSortOrder,
          showHidden: settings.appearance.showHiddenFiles,
        }));

        // Navigate to home directory or last path if remember setting is enabled
        const homeDir = await window.fileSystemAPI.getHomeDirectory();
        const startPath = settings.navigation.rememberLastPath 
          ? localStorage.getItem('lastPath') || homeDir
          : homeDir;
          
        setCurrentPath(startPath);
        await loadDirectory(startPath);
        
        logger.info('Application initialized', { startPath, settings: settings.behavior });
      } catch (error: any) {
        const errorMessage = 'Failed to initialize application';
        setError(errorMessage);
        logger.error('Initialization error', { error: error.message });
      }
    };

    initializeApp();
  }, []);

  const updateNavigationState = useCallback(() => {
    setCanGoBack(navigationHistory.canGoBack());
    setCanGoForward(navigationHistory.canGoForward());
  }, [navigationHistory]);

  const loadDirectory = useCallback(async (path: string, addToHistory: boolean = true) => {
    setLoading(true);
    setError('');
    
    logger.info('Loading directory', { path, addToHistory });
    
    try {
      const content = await window.fileSystemAPI.getDirectoryContent(path);
      setDirectoryContent(content);
      setCurrentPath(path);
      setSelectedItems([]);
      
      // Combine files and directories for search and filtering
      const allItems = [...content.directories, ...content.files];
      setAllItems(allItems);
      setFilteredItems(allItems);
      
      // Save last path for next session if setting is enabled
      const settings = settingsManager.getSettings();
      if (settings.navigation.rememberLastPath) {
        localStorage.setItem('lastPath', path);
      }
      
      if (addToHistory) {
        navigationHistory.navigate(path);
        updateNavigationState();
      }
      
      logger.info('Directory loaded successfully', { path, fileCount: content.files.length, dirCount: content.directories.length });
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error occurred';
      setError(errorMessage);
      logger.error('Directory load failed', { path, error: errorMessage });
      
      // If navigation failed and we have history, don't add to history
      if (addToHistory && navigationHistory.getCurrentPath()) {
        // Optionally go back to previous path if current navigation fails
        // This could be configurable based on user preferences
      }
    } finally {
      setLoading(false);
    }
  }, [navigationHistory, updateNavigationState]);

  const handleNavigation = useCallback((path: string) => {
    loadDirectory(path, true);
  }, [loadDirectory]);

  const handleGoBack = useCallback(() => {
    const previousPath = navigationHistory.goBack();
    if (previousPath) {
      loadDirectory(previousPath, false);
      updateNavigationState();
      logger.info('Navigated back', { path: previousPath });
    }
  }, [navigationHistory, loadDirectory, updateNavigationState]);

  const handleGoForward = useCallback(() => {
    const nextPath = navigationHistory.goForward();
    if (nextPath) {
      loadDirectory(nextPath, false);
      updateNavigationState();
      logger.info('Navigated forward', { path: nextPath });
    }
  }, [navigationHistory, loadDirectory, updateNavigationState]);

  const handleItemDoubleClick = useCallback(async (path: string, isDirectory: boolean) => {
    if (isDirectory) {
      await loadDirectory(path, true);
    } else {
      try {
        await window.fileSystemAPI.openFile(path);
        logger.info('File opened', { path });
      } catch (error: any) {
        const errorMessage = `Failed to open file: ${error}`;
        setError(errorMessage);
        logger.error('File open failed', { path, error: errorMessage });
      }
    }
  }, [loadDirectory]);

  const handleCreateFolder = useCallback(async (folderName?: string) => {
    const name = folderName || prompt('Enter folder name:');
    if (!name || !name.trim()) return;

    const operationId = fileOperationQueue.addOperation({
      type: FileOperationType.CREATE_FOLDER,
      destination: currentPath,
      newName: name.trim(),
    });

    logger.info('Create folder operation queued', { operationId, name, path: currentPath });
  }, [currentPath]);

  const handleDeleteItems = useCallback(async (itemPaths?: string[]) => {
    const pathsToDelete = itemPaths || selectedItems;
    if (pathsToDelete.length === 0) return;

    const settings = settingsManager.getSettings();
    if (settings.behavior.confirmDelete) {
      const confirmed = window.confirm(`Are you sure you want to delete ${pathsToDelete.length} item(s)?`);
      if (!confirmed) return;
    }

    const operationId = fileOperationQueue.addOperation({
      type: FileOperationType.DELETE,
      source: pathsToDelete,
    });

    logger.info('Delete operation queued', { operationId, count: pathsToDelete.length });
    setSelectedItems([]);
  }, [selectedItems]);

  const handleRenameItem = useCallback(async (oldPath?: string, newName?: string) => {
    const pathToRename = oldPath || (selectedItems.length === 1 ? selectedItems[0] : '');
    if (!pathToRename) return;

    const currentName = pathToRename.split(/[/\\]/).pop() || '';
    const name = newName || prompt('Enter new name:', currentName);
    if (!name || name.trim() === currentName) return;

    const operationId = fileOperationQueue.addOperation({
      type: FileOperationType.RENAME,
      source: [pathToRename],
      newName: name.trim(),
    });

    logger.info('Rename operation queued', { operationId, oldPath: pathToRename, newName: name });
  }, [selectedItems]);

  const handleSelectAll = useCallback(() => {
    setSelectedItems(filteredItems.map(item => item.path));
  }, [filteredItems]);

  const handleCopy = useCallback(() => {
    // TODO: Implement copy to clipboard
    logger.info('Copy operation triggered', { selectedCount: selectedItems.length });
  }, [selectedItems]);

  const handleCut = useCallback(() => {
    // TODO: Implement cut to clipboard
    logger.info('Cut operation triggered', { selectedCount: selectedItems.length });
  }, [selectedItems]);

  const handlePaste = useCallback(() => {
    // TODO: Implement paste from clipboard
    logger.info('Paste operation triggered', { currentPath });
  }, [currentPath]);

  const handleSearchFocus = useCallback(() => {
    // TODO: Focus search input
    logger.info('Search focus triggered');
  }, []);

  const handleToggleView = useCallback(() => {
    const viewModes: Array<'grid' | 'list' | 'details'> = ['grid', 'list', 'details'];
    const currentIndex = viewModes.indexOf(viewSettings.viewMode);
    const nextIndex = (currentIndex + 1) % viewModes.length;
    const nextMode = viewModes[nextIndex];
    
    setViewSettings(prev => ({ ...prev, viewMode: nextMode }));
    logger.info('View mode toggled', { from: viewSettings.viewMode, to: nextMode });
  }, [viewSettings.viewMode]);

  const handleGoUp = useCallback(() => {
    const parentPath = currentPath.split(/[/\\]/).slice(0, -1).join('\\') || 'C:\\';
    handleNavigation(parentPath);
  }, [currentPath, handleNavigation]);

  const handleGoHome = useCallback(async () => {
    try {
      const homeDir = await window.fileSystemAPI.getHomeDirectory();
      handleNavigation(homeDir);
    } catch (error) {
      logger.error('Failed to navigate to home', { error });
    }
  }, [handleNavigation]);

  // Setup keyboard shortcuts
  const shortcuts = createFileExplorerShortcuts({
    onRefresh: () => loadDirectory(currentPath, false),
    onGoBack: handleGoBack,
    onGoForward: handleGoForward,
    onGoUp: handleGoUp,
    onGoHome: handleGoHome,
    onCreateFolder: handleCreateFolder,
    onDelete: handleDeleteItems,
    onRename: handleRenameItem,
    onCopy: handleCopy,
    onCut: handleCut,
    onPaste: handlePaste,
    onSelectAll: handleSelectAll,
    onSearch: handleSearchFocus,
    onToggleView: handleToggleView,
  });

  useKeyboardShortcuts({ shortcuts, enabled: true });

  // Handle search results
  const handleSearchResults = useCallback((results: FileItem[]) => {
    setFilteredItems(results);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // File operation queue monitoring
  useEffect(() => {
    const operationCallback = (operation: any) => {
      if (operation.status === 'completed') {
        // Refresh directory when operations complete
        loadDirectory(currentPath, false);
      }
    };

    const unsubscribe = fileOperationQueue.addOperationCallback(operationCallback);
    return unsubscribe;
  }, [currentPath, loadDirectory]);

  // Use filtered items for display
  const itemsToDisplay = searchQuery.trim() ? filteredItems : allItems;
  const displayContent = directoryContent ? {
    ...directoryContent,
    files: itemsToDisplay.filter(item => !item.isDirectory),
    directories: itemsToDisplay.filter(item => item.isDirectory),
  } : null;

  return (
    <AppContainer>
      <TitleBar currentPath={currentPath} />
      <NavigationBar
        currentPath={currentPath}
        items={allItems}
        onNavigate={handleNavigation}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
        onRefresh={() => loadDirectory(currentPath, false)}
        onCreateFolder={handleCreateFolder}
        onSearchResults={handleSearchResults}
        onSearchChange={handleSearchChange}
      />
      <MainContent>
        <Sidebar
          currentPath={currentPath}
          onNavigate={handleNavigation}
        />
        <ContentArea>
          <FileExplorer
            directoryContent={displayContent}
            loading={loading}
            error={error}
            selectedItems={selectedItems}
            viewSettings={viewSettings}
            onItemDoubleClick={handleItemDoubleClick}
            onSelectionChange={setSelectedItems}
            onViewSettingsChange={setViewSettings}
            onDeleteItems={handleDeleteItems}
            onRenameItem={handleRenameItem}
          />
          <StatusBar
            itemCount={itemsToDisplay.length}
            selectedCount={selectedItems.length}
            currentPath={currentPath}
          />
        </ContentArea>
      </MainContent>
    </AppContainer>
  );
};