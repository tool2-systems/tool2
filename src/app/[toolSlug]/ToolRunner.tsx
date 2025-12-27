"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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

  const hasFile = !!file
  const chooseLabel = acceptLabel === "CSV" ? "Choose CSV" : "Choose file"
  const constraintsLabel = `${acceptLabel}, max ${tool.input.maxSizeMb} MB`

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

  function resetAll() {
    clearRunFromUrl()
    setFile(null)
    setState({ kind: "idle" })
    if (inputRef.current) inputRef.current.value = ""
  }

  function pickFile() {
    inputRef.current?.click()
  }

  function changeFile() {
    clearRunFromUrl()
    setState({ kind: "idle" })
    pickFile()
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

  const showFilePanel = state.kind !== "processing" && state.kind !== "ready" && state.kind !== "expired" && state.kind !== "error"

  return (
    <main className="mx-auto max-w-xl px-4 py-14">
      <header className="mb-10 space-y-2 text-center">
        <h1 className="text-3xl font-semibold">{tool.title}</h1>
        <p className="text-base text-muted-foreground">{tool.oneLiner}</p>
      </header>

      <Card className="shadow-sm">
        <CardContent className="space-y-6 p-8">
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

          {showFilePanel ? (
            <div className="space-y-2">
              {!hasFile ? (
                <Button size="lg" className="w-full py-6 text-base sm:text-lg" type="button" onClick={pickFile}>
                  {chooseLabel}
                </Button>
              ) : (
                <>
                  <div className="text-sm">
                    <span className="block truncate">{file.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{constraintsLabel}</div>
                </>
              )}
            </div>
          ) : null}

          {state.kind === "preview_ready" ? (
            <div className="space-y-1 text-sm">
              <div>{state.duplicates} rows will be removed.</div>
              <div>{state.uniqueRows} rows will remain out of {state.totalRows}.</div>
            </div>
          ) : null}

          {state.kind === "processing" ? <div className="text-base sm:text-lg">Preparing file…</div> : null}
          {state.kind === "previewing" ? <div className="text-sm text-muted-foreground">Analyzing…</div> : null}

          {state.kind === "ready" ? (
            <div className="space-y-2">
              {typeof state.expiresAt === "number" ? (
                <div className="text-sm text-muted-foreground">Available until {formatExpiry(state.expiresAt)}</div>
              ) : null}
            </div>
          ) : null}

          {state.kind === "expired" ? (
            <div className="space-y-3">
              <div className="text-base sm:text-lg">This run has expired.</div>
              <Button size="lg" className="w-full py-6 text-base sm:text-lg" onClick={resetAll}>
                Start over
              </Button>
            </div>
          ) : null}

          {state.kind === "error" ? (
            <div className="space-y-3">
              <div className="text-sm text-foreground">{state.message}</div>
              <Button size="lg" className="w-full py-6 text-base sm:text-lg" onClick={resetAll}>
                Start over
              </Button>
            </div>
          ) : null}

          {state.kind !== "expired" && state.kind !== "error" ? (
            <>
              <Separator />

              {state.kind === "idle" && hasFile ? (
                <div className="space-y-3">
                  <Button size="lg" className="w-full py-6 text-base sm:text-lg" onClick={onGeneratePreview}>
                    Generate preview
                  </Button>
                  <Button variant="secondary" className="w-full py-6" onClick={changeFile}>
                    Change file
                  </Button>
                </div>
              ) : null}

              {state.kind === "preview_ready" ? (
                <div className="space-y-3">
                  <Button size="lg" className="w-full py-6 text-base sm:text-lg" onClick={onPayAndDownload}>
                    Pay ${tool.priceUsd} and download
                  </Button>
                  <Button variant="secondary" className="w-full py-6" onClick={changeFile}>
                    Change file
                  </Button>
                </div>
              ) : null}

              {state.kind === "ready" ? (
                <div className="space-y-3">
                  <Button size="lg" className="w-full py-6 text-base sm:text-lg" onClick={() => startDownload(state.runId)}>
                    Download CSV
                  </Button>
                  <Button variant="secondary" className="w-full py-6" onClick={resetAll}>
                    Run again
                  </Button>
                </div>
              ) : null}
            </>
          ) : null}
        </CardContent>
      </Card>
    </main>
  )
}
