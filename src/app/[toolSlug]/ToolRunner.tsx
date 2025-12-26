"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"

type Tool = {
  slug: string
  title: string
  oneLiner: string
  priceUsd: number
  input: { accepts: string[]; maxSizeMb: number }
}

type State =
  | { kind: "idle" }
  | { kind: "previewing" }
  | { kind: "preview_ready"; runId: string; totalRows: number; uniqueRows: number; duplicates: number }
  | { kind: "processing"; runId: string }
  | { kind: "ready"; runId: string; expiresAt: number | null }
  | { kind: "expired" }
  | { kind: "error"; message: string }

function formatExpiry(ts: number) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(ts))
}

export function ToolRunner({ tool }: { tool: Tool }) {
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<State>({ kind: "idle" })

  const acceptAttr = useMemo(() => tool.input.accepts.join(","), [tool.input.accepts])
  const maxBytes = tool.input.maxSizeMb * 1024 * 1024

  function resetToNewFile() {
    const url = new URL(window.location.href)
    url.searchParams.delete("run")
    window.history.replaceState({}, "", url.toString())

    setFile(null)
    setState({ kind: "idle" })
    if (inputRef.current) inputRef.current.value = ""
  }

  function startDownload(runId: string) {
    window.location.href = `/download/${runId}`
  }

  async function resumeFromRun(runId: string) {
    const res = await fetch(`/api/run/${runId}`)
    if (!res.ok) {
      setState({ kind: "idle" })
      return
    }

    const json = await res.json()

    if (json.toolSlug !== tool.slug) {
      setState({ kind: "idle" })
      return
    }

    if (json.expired) {
      setState({ kind: "expired" })
      return
    }

    if (json.status === "ready") {
      setState({ kind: "ready", runId: json.runId, expiresAt: json.expiresAt })
      return
    }

    if (json.status === "paid") {
      setState({ kind: "processing", runId: json.runId })
      const proc = await fetch(`/api/process/${tool.slug}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ runId: json.runId })
      })
      if (!proc.ok) {
        setState({ kind: "error", message: "Processing failed." })
        return
      }

      const re = await fetch(`/api/run/${json.runId}`)
      const j2 = await re.json().catch(() => null)
      const expiresAt = j2?.expiresAt ?? null

      setState({ kind: "ready", runId: json.runId, expiresAt })
      startDownload(json.runId)
      return
    }

    if (json.status === "preview_ready" && json.preview) {
      setState({
        kind: "preview_ready",
        runId: json.runId,
        totalRows: json.preview.totalRows,
        uniqueRows: json.preview.uniqueRows,
        duplicates: json.preview.duplicates
      })
      return
    }

    setState({ kind: "idle" })
  }

  useEffect(() => {
    const runId = searchParams.get("run")
    if (!runId) return
    resumeFromRun(runId)
  }, [searchParams, tool.slug])

  async function onGeneratePreview() {
    if (!file) return

    if (file.size > maxBytes) {
      setState({ kind: "error", message: `File exceeds ${tool.input.maxSizeMb} MB limit.` })
      return
    }

    setState({ kind: "previewing" })

    const form = new FormData()
    form.append("file", file)

    const res = await fetch(`/api/preview/${tool.slug}`, { method: "POST", body: form })
    if (!res.ok) {
      setState({ kind: "error", message: "Preview failed." })
      return
    }

    const json = await res.json()

    const url = new URL(window.location.href)
    url.searchParams.set("run", json.runId)
    window.history.replaceState({}, "", url.toString())

    setState({
      kind: "preview_ready",
      runId: json.runId,
      totalRows: json.preview.totalRows,
      uniqueRows: json.preview.uniqueRows,
      duplicates: json.preview.duplicates
    })
  }

  async function onPayAndDownload() {
    if (state.kind !== "preview_ready") return

    setState({ kind: "processing", runId: state.runId })

    const unlock = await fetch("/api/unlock", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runId: state.runId })
    })
    if (!unlock.ok) {
      setState({ kind: "error", message: "Payment failed." })
      return
    }

    const proc = await fetch(`/api/process/${tool.slug}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runId: state.runId })
    })
    if (!proc.ok) {
      setState({ kind: "error", message: "Processing failed." })
      return
    }

    const r = await fetch(`/api/run/${state.runId}`)
    const j = await r.json().catch(() => null)
    const expiresAt = j?.expiresAt ?? null

    setState({ kind: "ready", runId: state.runId, expiresAt })
    startDownload(state.runId)
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{tool.title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{tool.oneLiner}</p>
      </header>

      <div className="mt-8 space-y-6">
        {state.kind !== "ready" && (
          <Card className="shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Upload</CardTitle>
              <CardDescription>Select a file to generate a preview.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <input
                ref={inputRef}
                type="file"
                accept={acceptAttr}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null
                  setFile(f)
                  setState({ kind: "idle" })
                }}
              />

              <div className="space-y-2">
                <Label className="text-sm">File</Label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button variant="secondary" type="button" onClick={() => inputRef.current?.click()}>
                    Choose file
                  </Button>
                  <div className="min-w-0 text-sm text-foreground">
                    {file ? <span className="block max-w-full truncate">{file.name}</span> : <span className="text-muted-foreground">No file selected.</span>}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Accepted: {acceptAttr || "file"} · Max {tool.input.maxSizeMb} MB
                </div>
              </div>

              <div className="space-y-2">
                <Button onClick={onGeneratePreview} disabled={!file || state.kind === "previewing"} className="w-full sm:w-auto">
                  Generate preview
                </Button>

                {state.kind === "previewing" && <div className="text-sm text-foreground">Analyzing file…</div>}
                {state.kind === "expired" && <div className="text-sm text-foreground">Previous run expired.</div>}
                {state.kind === "error" && <div className="text-sm text-foreground">{state.message}</div>}
              </div>
            </CardContent>
          </Card>
        )}

        {state.kind === "preview_ready" && (
          <Card className="shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Preview</CardTitle>
              <CardDescription>Review the result before payment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1 text-sm text-foreground">
                <div>{state.duplicates} duplicate rows will be removed.</div>
                <div>{state.uniqueRows} rows will remain out of {state.totalRows}.</div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Button onClick={onPayAndDownload} className="w-full sm:w-auto">
                  Pay ${tool.priceUsd} and download CSV
                </Button>
                <Button variant="secondary" onClick={resetToNewFile} className="w-full sm:w-auto">
                  Upload a new file
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {state.kind === "processing" && (
          <Card className="shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Preparing</CardTitle>
              <CardDescription>Processing the file for download.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-foreground">Preparing file…</div>
            </CardContent>
          </Card>
        )}

        {state.kind === "ready" && (
          <Card className="shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Download</CardTitle>
              <CardDescription>Your file is ready. Download starts automatically.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <Button onClick={() => startDownload(state.runId)} className="w-full sm:w-auto">
                  Download CSV
                </Button>

                {typeof state.expiresAt === "number" && (
                  <div className="text-xs text-muted-foreground">Available until {formatExpiry(state.expiresAt)}.</div>
                )}

                <Button variant="secondary" onClick={resetToNewFile} className="w-full sm:w-auto">
                  Upload a new file
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
