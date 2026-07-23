type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

function log(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };

  if (process.env.NODE_ENV === "production") {
    console[level === "debug" ? "log" : level](JSON.stringify(entry));
  } else {
    console[level === "debug" ? "log" : level](`[${level}] ${message}`, context ?? "");
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => log("debug", message, context),
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext) => log("error", message, context),
};
