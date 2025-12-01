export function logInfo(message: string, data?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.log("[info]", message, data ?? {});
  }
}

export function logError(message: string, data?: Record<string, unknown>) {
  console.error("[error]", message, data ?? {});
}
