import { logger } from './Logger';

export enum FileOperationType {
  COPY = 'copy',
  MOVE = 'move',
  DELETE = 'delete',
  CREATE_FOLDER = 'createFolder',
  RENAME = 'rename',
}

export enum OperationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'inProgress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface FileOperation {
  id: string;
  type: FileOperationType;
  status: OperationStatus;
  source?: string[];
  destination?: string;
  newName?: string;
  progress: number;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedTimeRemaining?: number;
  bytesProcessed?: number;
  totalBytes?: number;
}

export interface OperationProgress {
  operationId: string;
  progress: number;
  bytesProcessed: number;
  totalBytes: number;
  estimatedTimeRemaining: number;
  currentFile?: string;
}

type OperationCallback = (operation: FileOperation) => void;
type ProgressCallback = (progress: OperationProgress) => void;

class FileOperationQueue {
  private operations: Map<string, FileOperation> = new Map();
  private activeOperations: Set<string> = new Set();
  private maxConcurrentOperations = 3;
  private operationCallbacks: Array<OperationCallback> = [];
  private progressCallbacks: Array<ProgressCallback> = [];

  public addOperation(operation: Omit<FileOperation, 'id' | 'status' | 'progress' | 'createdAt'>): string {
    const id = this.generateId();
    const fullOperation: FileOperation = {
      ...operation,
      id,
      status: OperationStatus.PENDING,
      progress: 0,
      createdAt: new Date(),
    };

    this.operations.set(id, fullOperation);
    this.notifyOperationCallbacks(fullOperation);
    
    logger.info('File operation queued', {
      id,
      type: operation.type,
      source: operation.source,
      destination: operation.destination,
    });

    // Start processing if we have capacity
    this.processQueue();

    return id;
  }

  public cancelOperation(operationId: string): boolean {
    const operation = this.operations.get(operationId);
    if (!operation) return false;

    if (operation.status === OperationStatus.PENDING) {
      operation.status = OperationStatus.CANCELLED;
      operation.completedAt = new Date();
      this.notifyOperationCallbacks(operation);
      
      logger.info('File operation cancelled', { operationId });
      return true;
    }

    if (operation.status === OperationStatus.IN_PROGRESS) {
      // TODO: Implement operation cancellation for in-progress operations
      // This would require cooperation from the actual file operation implementation
      logger.warn('Cannot cancel in-progress operation', { operationId });
      return false;
    }

    return false;
  }

  public getOperation(operationId: string): FileOperation | undefined {
    return this.operations.get(operationId);
  }

