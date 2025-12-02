import fs from "node:fs";
import path from "node:path";

export type ToolDefinition = {
  id: string;
  category: string;
  tool_slug: string;
  title: string;
  problem_solved: string;
  input_type: string;
  output_type: string;
  complexity: string;
  price_usd: string;
  search_intent: string;
  payment_signal: string;
  status: string;
};

function getToolsCsvPath() {
  return path.join(process.cwd(), "src", "config", "tools.csv");
}

function parseCsvLine(line: string): string[] {
  return line.split(",").map((part) => part.trim());
}

function parseToolsCsv(contents: string): ToolDefinition[] {
  const lines = contents
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length <= 1) {
    return [];
  }

  const [, ...rows] = lines;

  return rows.map((row) => {
    const parts = parseCsvLine(row);
    const [
      id,
      category,
      tool_slug,
      title,
      problem_solved,
      input_type,
      output_type,
      complexity,
      price_usd,
      search_intent,
      payment_signal,
      status,
    ] = parts;

    return {
      id: id ?? "",
      category: category ?? "",
      tool_slug: tool_slug ?? "",
      title: title ?? "",
      problem_solved: problem_solved ?? "",
      input_type: input_type ?? "",
      output_type: output_type ?? "",
      complexity: complexity ?? "",
      price_usd: price_usd ?? "",
      search_intent: search_intent ?? "",
      payment_signal: payment_signal ?? "",
      status: status ?? "",
    };
  });
}

export function getAllTools(): ToolDefinition[] {
  const csvPath = getToolsCsvPath();
  const contents = fs.readFileSync(csvPath, "utf8");
  return parseToolsCsv(contents);
}

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  const tools = getAllTools();
  return tools.find((tool) => tool.tool_slug === slug);
}
