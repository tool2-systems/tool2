"use client"

import { useMemo, useState } from "react"

type Tool = {
  slug: string
  title: string
  oneLiner: string
  priceUsd: number
  input: { accepts: string[]; maxSizeMb: number }
}

type Preview =
  | { kind: "idle" }
  | { kind: "previewing" }
  | {
      kind: "preview_ready"
      runId: string
      totalRows: number
      uniqueRows: number
      duplicates: number
    }
  | { kind: "paid"; runId: string }
  | { kind: "processing"; runId: string }
  | { kind: "ready"; runId: string }
  | { kind: "error"; message: string }

export function ToolRunner({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<Preview>({ kind: "idle" })

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

  async function onPay() {
    if (state.kind !== "preview_ready") return
    const res = await fetch("/api/unlock", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runId: state.runId })
    })
    if (!res.ok) {
      setState({ kind: "error", message: "Payment failed." })
      return
    }
    setState({ kind: "paid", runId: state.runId })
  }

  async function onProcess() {
    if (state.kind !== "paid") return
    setState({ kind: "processing", runId: state.runId })
    const res = await fetch(`/api/process/${tool.slug}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runId: state.runId })
    })
    if (!res.ok) {
      setState({ kind: "error", message: "Processing failed." })
      return
    }
    setState({ kind: "ready", runId: state.runId })
  }

  function onDownload() {
    if (state.kind !== "ready") return
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
            <div>
              {state.uniqueRows} rows will remain out of {state.totalRows}.
            </div>
          </div>
        )}
        {state.kind === "error" && <div>{state.message}</div>}
      </section>

      <section>
        <h2>Paywall</h2>
        <button onClick={onPay} disabled={state.kind !== "preview_ready"}>
          Pay ${tool.priceUsd} to download clean CSV
        </button>
      </section>

      <section>
        <h2>Delivery</h2>
        <button onClick={onProcess} disabled={state.kind !== "paid"}>
          Prepare file
        </button>
        <button onClick={onDownload} disabled={state.kind !== "ready"}>
          Download file
        </button>
      </section>

      <footer>
        <small>Save this link if you need it again.</small>
      </footer>
    </main>
  )
}
