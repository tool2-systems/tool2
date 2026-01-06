"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { copy } from "./copy"
import { ui } from "./ui"

type Tool = {
  slug: string
  title: string
  oneLiner: string
  priceUsd: number
  input: { accepts: string[]; maxSizeMb: number }
  outputExt: string
}

type State =
  | { kind: "idle" }
  | { kind: "previewing" }
  | { kind: "preview_ready"; runId: string; previewMeta: Record<string, number> }
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

function labelize(key: string) {
  const s = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ")
  return s.slice(0, 1).toUpperCase() + s.slice(1)
}

function sortPreviewKeys(keys: string[]) {
  const priority = ["totalRows", "uniqueRows", "duplicates"]
  const rank = new Map(priority.map((k, i) => [k, i]))
  return [...keys].sort((a, b) => {
    const ra = rank.has(a) ? rank.get(a) : 999
    const rb = rank.has(b) ? rank.get(b) : 999
    if (ra !== rb) return ra - rb
    return a.localeCompare(b)
  })
}

export function ToolRunnerView(props: {
  tool: Tool
  fileName: string | null
  constraintsLabel: string
  state: State
  showFilePanel: boolean
  showActions: boolean
  pickFile: () => void
  changeFile: () => void
  resetAll: () => void
  onGeneratePreview: () => void
  onPayAndDownload: () => void
  startDownload: (runId: string) => void
  onDropFile: (f: File) => void
}) {
  const {
    tool,
    fileName,
    constraintsLabel,
    state,
    showFilePanel,
    showActions,
    pickFile,
    changeFile,
    resetAll,
    onGeneratePreview,
    onPayAndDownload,
    startDownload,
    onDropFile
  } = props

  const hasFile = !!fileName

  const downloadLabel = `Download ${tool.outputExt.toUpperCase()}`

  const showDivider = (state.kind === "idle" && hasFile) || state.kind === "preview_ready" || state.kind === "ready"


  return (
    <Card className={ui.card}>
      <CardContent className={ui.cardContent}>
        {showFilePanel ? (
          <div className="space-y-2">
            {!hasFile ? (
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") pickFile()
                }}
                onClick={pickFile}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const f = e.dataTransfer.files?.[0] ?? null
                  if (!f) return
                  onDropFile(f)
                }}
                className={ui.dropzone}
              >
                <div className={ui.dropTitle}>{copy.uploadTitle}</div>
                <div className={ui.dropHint}>{copy.uploadHint}</div>
                <div className={ui.dropMeta}>{constraintsLabel}</div>
              </div>
            ) : (
              <div className={ui.fileName}>
                <span className="block truncate">{fileName}</span>
              </div>
            )}
          </div>
        ) : null}

        {state.kind === "preview_ready" ? (
          <div className="space-y-2">
            <div className={ui.previewText}>
              {sortPreviewKeys(Object.keys(state.previewMeta)).map((k) => (
                <div key={k} className="flex items-baseline justify-between gap-6">
                  <div className="text-sm text-muted-foreground sm:text-base">{labelize(k)}</div>
                  <div className="text-sm font-medium text-foreground sm:text-base">{state.previewMeta[k]}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {state.kind === "processing" ? <div className={ui.status}>{copy.preparing}</div> : null}
        {state.kind === "previewing" ? <div className={ui.subtle}>{copy.analyzing}</div> : null}

        {state.kind === "ready" ? (
          <div className="space-y-2">
            {typeof state.expiresAt === "number" ? (
              <div className={ui.subtle}>{copy.availableUntil(formatExpiry(state.expiresAt))}</div>
            ) : null}
          </div>
        ) : null}

        {state.kind === "expired" ? (
          <div className="space-y-3">
            <div className={ui.status}>This run has expired.</div>
            <Button size="lg" className={ui.primaryBtn} onClick={resetAll}>
              {copy.startOver}
            </Button>
          </div>
        ) : null}

        {state.kind === "error" ? (
          <div className="space-y-3">
            <div className="text-sm text-foreground sm:text-base">{state.message}</div>
            <Button size="lg" className={ui.primaryBtn} onClick={resetAll}>
              {copy.startOver}
            </Button>
          </div>
        ) : null}

        {state.kind !== "expired" && state.kind !== "error" && showActions ? (
          <>
            {showDivider ? <Separator /> : null}

            {state.kind === "idle" && hasFile ? (
              <div className={ui.actions}>
                <Button size="lg" className={ui.primaryBtn} onClick={onGeneratePreview}>
                  {copy.generatePreview}
                </Button>
                <Button variant="link" className={ui.secondaryBtn} onClick={changeFile}>
                  {copy.changeFile}
                </Button>
              </div>
            ) : null}

            {state.kind === "preview_ready" ? (
              <div className={ui.actions}>
                <Button size="lg" className={ui.primaryBtn} onClick={onPayAndDownload}>
                  Pay ${tool.priceUsd} and download
                </Button>
                <Button variant="link" className={ui.secondaryBtn} onClick={changeFile}>
                  {copy.changeFile}
                </Button>
              </div>
            ) : null}

            {state.kind === "ready" ? (
              <div className={ui.actions}>
                <Button size="lg" className={ui.primaryBtn} onClick={() => startDownload(state.runId)}>
                  {downloadLabel}
                </Button>
                <Button variant="link" className={ui.secondaryBtn} onClick={resetAll}>
                  {copy.runAgain}
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function ToolRunner({ tool }: { tool: Tool }) {
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<State>({ kind: "idle" })

  const acceptAttr = useMemo(() => tool.input.accepts.join(","), [tool.input.accepts])
  const maxBytes = tool.input.maxSizeMb * 1024 * 1024

  const fileName = file?.name ?? null
  const constraintsLabel = `Max ${tool.input.maxSizeMb} MB`

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
    setFile(null)
    setState({ kind: "idle" })
    if (inputRef.current) inputRef.current.value = ""
  }

  function startDownload(runId: string) {
    window.location.href = `/download/${runId}`
  }

  function onDropFile(f: File) {
    setFile(f)
    setState({ kind: "idle" })
    if (inputRef.current) inputRef.current.value = ""
  }

  async function resumeFromRun(runId: string) {
    const res = await fetch(`/api/run/${runId}`)
    if (!res.ok) {
      setState({ kind: "idle" })
      return
    }

    const json = await res.json().catch(() => null)
    if (!json) {
      setState({ kind: "idle" })
      return
    }

    if (json.toolSlug !== tool.slug) {
      setState({ kind: "idle" })
      return
    }

    if (json.expired) {
      setState({ kind: "expired" })
      return
    }

    if (json.status === "ready") {
      setState({ kind: "ready", runId: json.id, expiresAt: typeof json.expiresAt === "number" ? json.expiresAt : null })
      return
    }

    if (json.status === "paid") {
      setState({ kind: "processing", runId: json.id })
      return
    }

    if (json.status === "preview_ready") {
      const pm = (json.previewMeta && typeof json.previewMeta === "object") ? json.previewMeta : null
      if (!pm) {
        setState({ kind: "idle" })
        return
      }
      setState({ kind: "preview_ready", runId: json.id, previewMeta: pm as Record<string, number> })
      return
    }

    setState({ kind: "idle" })
  }

  async function onGeneratePreview() {
    if (!file) return
    if (file.size > maxBytes) {
      setState({ kind: "error", message: copy.fileTooLarge(tool.input.maxSizeMb) })
      return
    }

    setState({ kind: "previewing" })

    const fd = new FormData()
    fd.append("file", file)

    const res = await fetch(`/api/preview/${tool.slug}`, { method: "POST", body: fd })
    if (!res.ok) {
      setState({ kind: "error", message: copy.previewFailed })
      return
    }

    const json = await res.json().catch(() => null)
    if (!json || typeof json.runId !== "string" || !json.preview) {
      setState({ kind: "error", message: copy.previewFailed })
      return
    }

    const pm = json.preview && typeof json.preview === "object" ? json.preview : null
    if (!pm) {
      setState({ kind: "error", message: copy.previewFailed })
      return
    }

    setRunInUrl(json.runId)
    setState({ kind: "preview_ready", runId: json.runId, previewMeta: pm as Record<string, number> })
  }

  async function onPayAndDownload() {
    if (state.kind !== "preview_ready") return

    setState({ kind: "processing", runId: state.runId })

    const res = await fetch("/api/unlock", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runId: state.runId })
    })

    if (!res.ok) {
      setState({ kind: "error", message: copy.paymentFailed })
      return
    }

    const json = await res.json().catch(() => null)
    const expiresAt = json && typeof json.expiresAt === "number" ? json.expiresAt : null

    const res2 = await fetch(`/api/process/${tool.slug}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runId: state.runId })
    })

    if (!res2.ok) {
      setState({ kind: "error", message: copy.processingFailed })
      return
    }

    setState({ kind: "ready", runId: state.runId, expiresAt })
    startDownload(state.runId)
  }

  useEffect(() => {
    const runId = searchParams.get("run")
    if (!runId) return
    resumeFromRun(runId)
  }, [])

  return (
    <>
      <main className="mx-auto w-full max-w-2xl px-4 py-14">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight leading-tight sm:text-4xl">{tool.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">{tool.oneLiner}</p>
        </header>

        <input
          ref={inputRef}
          type="file"
          accept={acceptAttr}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null
            if (!f) return
            setFile(f)
            setState({ kind: "idle" })
          }}
        />

        <ToolRunnerView
          tool={tool}
          fileName={fileName}
          constraintsLabel={constraintsLabel}
          state={state}
          showFilePanel={state.kind === "idle" || state.kind === "previewing" || state.kind === "preview_ready"}
          showActions={true}
          pickFile={pickFile}
          changeFile={changeFile}
          resetAll={resetAll}
          onGeneratePreview={onGeneratePreview}
          onPayAndDownload={onPayAndDownload}
          startDownload={startDownload}
          onDropFile={onDropFile}
        />
      </main>
    </>
  )
}
