export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: any;
  stack?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private logLevel: LogLevel = LogLevel.INFO;

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private addLog(level: LogLevel, message: string, context?: any): void {
    if (!this.shouldLog(level)) return;

    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      stack: level === LogLevel.ERROR ? new Error().stack : undefined,
    };

    this.logs.push(logEntry);

    // Maintain log size limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output
    const timestamp = logEntry.timestamp.toISOString();
    const levelStr = LogLevel[level];
    const logMessage = `[${timestamp}] ${levelStr}: ${message}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage, context);
        break;
      case LogLevel.INFO:
        console.info(logMessage, context);
        break;
      case LogLevel.WARN:
        console.warn(logMessage, context);
        break;
      case LogLevel.ERROR:
        console.error(logMessage, context);
        break;
    }
  }

  public debug(message: string, context?: any): void {
    this.addLog(LogLevel.DEBUG, message, context);
  }

  public info(message: string, context?: any): void {
    this.addLog(LogLevel.INFO, message, context);
  }

  public warn(message: string, context?: any): void {
    this.addLog(LogLevel.WARN, message, context);
  }

  public error(message: string, context?: any): void {
    this.addLog(LogLevel.ERROR, message, context);
  }

  public getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  public exportLogs(): string {
    return this.logs
      .map(log => {
        const timestamp = log.timestamp.toISOString();
        const level = LogLevel[log.level];
        const context = log.context ? ` | Context: ${JSON.stringify(log.context)}` : '';
        const stack = log.stack ? ` | Stack: ${log.stack}` : '';
        return `[${timestamp}] ${level}: ${log.message}${context}${stack}`;
      })
      .join('\n');
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public getErrorCount(): number {
    return this.logs.filter(log => log.level === LogLevel.ERROR).length;
  }

  public getWarningCount(): number {
    return this.logs.filter(log => log.level === LogLevel.WARN).length;
  }
}

export const logger = new Logger();