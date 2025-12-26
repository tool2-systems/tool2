"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

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

  function reset() {
    const url = new URL(window.location.href)
    url.searchParams.delete("run")
    window.history.replaceState({}, "", url.toString())
    setFile(null)
    setState({ kind: "idle" })
    if (inputRef.current) inputRef.current.value = ""
  }

  function download(runId: string) {
    window.location.href = `/download/${runId}`
  }

  async function resume(runId: string) {
    const res = await fetch(`/api/run/${runId}`)
    if (!res.ok) return

    const json = await res.json()
    if (json.toolSlug !== tool.slug) return
    if (json.expired) return setState({ kind: "expired" })

    if (json.status === "ready") {
      setState({ kind: "ready", runId, expiresAt: json.expiresAt })
      return
    }

    if (json.status === "preview_ready" && json.preview) {
      setState({
        kind: "preview_ready",
        runId,
        totalRows: json.preview.totalRows,
        uniqueRows: json.preview.uniqueRows,
        duplicates: json.preview.duplicates
      })
    }
  }

  useEffect(() => {
    const runId = searchParams.get("run")
    if (runId) resume(runId)
  }, [searchParams])

  async function preview() {
    if (!file) return
    if (file.size > maxBytes) {
      setState({ kind: "error", message: "File too large." })
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

  async function payAndRun() {
    if (state.kind !== "preview_ready") return

    setState({ kind: "processing", runId: state.runId })

    await fetch("/api/unlock", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runId: state.runId })
    })

    await fetch(`/api/process/${tool.slug}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runId: state.runId })
    })

    const r = await fetch(`/api/run/${state.runId}`)
    const j = await r.json()
    setState({ kind: "ready", runId: state.runId, expiresAt: j.expiresAt })
    download(state.runId)
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-14">
      <header className="mb-10 text-center space-y-2">
        <h1 className="text-3xl font-semibold">{tool.title}</h1>
        <p className="text-base text-muted-foreground">{tool.oneLiner}</p>
      </header>

      <Card>
        <CardContent className="p-8 space-y-8 text-center">
          <input
            ref={inputRef}
            type="file"
            accept={acceptAttr}
            className="hidden"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setState({ kind: "idle" })
            }}
          />

          {state.kind === "idle" && (
            <>
              <Button size="lg" className="w-full text-lg py-6" onClick={() => inputRef.current?.click()}>
                Choose CSV file
              </Button>
              {file && <div className="text-sm">{file.name}</div>}
              <Button size="lg" variant="secondary" className="w-full py-6" disabled={!file} onClick={preview}>
                Generate preview
              </Button>
            </>
          )}

          {state.kind === "previewing" && <div className="text-lg">Analyzing…</div>}

          {state.kind === "preview_ready" && (
            <>
              <div className="text-lg">
                {state.duplicates} rows removed · {state.uniqueRows} remain
              </div>
              <Button size="lg" className="w-full text-lg py-6" onClick={payAndRun}>
                Pay ${tool.priceUsd} and download
              </Button>
              <Button variant="secondary" className="w-full py-5" onClick={reset}>
                Start over
              </Button>
            </>
          )}

          {state.kind === "processing" && <div className="text-lg">Preparing file…</div>}

          {state.kind === "ready" && (
            <>
              <Button size="lg" className="w-full text-lg py-6" onClick={() => download(state.runId)}>
                Download CSV
              </Button>
              {state.expiresAt && (
                <div className="text-xs text-muted-foreground">
                  Available until {formatExpiry(state.expiresAt)}
                </div>
              )}
              <Button variant="secondary" className="w-full py-5" onClick={reset}>
                Run again
              </Button>
            </>
          )}

          {state.kind === "expired" && (
            <>
              <div className="text-lg">This run has expired.</div>
              <Button size="lg" className="w-full py-6" onClick={reset}>
                Start over
              </Button>
            </>
          )}

          {state.kind === "error" && <div className="text-red-600">{state.message}</div>}
        </CardContent>
      </Card>
    </main>
  )
}
