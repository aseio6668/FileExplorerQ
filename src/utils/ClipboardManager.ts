import { FileItem } from '@/types';

export interface ClipboardItem {
  items: FileItem[];
  operation: 'copy' | 'cut';
  timestamp: number;
}

class ClipboardManager {
  private clipboard: ClipboardItem | null = null;
  private listeners: Array<(clipboard: ClipboardItem | null) => void> = [];

  public copy(items: FileItem[]): void {
    this.clipboard = {
      items: [...items],
      operation: 'copy',
      timestamp: Date.now(),
    };
    this.notifyListeners();
  }

  public cut(items: FileItem[]): void {
    this.clipboard = {
      items: [...items],
      operation: 'cut',
      timestamp: Date.now(),
    };
    this.notifyListeners();
  }

  public paste(): ClipboardItem | null {
    if (!this.clipboard) return null;

    const clipboardData = { ...this.clipboard };
    
    // If it was a cut operation, clear the clipboard after paste
    if (this.clipboard.operation === 'cut') {
      this.clear();
    }

    return clipboardData;
  }

  public getClipboard(): ClipboardItem | null {
    return this.clipboard ? { ...this.clipboard } : null;
  }

  public canPaste(): boolean {
    return this.clipboard !== null;
  }

  public clear(): void {
    this.clipboard = null;
    this.notifyListeners();
  }

  public addListener(listener: (clipboard: ClipboardItem | null) => void): () => void {
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
        listener(this.clipboard);
      } catch (error) {
        console.error('Clipboard listener error:', error);
      }
    });
  }

  public getOperationDescription(): string {
    if (!this.clipboard) return '';
    
    const count = this.clipboard.items.length;
    const operation = this.clipboard.operation === 'copy' ? 'Copy' : 'Move';
    const itemText = count === 1 ? 'item' : 'items';
    
    return `${operation} ${count} ${itemText}`;
  }
}

export const clipboardManager = new ClipboardManager();