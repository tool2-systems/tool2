import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

function splitCsvLine(line) {
  const out = []
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

function slugToCamel(slug) {
  const parts = slug.split("-").filter(Boolean)
  return parts.map((p, i) => i === 0 ? p : p.slice(0, 1).toUpperCase() + p.slice(1)).join("")
}

const csvFile = path.join(root, "src", "tools", "tools.csv")
const raw = fs.readFileSync(csvFile, "utf8")
const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
if (lines.length < 2) process.exit(0)

const header = splitCsvLine(lines[0])
const idx = name => header.indexOf(name)

const iSlug = idx("slug")
if (iSlug < 0) throw new Error("tools.csv missing slug header")

const handlerDir = path.join(root, "src", "tools", "handlers")
fs.mkdirSync(handlerDir, { recursive: true })

let created = 0

for (const line of lines.slice(1)) {
  const cols = splitCsvLine(line)
  const slug = cols[iSlug]
  if (!slug) continue

  const file = path.join(handlerDir, `${slug}.ts`)
  if (fs.existsSync(file)) continue

  const ident = slugToCamel(slug)

  const content =
`import type { Tool } from "@/tools/loadTools"
import type { ToolHandler } from "./types"

export const ${ident}: ToolHandler = {
  slug: "${slug}",
  async preview({ tool, file }) {
    const raw = ""
    const result = {
      runId: crypto.randomUUID(),
      inputExt: "",
      previewMeta: {}
    }
    return { raw, result }
  },
  async process({ tool, runId, run }) {
    throw new Error("not implemented")
  }
}
`

  fs.writeFileSync(file, content, "utf8")
  created++
}

process.stdout.write(`Created ${created} handler stub(s)\n`)
