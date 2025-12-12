import fs from "fs";
import path from "path";
import crypto from "crypto";

export type TempFile = {
  id: string;
  path: string;
  sizeBytes: number;
  mimeType: string;
  fileName: string;
  createdAtMs: number;
};

const TEMP_DIR = path.join(process.cwd(), "tmp");

async function ensureTempDir() {
  await fs.promises.mkdir(TEMP_DIR, { recursive: true });
}

function safePart(value: string) {
  return value.replace(/[^\w.\-]+/g, "_");
}

function parseCreatedAtFromEntry(name: string): number | null {
  const parts = name.split("-");
  if (parts.length < 3) return null;
  const maybeTs = Number(parts[1]);
  if (!Number.isFinite(maybeTs)) return null;
  return maybeTs;
}

export async function cleanupTempFiles(ttlMs: number): Promise<void> {
  await ensureTempDir();

  const now = Date.now();
  const entries = await fs.promises.readdir(TEMP_DIR);

  await Promise.all(
    entries.map(async (name) => {
      const createdAt = parseCreatedAtFromEntry(name);
      if (createdAt === null) return;

      if (now - createdAt > ttlMs) {
        const fullPath = path.join(TEMP_DIR, name);
        await fs.promises.unlink(fullPath).catch(() => {});
      }
    })
  );
}

export async function saveTempFile(
  content: Buffer,
  mimeType: string,
  fileName: string,
  ttlMs: number = 300000
): Promise<TempFile> {
  await ensureTempDir();
  await cleanupTempFiles(ttlMs);

  const id = crypto.randomUUID();
  const createdAtMs = Date.now();
  const safeName = safePart(fileName || "file");
  const finalName = `${id}-${createdAtMs}-${safeName}`;
  const fullPath = path.join(TEMP_DIR, finalName);

  await fs.promises.writeFile(fullPath, content);
  const stats = await fs.promises.stat(fullPath);

  return {
    id,
    path: fullPath,
    sizeBytes: stats.size,
    mimeType,
    fileName: safeName,
    createdAtMs,
  };
}

export async function readTempFile(
  id: string
): Promise<{ file: TempFile; content: Buffer } | null> {
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

  const createdAtMs = parseCreatedAtFromEntry(match) ?? 0;

  const file: TempFile = {
    id,
    path: fullPath,
    sizeBytes: stats.size,
    mimeType: "application/octet-stream",
    fileName: match.slice(prefix.length),
    createdAtMs,
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
