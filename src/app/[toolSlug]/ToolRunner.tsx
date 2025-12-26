"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

function formatAccept(accepts: string[]) {
  if (accepts.includes("text/csv")) return "CSV"
  if (accepts.includes("application/pdf")) return "PDF"
  if (accepts.length === 1) return accepts[0]
  return "File"
}

export function ToolRunner({ tool }: { tool: Tool }) {
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<State>({ kind: "idle" })

  const acceptAttr = useMemo(() => tool.input.accepts.join(","), [tool.input.accepts])
  const acceptLabel = useMemo(() => formatAccept(tool.input.accepts), [tool.input.accepts])
  const maxBytes = tool.input.maxSizeMb * 1024 * 1024

  function clearRunFromUrl() {
    const url = new URL(window.location.href)
    url.searchParams.delete("run")
    window.history.replaceState({}, "", url.toString())
  }

  function setRunInUrl(runId: string) {
    const url = new URL(window.location.href)
    url.searchParams.set("run", runId)
    window.history.replaceState({}, "", url.toString())
  }

  function resetToNewFile() {
    clearRunFromUrl()
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
      setState({ kind: "error", message: `File exceeds ${tool.input.maxSizeMb} MB.` })
      return
    }

    setState({ kind: "previewing" })

    const form = new FormData()
    form.append("file", file)

    const res = await fetch(`/api/preview/${tool.slug}`, { method: "POST", body: form })
    if (!res.ok) {
      if (res.status === 413) {
        setState({ kind: "error", message: `File exceeds ${tool.input.maxSizeMb} MB.` })
        return
      }
      setState({ kind: "error", message: "Preview failed." })
      return
    }

    const json = await res.json()
    setRunInUrl(json.runId)

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

  function headerTitle() {
    if (state.kind === "preview_ready") return "Preview"
    if (state.kind === "processing") return "Preparing"
    if (state.kind === "ready") return "Download"
    return "Upload"
  }

  function headerDescription() {
    if (state.kind === "preview_ready") return "Review the result before payment."
    if (state.kind === "processing") return "Processing the file for download."
    if (state.kind === "ready") return "Download starts automatically."
    return null
  }

  function primaryActionLabel() {
    if (state.kind === "preview_ready") return `Pay $${tool.priceUsd} and download`
    return "Generate preview"
  }

  function onPrimary() {
    if (state.kind === "preview_ready") return onPayAndDownload
    return onGeneratePreview
  }

  const primaryDisabled =
    (state.kind === "idle" && !file) ||
    state.kind === "previewing" ||
    state.kind === "processing" ||
    state.kind === "ready" ||
    state.kind === "expired"

  const chooseLabel = acceptLabel === "CSV" ? "Choose CSV" : "Choose file"

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{tool.title}</h1>
        <p className="text-sm leading-6 text-muted-foreground">{tool.oneLiner}</p>
      </header>

      <div className="mt-8">
        <Card className="shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-base">{headerTitle()}</CardTitle>
            {headerDescription() ? <CardDescription>{headerDescription()}</CardDescription> : null}
          </CardHeader>

          <CardContent className="space-y-5">
            {state.kind !== "ready" && (
              <>
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

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button variant="secondary" type="button" onClick={() => inputRef.current?.click()}>
                      {chooseLabel}
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
                    {acceptLabel} (max {tool.input.maxSizeMb} MB)
                  </div>
                </div>
              </>
            )}

            {state.kind === "preview_ready" && (
              <div className="space-y-1 text-sm text-foreground">
                <div>{state.duplicates} duplicate rows will be removed.</div>
                <div>{state.uniqueRows} rows will remain out of {state.totalRows}.</div>
              </div>
            )}

            {state.kind === "ready" && (
              <div className="space-y-1 text-sm text-foreground">
                {typeof state.expiresAt === "number" ? (
                  <div className="text-muted-foreground">Available until {formatExpiry(state.expiresAt)}.</div>
                ) : null}
              </div>
            )}

            <Separator />

            <div className="space-y-3">
              {state.kind === "ready" ? (
                <Button onClick={() => startDownload(state.runId)} className="w-full sm:w-auto">
                  Download CSV
                </Button>
              ) : (
                <Button onClick={onPrimary()} disabled={primaryDisabled} className="w-full sm:w-auto">
                  {primaryActionLabel()}
                </Button>
              )}

              {state.kind === "previewing" ? <div className="text-sm text-foreground">Analyzing file…</div> : null}
              {state.kind === "processing" ? <div className="text-sm text-foreground">Preparing file…</div> : null}
              {state.kind === "expired" ? <div className="text-sm text-foreground">Previous run expired.</div> : null}
              {state.kind === "error" ? <div className="text-sm text-foreground">{state.message}</div> : null}

              <Button variant="secondary" onClick={resetToNewFile} className="w-full sm:w-auto">
                Upload a new file
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
