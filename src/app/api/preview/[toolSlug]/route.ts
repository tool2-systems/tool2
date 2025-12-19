import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { getTool } from "@/tools"

export async function POST(req: Request, ctx: { params: Promise<{ toolSlug: string }> }) {
  const { toolSlug } = await ctx.params
  const tool = getTool(toolSlug)
  if (!tool) return NextResponse.json({ error: "not found" }, { status: 404 })

  const form = await req.formData()
  const file = form.get("file") as File | null
  if (!file) return NextResponse.json({ error: "no file" }, { status: 400 })

  if (toolSlug === "remove-duplicate-csv") {
    const text = await file.text()
    const raw = text.replace(/\r\n/g, "\n").trim()
    const lines = raw.length ? raw.split("\n") : []
    const unique = new Set(lines)

    const runId = randomUUID()

    return NextResponse.json({
      runId,
      preview: {
        totalRows: lines.length,
        uniqueRows: unique.size,
        duplicates: lines.length - unique.size
      }
    })
  }

  return NextResponse.json({ error: "no handler" }, { status: 400 })
}
