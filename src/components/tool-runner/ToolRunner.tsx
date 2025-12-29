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
          <div className={ui.previewText}>
            <div>{copy.previewRemoved(state.duplicates)}</div>
            <div>{copy.previewRemain(state.uniqueRows, state.totalRows)}</div>
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
            <Separator />

            {state.kind === "idle" && hasFile ? (
              <div className={ui.actions}>
                <Button size="lg" className={ui.primaryBtn} onClick={onGeneratePreview}>
                  {copy.generatePreview}
                </Button>
                <Button variant="secondary" className={ui.secondaryBtn} onClick={changeFile}>
                  {copy.changeFile}
                </Button>
              </div>
            ) : null}

            {state.kind === "preview_ready" ? (
              <div className={ui.actions}>
                <Button size="lg" className={ui.primaryBtn} onClick={onPayAndDownload}>
                  Pay ${tool.priceUsd} and download
                </Button>
                <Button variant="secondary" className={ui.secondaryBtn} onClick={changeFile}>
                  {copy.changeFile}
                </Button>
              </div>
            ) : null}

            {state.kind === "ready" ? (
              <div className={ui.actions}>
                <Button size="lg" className={ui.primaryBtn} onClick={() => startDownload(state.runId)}>
                  {copy.downloadCsv}
                </Button>
                <Button variant="secondary" className={ui.secondaryBtn} onClick={resetAll}>
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
        setState({ kind: "error", message: copy.processingFailed })
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
      setState({ kind: "error", message: copy.previewFailed })
      return
    }

    const json = await res.json().catch(() => null)
    if (!json?.runId) {
      setState({ kind: "error", message: copy.previewFailed })
      return
    }

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
      setState({ kind: "error", message: copy.paymentFailed })
      return
    }

    const proc = await fetch(`/api/process/${tool.slug}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runId: state.runId })
    })

    if (!proc.ok) {
      setState({ kind: "error", message: copy.processingFailed })
      return
    }

    const r = await fetch(`/api/run/${state.runId}`)
    const j = await r.json().catch(() => null)
    const expiresAt = j?.expiresAt ?? null

    setState({ kind: "ready", runId: state.runId, expiresAt })
    startDownload(state.runId)
  }

  const showFilePanel = state.kind !== "processing" && state.kind !== "ready" && state.kind !== "expired" && state.kind !== "error"
  const showActions = (state.kind === "idle" && !!file) || state.kind === "preview_ready" || state.kind === "ready"

  return (
    <main className={ui.page}>
      <header className={ui.header}>
        <h1 className={ui.title}>{tool.title}</h1>
      </header>

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

      <ToolRunnerView
        tool={tool}
        fileName={fileName}
        constraintsLabel={constraintsLabel}
        state={state}
        showFilePanel={showFilePanel}
        showActions={showActions}
        pickFile={pickFile}
        changeFile={changeFile}
        resetAll={resetAll}
        onGeneratePreview={onGeneratePreview}
        onPayAndDownload={onPayAndDownload}
        startDownload={startDownload}
        onDropFile={onDropFile}
      />
    </main>
  )
}
