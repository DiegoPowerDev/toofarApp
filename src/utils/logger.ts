// src/utils/logger.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOGS_KEY = '@app_logs';
const MAX_LOGS = 500; // Máximo de logs a mantener

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'success' | 'warning' | 'error' | 'debug';
  message: string;
  details?: any;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private listeners: Set<(logs: LogEntry[]) => void> = new Set();

  private constructor() {
    this.loadLogs();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private async loadLogs() {
    try {
      const saved = await AsyncStorage.getItem(LOGS_KEY);
      if (saved) {
        this.logs = JSON.parse(saved);
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error cargando logs:', error);
    }
  }

  private async saveLogs() {
    try {
      await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(this.logs));
    } catch (error) {
      console.error('Error guardando logs:', error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener([...this.logs]));
  }

  subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.add(listener);
    // Enviar logs actuales inmediatamente
    listener([...this.logs]);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private addLog(level: LogEntry['level'], message: string, details?: any) {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      level,
      message,
      details,
    };

    this.logs.unshift(entry);

    // Mantener solo los últimos MAX_LOGS
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(0, MAX_LOGS);
    }

    this.notifyListeners();
    this.saveLogs();

    // También log a consola
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const emoji = this.getEmoji(level);
    console.log(`${emoji} [${timestamp}] ${message}`, details || '');
  }

  private getEmoji(level: LogEntry['level']): string {
    switch (level) {
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'debug':
        return '🐛';
      default:
        return '📝';
    }
  }

  info(message: string, details?: any) {
    this.addLog('info', message, details);
  }

  success(message: string, details?: any) {
    this.addLog('success', message, details);
  }

  warning(message: string, details?: any) {
    this.addLog('warning', message, details);
  }

  error(message: string, details?: any) {
    this.addLog('error', message, details);
  }

  debug(message: string, details?: any) {
    this.addLog('debug', message, details);
  }

  async clearLogs() {
    this.logs = [];
    this.notifyListeners();
    await this.saveLogs();
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  async exportLogs(): Promise<string> {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = Logger.getInstance();

// Helpers de acceso rápido
export const log = {
  info: (message: string, details?: any) => logger.info(message, details),
  success: (message: string, details?: any) => logger.success(message, details),
  warning: (message: string, details?: any) => logger.warning(message, details),
  error: (message: string, details?: any) => logger.error(message, details),
  debug: (message: string, details?: any) => logger.debug(message, details),
};

// Capturar errores no manejados
if (typeof ErrorUtils !== 'undefined') {
  const originalHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error, isFatal) => {
    logger.error(`Error ${isFatal ? 'FATAL' : 'no fatal'}: ${error.message}`, {
      stack: error.stack,
      isFatal,
    });

    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}
