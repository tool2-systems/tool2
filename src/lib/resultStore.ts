import crypto from "crypto";

export type StoredResult = {
  id: string;
  content: string;
  mimeType: string;
  fileName: string;
};

const results = new Map<string, StoredResult>();
const tokenToResultId = new Map<string, string>();

export function createResult(content: string, mimeType: string, fileName: string): StoredResult {
  const id = crypto.randomUUID();
  const stored: StoredResult = { id, content, mimeType, fileName };
  results.set(id, stored);
  return stored;
}

export function linkTokenToResult(token: string, resultId: string): void {
  tokenToResultId.set(token, resultId);
}

export function consumeResultForToken(token: string): StoredResult | null {
  const resultId = tokenToResultId.get(token);
  if (!resultId) {
    return null;
  }
  tokenToResultId.delete(token);
  const stored = results.get(resultId);
  if (!stored) {
    return null;
  }
  results.delete(resultId);
  return stored;
}
