export class NavigationHistory {
  private history: string[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;

  public navigate(path: string, pushToHistory: boolean = true): void {
    if (pushToHistory) {
      // Remove any forward history when navigating to a new path
      this.history = this.history.slice(0, this.currentIndex + 1);
      
      // Add new path to history
      this.history.push(path);
      
      // Limit history size
      if (this.history.length > this.maxHistorySize) {
        this.history = this.history.slice(1);
      } else {
        this.currentIndex++;
      }
    } else {
      // Just update current position without adding to history
      this.currentIndex = Math.max(0, Math.min(this.currentIndex, this.history.length - 1));
    }
  }

  public canGoBack(): boolean {
    return this.currentIndex > 0;
  }

  public canGoForward(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  public goBack(): string | null {
    if (this.canGoBack()) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
    return null;
  }

  public goForward(): string | null {
    if (this.canGoForward()) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
    return null;
  }

  public getCurrentPath(): string | null {
    return this.currentIndex >= 0 && this.currentIndex < this.history.length
      ? this.history[this.currentIndex]
      : null;
  }

  public getHistory(): string[] {
    return [...this.history];
  }

  public clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  public getBackHistory(maxItems: number = 10): string[] {
    return this.history.slice(Math.max(0, this.currentIndex - maxItems), this.currentIndex);
  }

  public getForwardHistory(maxItems: number = 10): string[] {
    return this.history.slice(this.currentIndex + 1, this.currentIndex + 1 + maxItems);
  }
}