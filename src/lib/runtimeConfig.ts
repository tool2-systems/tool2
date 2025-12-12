export const RUNTIME = {
  checkout: {
    pollTimeoutMs: 60000,
    pollBaseDelayMs: 2000,
    pollMaxDelayMs: 10000,
    pollBackoffFactor: 1.4,
    checkoutMetaTtlMs: 300000,
    checkoutPaidTtlMs: 300000,
  },
  results: {
    tempFileTtlMs: 60000,
  },
} as const;