  public getAllOperations(): FileOperation[] {
    return Array.from(this.operations.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  public getActiveOperations(): FileOperation[] {
    return Array.from(this.operations.values()).filter(
      op => op.status === OperationStatus.IN_PROGRESS
    );
  }

  public getPendingOperations(): FileOperation[] {
    return Array.from(this.operations.values()).filter(
      op => op.status === OperationStatus.PENDING
    );
  }

  public clearCompletedOperations(): void {
    const completedIds: string[] = [];
    
    this.operations.forEach((operation, id) => {
      if (operation.status === OperationStatus.COMPLETED || 
          operation.status === OperationStatus.FAILED ||
          operation.status === OperationStatus.CANCELLED) {
        completedIds.push(id);
      }
    });

    completedIds.forEach(id => this.operations.delete(id));
    
    logger.info('Cleared completed operations', { count: completedIds.length });
  }

  public addOperationCallback(callback: OperationCallback): () => void {
    this.operationCallbacks.push(callback);
    return () => {
      const index = this.operationCallbacks.indexOf(callback);
      if (index > -1) {
        this.operationCallbacks.splice(index, 1);
      }
    };
  }

  public addProgressCallback(callback: ProgressCallback): () => void {
    this.progressCallbacks.push(callback);
    return () => {
      const index = this.progressCallbacks.indexOf(callback);
      if (index > -1) {
        this.progressCallbacks.splice(index, 1);
      }
    };
  }

  private generateId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private notifyOperationCallbacks(operation: FileOperation): void {
    this.operationCallbacks.forEach(callback => {
      try {
        callback(operation);
      } catch (error) {
        logger.error('Operation callback error', { error, operationId: operation.id });
      }
    });
  }

  private notifyProgressCallbacks(progress: OperationProgress): void {
    this.progressCallbacks.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        logger.error('Progress callback error', { error, operationId: progress.operationId });
      }
    });
  }

  private processQueue(): void {
    const pendingOperations = this.getPendingOperations();
    const availableSlots = this.maxConcurrentOperations - this.activeOperations.size;

    if (availableSlots <= 0 || pendingOperations.length === 0) {
      return;
    }

    const operationsToStart = pendingOperations.slice(0, availableSlots);
    
    operationsToStart.forEach(operation => {
      this.executeOperation(operation);
    });
  }

  private async executeOperation(operation: FileOperation): Promise<void> {
    operation.status = OperationStatus.IN_PROGRESS;
    operation.startedAt = new Date();
    this.activeOperations.add(operation.id);
    
    this.notifyOperationCallbacks(operation);

    logger.info('Starting file operation', {
      id: operation.id,
      type: operation.type,
    });

    try {
      switch (operation.type) {
        case FileOperationType.DELETE:
          await this.executeDelete(operation);
          break;
        case FileOperationType.CREATE_FOLDER:
          await this.executeCreateFolder(operation);
          break;
        case FileOperationType.RENAME:
          await this.executeRename(operation);
          break;
        case FileOperationType.COPY:
          await this.executeCopy(operation);
          break;
        case FileOperationType.MOVE:
          await this.executeMove(operation);
          break;
        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      operation.status = OperationStatus.COMPLETED;
      operation.progress = 100;
      operation.completedAt = new Date();

      logger.info('File operation completed', {
        id: operation.id,
        type: operation.type,
        duration: operation.completedAt.getTime() - (operation.startedAt?.getTime() || 0),
      });

    } catch (error: any) {
      operation.status = OperationStatus.FAILED;
      operation.error = error.message;
      operation.completedAt = new Date();

      logger.error('File operation failed', {
        id: operation.id,
        type: operation.type,
        error: error.message,
      });
    } finally {
      this.activeOperations.delete(operation.id);
      this.notifyOperationCallbacks(operation);
      
      // Process next items in queue
      setTimeout(() => this.processQueue(), 100);
    }
  }

  private async executeDelete(operation: FileOperation): Promise<void> {
    if (!operation.source || operation.source.length === 0) {
      throw new Error('No source paths provided for delete operation');
    }

    const totalItems = operation.source.length;
    let processedItems = 0;

    for (const sourcePath of operation.source) {
      try {
        await window.fileSystemAPI.deleteItems([sourcePath]);
        processedItems++;
        
        operation.progress = (processedItems / totalItems) * 100;
        this.notifyProgressCallbacks({
          operationId: operation.id,
          progress: operation.progress,
          bytesProcessed: processedItems,
          totalBytes: totalItems,
          estimatedTimeRemaining: 0,
          currentFile: sourcePath,
        });

      } catch (error: any) {
        logger.error('Failed to delete item', { path: sourcePath, error: error.message });
        // Continue with other items even if one fails
      }
    }

    if (processedItems === 0) {
      throw new Error('Failed to delete any items');
    }
  }

  private async executeCreateFolder(operation: FileOperation): Promise<void> {
    if (!operation.destination || !operation.newName) {
      throw new Error('Invalid parameters for create folder operation');
    }

    await window.fileSystemAPI.createFolder(operation.destination, operation.newName);
    operation.progress = 100;
  }

  private async executeRename(operation: FileOperation): Promise<void> {
    if (!operation.source || operation.source.length !== 1 || !operation.newName) {
      throw new Error('Invalid parameters for rename operation');
    }

    await window.fileSystemAPI.renameItem(operation.source[0], operation.newName);
    operation.progress = 100;
  }

  private async executeCopy(operation: FileOperation): Promise<void> {
    // TODO: Implement copy operation with progress tracking
    // This would require adding copy functionality to the main process
    throw new Error('Copy operation not yet implemented');
  }

  private async executeMove(operation: FileOperation): Promise<void> {
    // TODO: Implement move operation with progress tracking
    // This would require adding move functionality to the main process
    throw new Error('Move operation not yet implemented');
  }

  public getOperationStats(): {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
    cancelled: number;
  } {
    const operations = this.getAllOperations();
    
    return {
      total: operations.length,
      pending: operations.filter(op => op.status === OperationStatus.PENDING).length,
      inProgress: operations.filter(op => op.status === OperationStatus.IN_PROGRESS).length,
      completed: operations.filter(op => op.status === OperationStatus.COMPLETED).length,
      failed: operations.filter(op => op.status === OperationStatus.FAILED).length,
      cancelled: operations.filter(op => op.status === OperationStatus.CANCELLED).length,
    };
  }
}

export const fileOperationQueue = new FileOperationQueue();