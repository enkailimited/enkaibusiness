import "server-only";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  module?: string;
  error?: string;
  errorCode?: string;
  duration?: number;
  [key: string]: unknown;
}

const isProduction = process.env.NODE_ENV === "production";

function formatLog(entry: LogEntry): string {
  if (isProduction) {
    return JSON.stringify(entry);
  }
  const ts = entry.timestamp.split("T")[1]?.replace("Z", "") ?? entry.timestamp;
  const level = entry.level.toUpperCase().padEnd(5);
  const mod = entry.module ? `[${entry.module}] ` : "";
  const err = entry.error ? ` \u2014 ${entry.error}` : "";
  return `${ts} ${level} ${mod}${entry.message}${err}`;
}

function createEntry(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (!isProduction) console.debug(formatLog(createEntry("debug", message, meta)));
  },

  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(formatLog(createEntry("info", message, meta)));
  },

  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(formatLog(createEntry("warn", message, meta)));
  },

  error: (message: string, error?: unknown, meta?: Record<string, unknown>) => {
    const entry = createEntry("error", message, {
      ...meta,
      error: error instanceof Error ? error.message : String(error ?? ""),
      errorCode: error instanceof Error ? (error as any).code : undefined,
      stack: isProduction ? undefined : error instanceof Error ? error.stack?.split("\n").slice(0, 4).join(" ") : undefined,
    });
    console.error(formatLog(entry));
  },
};

export function logDuration<T>(module: string, operation: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  return fn().then(
    (result) => {
      logger.info(`${module}:${operation} completed`, { duration: Date.now() - start, module, operation });
      return result;
    },
    (error) => {
      logger.error(`${module}:${operation} failed`, error, { duration: Date.now() - start, module, operation });
      throw error;
    },
  );
}
