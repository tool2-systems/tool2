import type { ToolHandler } from "./types"
import { countCsvRows } from "./count-csv-rows"
import { removeDuplicateCsv } from "./remove-duplicate-csv"

export const handlers: ToolHandler[] = [countCsvRows, removeDuplicateCsv]
