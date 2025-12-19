import { ToolContract } from "../_contract"

export const tool: ToolContract = {
  slug: "remove-duplicate-csv",
  title: "Remove duplicate rows from CSV",
  oneLiner: "Remove duplicate rows from a CSV file.",
  priceUsd: 2,
  input: {
    accepts: ["text/csv"],
    maxSizeMb: 10
  }
}
