"use client"

import { useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

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
  | { kind: "ready"; runId: string }
  | { kind: "error"; message: string }

export function ToolRunner({ tool }: { tool: Tool }) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<State>({ kind: "idle" })

  const acceptAttr = useMemo(() => tool.input.accepts.join(","), [tool.input.accepts])
  const maxBytes = tool.input.maxSizeMb * 1024 * 1024

  function clearFileInput() {
    if (inputRef.current) inputRef.current.value = ""
  }

  function resetToNewFile() {
    setFile(null)
    setState({ kind: "idle" })
    clearFileInput()
  }

  function startDownload(runId: string) {
    window.location.href = `/download/${runId}`
  }

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

    const runId = state.runId
    setState({ kind: "ready", runId })
    startDownload(runId)
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{tool.title}</h1>
        <p className="text-sm">{tool.oneLiner}</p>
      </div>

      <div className="mt-8 space-y-6">
        {state.kind !== "ready" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                ref={inputRef}
                type="file"
                accept={acceptAttr}
                onClick={() => clearFileInput()}
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null
                  setFile(f)
                  setState({ kind: "idle" })
                }}
              />

              {state.kind === "idle" && (
                <Button onClick={onGeneratePreview} disabled={!file}>
                  Generate preview
                </Button>
              )}

              {state.kind === "previewing" && <div className="text-sm">Analyzing file…</div>}
              {state.kind === "error" && <div className="text-sm">{state.message}</div>}
            </CardContent>
          </Card>
        )}

        {state.kind === "preview_ready" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1 text-sm">
                <div>{state.duplicates} duplicate rows will be removed.</div>
                <div>{state.uniqueRows} rows will remain out of {state.totalRows}.</div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Button onClick={onPayAndDownload}>Pay ${tool.priceUsd} and download CSV</Button>
                <Button variant="secondary" onClick={resetToNewFile}>Upload a new file</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {state.kind === "processing" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preparing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">Preparing file…</div>
            </CardContent>
          </Card>
        )}

        {state.kind === "ready" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Download</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">Download started.</div>

              <div className="space-y-3">
                <Button onClick={() => startDownload(state.runId)}>Download CSV</Button>
                <div className="text-xs text-muted-foreground">File can be downloaded again without payment.</div>
                <Button variant="secondary" onClick={resetToNewFile}>Upload a new file</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
