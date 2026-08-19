const RETRY_DELAY_MS = 200

/** Retry read-only server data loaders once to absorb brief network or API hiccups. */
export async function withDataRetry<T>(load: () => Promise<T>): Promise<T> {
  try {
    return await load()
  } catch {
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    return load()
  }
}
