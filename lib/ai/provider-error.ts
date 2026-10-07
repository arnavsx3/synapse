export type ProviderErrorCode =
  | "configuration"
  | "quota_exhausted"
  | "rate_limited"
  | "unavailable"
  | "invalid_response"
  | "unknown";

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly code: ProviderErrorCode,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export function getProviderErrorCode(status?: number): ProviderErrorCode {
  if (status === 401 || status === 403) return "configuration";
  if (status === 402) return "quota_exhausted";
  if (status === 429) return "rate_limited";
  if (status !== undefined && status >= 500) return "unavailable";
  return "unknown";
}

export function getSafeProviderMessage(error: unknown) {
  if (!(error instanceof Error)) return "Provider request failed.";
  return error.message.slice(0, 500);
}
