import fs from "node:fs"
import path from "node:path"

export type Tool = {
  slug: string
  title: string
  oneLiner: string
  priceUsd: number
  input: { accepts: string[]; maxSizeMb: number }
  outputExt: string
}

function splitCsvLine(line: string) {
  const out: string[] = []
  let cur = ""
  let inQ = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQ = !inQ
      }
      continue
    }
    if (ch === "," && !inQ) {
      out.push(cur)
      cur = ""
      continue
    }
    cur += ch
  }
  out.push(cur)
  return out.map(s => s.trim())
}

export function loadTools(): Tool[] {
  const file = path.join(process.cwd(), "src/tools/tools.csv")
  const raw = fs.readFileSync(file, "utf8")
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const header = splitCsvLine(lines[0])
  const idx = (name: string) => header.indexOf(name)

  const iSlug = idx("slug")
  const iTitle = idx("title")
  const iOne = idx("oneLiner")
  const iPrice = idx("priceUsd")
  const iAcc = idx("accepts")
  const iMax = idx("maxSizeMb")
  const iOut = idx("outputExt")

  if ([iSlug, iTitle, iOne, iPrice, iAcc, iMax].some(i => i < 0)) {
    throw new Error("tools.csv missing required headers")
  }

  const tools: Tool[] = []
  for (const line of lines.slice(1)) {
    const cols = splitCsvLine(line)
    const slug = cols[iSlug]
    if (!slug) continue

    const title = cols[iTitle] ?? ""
    const oneLiner = cols[iOne] ?? ""
    const priceUsd = Number(cols[iPrice] ?? "0")
    const accepts = (cols[iAcc] ?? "").split("|").map(s => s.trim()).filter(Boolean)
    const maxSizeMb = Number(cols[iMax] ?? "0")
    const outputExtRaw = iOut >= 0 ? (cols[iOut] ?? "") : ""
    const outputExt = (outputExtRaw || "csv").replace(/^\./, "").toLowerCase()

    tools.push({
      slug,
      title,
      oneLiner,
      priceUsd,
      input: { accepts, maxSizeMb },
      outputExt
    })
  }

  return tools
}
