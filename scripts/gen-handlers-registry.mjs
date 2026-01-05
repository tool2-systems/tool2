import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const dir = path.join(root, "src", "tools", "handlers")
const outFile = path.join(dir, "registry.ts")

const skip = new Set(["index.ts", "types.ts", "registry.ts", "verify.ts"])
const entries = fs.readdirSync(dir, { withFileTypes: true })

const handlerFiles = entries
  .filter(e => e.isFile())
  .map(e => e.name)
  .filter(n => n.endsWith(".ts"))
  .filter(n => !skip.has(n))
  .filter(n => !n.endsWith(".d.ts"))
  .sort((a, b) => a.localeCompare(b))

const imports = []
const names = []

function toIdent(file) {
  const base = file.replace(/\.ts$/, "")
  const parts = base.split("-").filter(Boolean)
  const camel = parts.map((p, i) => i === 0 ? p : (p[0]?.toUpperCase() ?? "") + p.slice(1)).join("")
  return camel
}

for (const f of handlerFiles) {
  const ident = toIdent(f)
  imports.push(`import { ${ident} } from "./${f.replace(/\.ts$/, "")}"`)
  names.push(ident)
}

const content =
`import type { ToolHandler } from "./types"
${imports.join("\n")}

export const handlers: ToolHandler[] = [${names.join(", ")}]
`

fs.writeFileSync(outFile, content, "utf8")
process.stdout.write(`Wrote ${path.relative(root, outFile)} with ${names.length} handler(s)\n`)
