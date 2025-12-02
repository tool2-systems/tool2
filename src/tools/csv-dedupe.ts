export async function processCsvDedupe(input: Buffer): Promise<Buffer> {
  const text = input.toString("utf-8");

  const lines = text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  const seen = new Set<string>();
  const out: string[] = [];

  for (const line of lines) {
    if (!seen.has(line)) {
      seen.add(line);
      out.push(line);
    }
  }

  const result = out.join("\n");
  return Buffer.from(result, "utf-8");
}
