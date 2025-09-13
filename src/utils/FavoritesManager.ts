// Browser-compatible favorites manager - no Node.js dependencies

export interface FavoriteItem {
  id: string;
  name: string;
  path: string;
  addedAt: number;
  lastAccessed?: number;
  isValid?: boolean;
}

class FavoritesManager {
  private favorites: FavoriteItem[] = [];
  private listeners: Array<(favorites: FavoriteItem[]) => void> = [];
  private checkInterval: NodeJS.Timeout | null = null;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.loadFavorites();
    this.startValidityCheck();
  }

  private generateId(): string {
    return `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getBaseName(filePath: string): string {
    // Browser-compatible path basename extraction
    const normalized = filePath.replace(/\\/g, '/');
    const parts = normalized.split('/');
    return parts[parts.length - 1] || '';
  }

  private async loadFavorites(): Promise<void> {
    try {
      const savedFavorites = localStorage.getItem('fileexplorer-favorites');
      if (savedFavorites) {
        const parsed = JSON.parse(savedFavorites) as FavoriteItem[];
        this.favorites = parsed;
        await this.validateAllFavorites();
      }
    } catch (error) {
      console.warn('Failed to load favorites from localStorage:', error);
      this.favorites = [];
    }
  }

  private saveFavorites(): void {
    try {
      localStorage.setItem('fileexplorer-favorites', JSON.stringify(this.favorites));
    } catch (error) {
      console.error('Failed to save favorites to localStorage:', error);
    }
  }

  private debouncedSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveFavorites();
      this.saveTimeout = null;
    }, 500);
  }

  private async validatePath(path: string): Promise<boolean> {
    try {
      // Use the file system API exposed by the main process
      if (window.fileSystemAPI) {
        const content = await window.fileSystemAPI.getDirectoryContent(path);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private async validateAllFavorites(): Promise<void> {
    const validationPromises = this.favorites.map(async (favorite) => {
      const isValid = await this.validatePath(favorite.path);
      return { ...favorite, isValid };
    });

    const validatedFavorites = await Promise.all(validationPromises);
    const hasChanges = validatedFavorites.some(
      (fav, index) => fav.isValid !== this.favorites[index].isValid
    );

    this.favorites = validatedFavorites;

    if (hasChanges) {
      this.debouncedSave();
      this.notifyListeners();
    }
  }

  private startValidityCheck(): void {
    // Check favorites validity every 30 seconds
    this.checkInterval = setInterval(() => {
      this.validateAllFavorites();
    }, 30000);
  }

  private stopValidityCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  public addFavorite(folderPath: string, customName?: string): string {
    // Check if already exists
    const existingIndex = this.favorites.findIndex(fav => fav.path === folderPath);
    if (existingIndex !== -1) {
      // Update existing favorite
      this.favorites[existingIndex].lastAccessed = Date.now();
      if (customName) {
        this.favorites[existingIndex].name = customName;
      }
      this.debouncedSave();
      this.notifyListeners();
      return this.favorites[existingIndex].id;
    }

    const id = this.generateId();
    const name = customName || this.getBaseName(folderPath) || folderPath;
    
    const newFavorite: FavoriteItem = {
      id,
      name,
      path: folderPath,
      addedAt: Date.now(),
      lastAccessed: Date.now(),
      isValid: true
    };

    this.favorites.push(newFavorite);
    this.debouncedSave();
    this.notifyListeners();

    // Validate the new favorite asynchronously
    this.validatePath(folderPath).then(isValid => {
      if (!isValid) {
        const index = this.favorites.findIndex(fav => fav.id === id);
        if (index !== -1) {
          this.favorites[index].isValid = false;
          this.debouncedSave();
          this.notifyListeners();
        }
      }
    });

    return id;
  }

  public removeFavorite(favoriteId: string): boolean {
    const index = this.favorites.findIndex(fav => fav.id === favoriteId);
    if (index === -1) return false;

    this.favorites.splice(index, 1);
    this.debouncedSave();
    this.notifyListeners();
    return true;
  }

  public removeFavoriteByPath(folderPath: string): boolean {
    const index = this.favorites.findIndex(fav => fav.path === folderPath);
    if (index === -1) return false;

    this.favorites.splice(index, 1);
    this.debouncedSave();
    this.notifyListeners();
    return true;
  }

  public getFavorites(): FavoriteItem[] {
    return [...this.favorites].sort((a, b) => b.addedAt - a.addedAt);
  }

  public getValidFavorites(): FavoriteItem[] {
    return this.getFavorites().filter(fav => fav.isValid !== false);
  }

  public getInvalidFavorites(): FavoriteItem[] {
    return this.getFavorites().filter(fav => fav.isValid === false);
  }

  public isFavorite(folderPath: string): boolean {
    return this.favorites.some(fav => fav.path === folderPath);
  }

  public getFavoriteById(favoriteId: string): FavoriteItem | null {
    return this.favorites.find(fav => fav.id === favoriteId) || null;
  }

  public updateLastAccessed(favoriteId: string): void {
    const favorite = this.favorites.find(fav => fav.id === favoriteId);
    if (favorite) {
      favorite.lastAccessed = Date.now();
      this.debouncedSave();
    }
  }

  public updateFavoriteName(favoriteId: string, newName: string): boolean {
    const favorite = this.favorites.find(fav => fav.id === favoriteId);
    if (!favorite) return false;

    favorite.name = newName;
    this.debouncedSave();
    this.notifyListeners();
    return true;
  }

  public cleanupInvalidFavorites(): number {
    const invalidCount = this.favorites.filter(fav => fav.isValid === false).length;
    this.favorites = this.favorites.filter(fav => fav.isValid !== false);
    
    if (invalidCount > 0) {
      this.debouncedSave();
      this.notifyListeners();
    }
    
    return invalidCount;
  }

  public reorderFavorites(favoriteIds: string[]): boolean {
    if (favoriteIds.length !== this.favorites.length) return false;

    const reorderedFavorites: FavoriteItem[] = [];
    for (const id of favoriteIds) {
      const favorite = this.favorites.find(fav => fav.id === id);
      if (!favorite) return false;
      reorderedFavorites.push(favorite);
    }

    this.favorites = reorderedFavorites;
    this.debouncedSave();
    this.notifyListeners();
    return true;
  }

  public addListener(listener: (favorites: FavoriteItem[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getFavorites());
      } catch (error) {
        console.error('Favorites listener error:', error);
      }
    });
  }

  public exportFavorites(): string {
    return JSON.stringify(this.favorites, null, 2);
  }

  public importFavorites(favoritesJson: string): void {
    try {
      const importedFavorites = JSON.parse(favoritesJson) as FavoriteItem[];
      
      // Validate structure
      for (const fav of importedFavorites) {
        if (!fav.id || !fav.name || !fav.path || !fav.addedAt) {
          throw new Error('Invalid favorite structure');
        }
      }

      this.favorites = importedFavorites;
      this.debouncedSave();
      this.notifyListeners();
      
      // Validate all imported favorites
      this.validateAllFavorites();
    } catch (error) {
      throw new Error('Invalid favorites format');
    }
  }

  public getStatistics(): {
    total: number;
    valid: number;
    invalid: number;
    mostRecent?: FavoriteItem;
    mostAccessed?: FavoriteItem;
  } {
    const validFavorites = this.getValidFavorites();
    const invalidFavorites = this.getInvalidFavorites();
    
    const mostRecent = this.favorites.reduce((latest, current) => 
      current.addedAt > latest.addedAt ? current : latest
    );

    const mostAccessed = this.favorites
      .filter(fav => fav.lastAccessed)
      .reduce((mostUsed, current) => 
        (current.lastAccessed || 0) > (mostUsed.lastAccessed || 0) ? current : mostUsed
      );

    return {
      total: this.favorites.length,
      valid: validFavorites.length,
      invalid: invalidFavorites.length,
      mostRecent: this.favorites.length > 0 ? mostRecent : undefined,
      mostAccessed: mostAccessed.lastAccessed ? mostAccessed : undefined
    };
  }

  public destroy(): void {
    this.stopValidityCheck();
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.listeners = [];
  }
}

export const favoritesManager = new FavoritesManager();