"use client"

import { useMemo, useState } from "react"

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
  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<State>({ kind: "idle" })

  const acceptAttr = useMemo(() => tool.input.accepts.join(","), [tool.input.accepts])
  const maxBytes = tool.input.maxSizeMb * 1024 * 1024

  async function onGeneratePreview() {
    if (!file) return
    if (file.size > maxBytes) {
      setState({ kind: "error", message: `File too large. Max ${tool.input.maxSizeMb} MB.` })
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

    setState({ kind: "ready", runId: state.runId })
    window.location.href = `/download/${state.runId}`
  }

  return (
    <main>
      <h1>{tool.title}</h1>
      <p>{tool.oneLiner}</p>

      <section>
        <h2>Input</h2>
        <input
          type="file"
          accept={acceptAttr}
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null)
            setState({ kind: "idle" })
          }}
        />
        <button onClick={onGeneratePreview} disabled={!file || state.kind === "previewing"}>
          Generate preview
        </button>
      </section>

      <section>
        <h2>Preview</h2>
        {state.kind === "idle" && <div>Upload a file to see what will change.</div>}
        {state.kind === "previewing" && <div>Analyzing file…</div>}
        {state.kind === "preview_ready" && (
          <div>
            <div>{state.duplicates} duplicate rows will be removed.</div>
            <div>{state.uniqueRows} rows will remain out of {state.totalRows}.</div>
          </div>
        )}
        {state.kind === "processing" && <div>Preparing your file…</div>}
        {state.kind === "error" && <div>{state.message}</div>}
      </section>

      <section>
        <h2>Download</h2>
        <button onClick={onPayAndDownload} disabled={state.kind !== "preview_ready"}>
          Pay ${tool.priceUsd} and download
        </button>
      </section>

      <footer>
        <small>Save this link if you need it again.</small>
      </footer>
    </main>
  )
}
