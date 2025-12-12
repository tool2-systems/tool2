import { deleteTempFile, readTempFile, saveTempFile } from "@/lib/files";

export type StoredResultMeta = {
  id: string;
  mimeType: string;
  fileName: string;
};

const results = new Map<string, StoredResultMeta>();
const tokenToResultId = new Map<string, string>();

export async function createResult(
  content: string,
  mimeType: string,
  fileName: string
): Promise<StoredResultMeta> {
  const buffer = Buffer.from(content, "utf-8");
  const tempFile = await saveTempFile(buffer, mimeType, fileName);

  const stored: StoredResultMeta = {
    id: tempFile.id,
    mimeType,
    fileName,
  };

  results.set(stored.id, stored);
  return stored;
}

export function linkTokenToResult(token: string, resultId: string): void {
  tokenToResultId.set(token, resultId);
}

export async function consumeResultForToken(token: string): Promise<{
  content: string;
  mimeType: string;
  fileName: string;
} | null> {
  const resultId = tokenToResultId.get(token);
  if (!resultId) {
    return null;
  }

  tokenToResultId.delete(resultId);
  const meta = results.get(resultId);

  if (!meta) {
    return null;
  }

  results.delete(resultId);

  const file = await readTempFile(resultId);

  if (!file) {
    return null;
  }

  await deleteTempFile(resultId);

  const contentText = file.content.toString("utf-8");

  return {
    content: contentText,
    mimeType: meta.mimeType,
    fileName: meta.fileName,
  };
}
