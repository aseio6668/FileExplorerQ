export interface AppSettings {
  appearance: {
    theme: 'dark' | 'light';
    fontSize: 'small' | 'medium' | 'large';
    showHiddenFiles: boolean;
    showFileExtensions: boolean;
    showThumbnails: boolean;
  };
  behavior: {
    defaultViewMode: 'grid' | 'list' | 'details';
    defaultSortBy: 'name' | 'size' | 'modified' | 'type';
    defaultSortOrder: 'asc' | 'desc';
    doubleClickToOpen: boolean;
    confirmDelete: boolean;
    useVirtualScrolling: boolean;
    maxItemsBeforeVirtualization: number;
  };
  navigation: {
    rememberLastPath: boolean;
    showNavigationButtons: boolean;
    showAddressBar: boolean;
    showBreadcrumbs: boolean;
    maxHistorySize: number;
  };
  performance: {
    enableFilePreview: boolean;
    preloadNextDirectory: boolean;
    cacheSize: number;
    debounceSearchMs: number;
  };
  shortcuts: {
    [key: string]: {
      key: string;
      ctrl?: boolean;
      alt?: boolean;
      shift?: boolean;
      enabled: boolean;
    };
  };
  advanced: {
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    enableTelemetry: boolean;
    autoBackup: boolean;
    backupInterval: number;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  appearance: {
    theme: 'dark',
    fontSize: 'medium',
    showHiddenFiles: false,
    showFileExtensions: true,
    showThumbnails: true,
  },
  behavior: {
    defaultViewMode: 'grid',
    defaultSortBy: 'name',
    defaultSortOrder: 'asc',
    doubleClickToOpen: true,
    confirmDelete: true,
    useVirtualScrolling: true,
    maxItemsBeforeVirtualization: 1000,
  },
  navigation: {
    rememberLastPath: true,
    showNavigationButtons: true,
    showAddressBar: true,
    showBreadcrumbs: false,
    maxHistorySize: 50,
  },
  performance: {
    enableFilePreview: true,
    preloadNextDirectory: false,
    cacheSize: 100,
    debounceSearchMs: 300,
  },
  shortcuts: {
    refresh: { key: 'F5', enabled: true },
    goBack: { key: 'ArrowLeft', alt: true, enabled: true },
    goForward: { key: 'ArrowRight', alt: true, enabled: true },
    goUp: { key: 'ArrowUp', alt: true, enabled: true },
    goHome: { key: 'Home', alt: true, enabled: true },
    newFolder: { key: 'n', ctrl: true, shift: true, enabled: true },
    delete: { key: 'Delete', enabled: true },
    rename: { key: 'F2', enabled: true },
    copy: { key: 'c', ctrl: true, enabled: true },
    cut: { key: 'x', ctrl: true, enabled: true },
    paste: { key: 'v', ctrl: true, enabled: true },
    selectAll: { key: 'a', ctrl: true, enabled: true },
    search: { key: 'f', ctrl: true, enabled: true },
    toggleView: { key: 'F3', enabled: true },
  },
  advanced: {
    logLevel: 'info',
    enableTelemetry: false,
    autoBackup: true,
    backupInterval: 300000, // 5 minutes
  },
};

class SettingsManager {
  private settings: AppSettings;
  private listeners: Array<(settings: AppSettings) => void> = [];
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.settings = this.loadSettings();
  }

  private loadSettings(): AppSettings {
    try {
      const savedSettings = localStorage.getItem('fileexplorer-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        return this.mergeSettings(DEFAULT_SETTINGS, parsed);
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    }
    return { ...DEFAULT_SETTINGS };
  }

  private mergeSettings(defaults: AppSettings, saved: Partial<AppSettings>): AppSettings {
    const merged = { ...defaults };
    
    for (const [key, value] of Object.entries(saved)) {
      if (key in defaults && typeof value === 'object' && value !== null) {
        (merged as any)[key] = { ...defaults[key as keyof AppSettings], ...value };
      } else if (key in defaults) {
        (merged as any)[key] = value;
      }
    }
    
    return merged;
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('fileexplorer-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }

  private debouncedSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveSettings();
      this.saveTimeout = null;
    }, 500);
  }

  public getSettings(): AppSettings {
    return { ...this.settings };
  }

  public getSetting<K extends keyof AppSettings>(category: K): AppSettings[K] {
    return { ...this.settings[category] };
  }

  public updateSettings(updates: Partial<AppSettings>): void {
    const oldSettings = { ...this.settings };
    
    for (const [key, value] of Object.entries(updates)) {
      if (key in this.settings && typeof value === 'object' && value !== null) {
        (this.settings as any)[key] = { ...this.settings[key as keyof AppSettings], ...value };
      } else if (key in this.settings) {
        (this.settings as any)[key] = value;
      }
    }
    
    this.debouncedSave();
    this.notifyListeners(oldSettings);
  }

  public updateSetting<K extends keyof AppSettings>(
    category: K,
    updates: Partial<AppSettings[K]>
  ): void {
    const oldSettings = { ...this.settings };
    this.settings[category] = { ...this.settings[category], ...updates };
    this.debouncedSave();
    this.notifyListeners(oldSettings);
  }

  public resetToDefaults(): void {
    const oldSettings = { ...this.settings };
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
    this.notifyListeners(oldSettings);
  }

  public resetCategory<K extends keyof AppSettings>(category: K): void {
    const oldSettings = { ...this.settings };
    this.settings[category] = { ...DEFAULT_SETTINGS[category] };
    this.debouncedSave();
    this.notifyListeners(oldSettings);
  }

  public addListener(listener: (settings: AppSettings) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(oldSettings: AppSettings): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.settings);
      } catch (error) {
        console.error('Settings listener error:', error);
      }
    });
  }

  public exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  public importSettings(settingsJson: string): void {
    try {
      const importedSettings = JSON.parse(settingsJson);
      const validatedSettings = this.mergeSettings(DEFAULT_SETTINGS, importedSettings);
      
      const oldSettings = { ...this.settings };
      this.settings = validatedSettings;
      this.saveSettings();
      this.notifyListeners(oldSettings);
    } catch (error) {
      throw new Error('Invalid settings format');
    }
  }

  public validateSettings(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate theme
    if (!['dark', 'light'].includes(this.settings.appearance.theme)) {
      errors.push('Invalid theme setting');
    }
    
    // Validate view mode
    if (!['grid', 'list', 'details'].includes(this.settings.behavior.defaultViewMode)) {
      errors.push('Invalid default view mode');
    }
    
    // Validate numeric values
    if (this.settings.behavior.maxItemsBeforeVirtualization < 10) {
      errors.push('Max items before virtualization must be at least 10');
    }
    
    if (this.settings.navigation.maxHistorySize < 1) {
      errors.push('Max history size must be at least 1');
    }
    
    if (this.settings.performance.cacheSize < 10) {
      errors.push('Cache size must be at least 10');
    }
    
    if (this.settings.performance.debounceSearchMs < 0) {
      errors.push('Search debounce must be non-negative');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const settingsManager = new SettingsManager();