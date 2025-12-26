"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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

type Preview = { totalRows: number; uniqueRows: number; duplicates: number }

type State =
  | { kind: "idle" }
  | { kind: "previewing" }
  | { kind: "preview_ready"; runId: string; preview: Preview }
  | { kind: "paid"; runId: string; preview: Preview }
  | { kind: "processing"; runId: string }
  | { kind: "ready"; runId: string }
  | { kind: "expired" }
  | { kind: "error"; message: string }

export function ToolRunner({ tool }: { tool: Tool }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<State>({ kind: "idle" })

  const acceptAttr = useMemo(() => tool.input.accepts.join(","), [tool.input.accepts])
  const maxBytes = tool.input.maxSizeMb * 1024 * 1024

  function clearRunFromUrl() {
    router.replace(`/${tool.slug}`)
  }

  function setRunInUrl(runId: string) {
    router.replace(`/${tool.slug}?run=${encodeURIComponent(runId)}`)
  }

  function resetToNewFile() {
    setFile(null)
    setState({ kind: "idle" })
    if (inputRef.current) inputRef.current.value = ""
    clearRunFromUrl()
  }

  function startDownload(runId: string) {
    window.location.href = `/download/${runId}`
  }

  useEffect(() => {
    const runId = searchParams.get("run")
    if (!runId) return

    let cancelled = false

    ;(async () => {
      const res = await fetch(`/api/run/${encodeURIComponent(runId)}`, { method: "GET" })
      if (!res.ok) return
      const json = await res.json()

      if (cancelled) return
      if (json.toolSlug !== tool.slug) return

      if (json.expired) {
        setState({ kind: "expired" })
        return
      }

      const preview = (json.preview ?? null) as Preview | null

      if (json.status === "preview_ready" && preview) {
        setState({ kind: "preview_ready", runId, preview })
        return
      }

      if (json.status === "paid" && preview) {
        setState({ kind: "paid", runId, preview })
        return
      }

      if (json.status === "ready") {
        setState({ kind: "ready", runId })
        return
      }
    })()

    return () => {
      cancelled = true
    }
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
    const runId = json.runId as string
    const preview: Preview = {
      totalRows: json.preview.totalRows,
      uniqueRows: json.preview.uniqueRows,
      duplicates: json.preview.duplicates
    }

    setRunInUrl(runId)
    setState({ kind: "preview_ready", runId, preview })
  }

  async function payThenProcess(runId: string) {
    const unlock = await fetch("/api/unlock", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runId })
    })
    if (!unlock.ok) {
      setState({ kind: "error", message: "Payment failed." })
      return false
    }
    return true
  }

  async function processThenDownload(runId: string) {
    const proc = await fetch(`/api/process/${tool.slug}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runId })
    })
    if (!proc.ok) {
      setState({ kind: "error", message: "Processing failed." })
      return false
    }
    setState({ kind: "ready", runId })
    startDownload(runId)
    return true
  }

  async function onPayAndDownload() {
    if (state.kind !== "preview_ready") return
    setState({ kind: "processing", runId: state.runId })
    const ok = await payThenProcess(state.runId)
    if (!ok) return
    await processThenDownload(state.runId)
  }

  async function onPrepareAndDownload() {
    if (state.kind !== "paid") return
    setState({ kind: "processing", runId: state.runId })
    await processThenDownload(state.runId)
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
                    {file ? (
                      <span className="block max-w-full truncate">{file.name}</span>
                    ) : (
                      <span className="text-muted-foreground">No file selected.</span>
                    )}
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

                {state.kind === "previewing" && <div className="text-sm text-muted-foreground">Analyzing file…</div>}
                {state.kind === "error" && <div className="text-sm">{state.message}</div>}
                {state.kind === "expired" && <div className="text-sm">Run expired.</div>}
              </div>
            </CardContent>
          </Card>
        )}

        {(state.kind === "preview_ready" || state.kind === "paid") && (
          <Card className="shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Preview</CardTitle>
              <CardDescription>Review the result before download.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1 text-sm">
                <div>{state.preview.duplicates} duplicate rows will be removed.</div>
                <div>{state.preview.uniqueRows} rows will remain out of {state.preview.totalRows}.</div>
              </div>

              <Separator />

              <div className="space-y-3">
                {state.kind === "preview_ready" ? (
                  <Button onClick={onPayAndDownload} className="w-full sm:w-auto">
                    Pay ${tool.priceUsd} and download CSV
                  </Button>
                ) : (
                  <Button onClick={onPrepareAndDownload} className="w-full sm:w-auto">
                    Prepare and download CSV
                  </Button>
                )}

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
              <div className="text-sm text-muted-foreground">Preparing file…</div>
            </CardContent>
          </Card>
        )}

        {state.kind === "ready" && (
          <Card className="shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-base">Download</CardTitle>
              <CardDescription>Download should start automatically.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <Button onClick={() => startDownload(state.runId)} className="w-full sm:w-auto">
                  Download CSV
                </Button>
                <div className="text-xs text-muted-foreground">Download remains available for a limited time.</div>
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
