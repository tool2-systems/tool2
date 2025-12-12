import fs from "fs";
import path from "path";
import crypto from "crypto";

export type TempFile = {
  id: string;
  path: string;
  sizeBytes: number;
  mimeType: string;
  fileName: string;
};

const TEMP_DIR = path.join(process.cwd(), "tmp");

async function ensureTempDir() {
  await fs.promises.mkdir(TEMP_DIR, { recursive: true });
}

export async function saveTempFile(
  content: Buffer,
  mimeType: string,
  fileName: string
): Promise<TempFile> {
  await ensureTempDir();

  const id = crypto.randomUUID();
  const safeName = fileName || "file";
  const finalName = id + "-" + safeName;
  const fullPath = path.join(TEMP_DIR, finalName);

  await fs.promises.writeFile(fullPath, content);
  const stats = await fs.promises.stat(fullPath);

  return {
    id,
    path: fullPath,
    sizeBytes: stats.size,
    mimeType,
    fileName: safeName,
  };
}

export async function readTempFile(id: string): Promise<{ file: TempFile; content: Buffer } | null> {
  await ensureTempDir();

  const prefix = id + "-";
  const entries = await fs.promises.readdir(TEMP_DIR);
  const match = entries.find((name) => name.startsWith(prefix));

  if (!match) {
    return null;
  }

  const fullPath = path.join(TEMP_DIR, match);
  const stats = await fs.promises.stat(fullPath);
  const content = await fs.promises.readFile(fullPath);

  const file: TempFile = {
    id,
    path: fullPath,
    sizeBytes: stats.size,
    mimeType: "application/octet-stream",
    fileName: match.slice(prefix.length),
  };

  return { file, content };
}

export async function deleteTempFile(id: string): Promise<void> {
  await ensureTempDir();

  const prefix = id + "-";
  const entries = await fs.promises.readdir(TEMP_DIR);
  const match = entries.find((name) => name.startsWith(prefix));

  if (!match) {
    return;
  }

  const fullPath = path.join(TEMP_DIR, match);
  await fs.promises.unlink(fullPath).catch(() => {});
}
