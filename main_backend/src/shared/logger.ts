type logType = "info" | "warn" | "error";

interface LoggerPayload {
  message: string;
  [key: string]: unknown;
}

const log = (type: logType, payload: LoggerPayload) => {
  const entry = {
    type,
    timeStamp: new Date().toLocaleString(),
    ...payload,
  };

  console[type === "error" ? "error" : "log"](JSON.stringify(entry), "\n");
};

export const logger = {
  info: (message: string, metadata?: Record<string, unknown>) => {
    log("info", { message: `[INFO]: ${message}`, ...metadata });
  },
  warn: (message: string, metadata?: Record<string, unknown>) => {
    log("warn", { message: `[WARN]: ${message}`, ...metadata });
  },
  error: (message: string, metadata?: Record<string, unknown>) => {
    log("error", { message: `[ERROR]: ${message}`, ...metadata });
    // TODO: Change this to log to a file or external logging service instead of console.error in production
    console.error(message, " : ", metadata);
  },
};
