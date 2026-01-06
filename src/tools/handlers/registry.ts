import type { ToolHandler } from "./types"
import { removeDuplicateCsv } from "./remove-duplicate-csv"

export const handlers: ToolHandler[] = [removeDuplicateCsv]
