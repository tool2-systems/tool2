import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { loadRun, saveRun } from "@/lib/store"
import { inputsDir } from "@/lib/paths"

export async function POST(req: Request, ctx: { params: Promise<{ toolSlug: string }> }) {
  const { toolSlug } = await ctx.params

  const body = (await req.json().catch(() => null)) as { runId?: string } | null
  const runId = body?.runId
  if (!runId) return NextResponse.json({ error: "no runId" }, { status: 400 })

  const run = await loadRun(runId)
  if (run.toolSlug !== toolSlug) return NextResponse.json({ error: "mismatch" }, { status: 400 })
  if (run.status !== "paid") return NextResponse.json({ error: "not paid" }, { status: 402 })
  if (toolSlug !== "remove-duplicate-csv") return NextResponse.json({ error: "no handler" }, { status: 400 })

  const inputPath = path.join(inputsDir(), `${runId}.csv`)
  const raw = await fs.readFile(inputPath, "utf8")

  const normalized = raw.replace(/\r\n/g, "\n")
  const lines = normalized.split("\n")

  const header = lines.length ? lines[0] : ""
  const bodyLines = lines.slice(1)

  const seen = new Set<string>()
  const outBody: string[] = []

  for (const line of bodyLines) {
    if (!seen.has(line)) {
      seen.add(line)
      outBody.push(line)
    }
  }

  const out = header ? [header, ...outBody] : outBody
  await fs.writeFile(run.outputPath, out.join("\n"), "utf8")

  run.status = "ready"
  await saveRun(run)

  return NextResponse.json({ ok: true })
}
