"use client"

import { useMemo, useState } from "react"

type Tool = {
  slug: string
  title: string
  oneLiner: string
  priceUsd: number
  input: { accepts: string[]; maxSizeMb: number }
}

type PreviewState =
  | { kind: "idle" }
  | { kind: "previewing" }
  | { kind: "preview_ready"; runId: string; preview: Record<string, number> }
  | { kind: "paid"; runId: string; preview: Record<string, number> }
  | { kind: "processing"; runId: string; preview: Record<string, number> }
  | { kind: "ready"; runId: string; preview: Record<string, number> }
  | { kind: "error"; message: string }

export function ToolRunner({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<PreviewState>({ kind: "idle" })

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
    setState({ kind: "preview_ready", runId: json.runId, preview: json.preview })
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
    setState({ kind: "paid", runId: state.runId, preview: state.preview })
  }

  async function onProcess() {
    if (state.kind !== "paid") return
    setState({ kind: "processing", runId: state.runId, preview: state.preview })
    const res = await fetch(`/api/process/${tool.slug}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runId: state.runId })
    })
    if (!res.ok) {
      setState({ kind: "error", message: "Processing failed." })
      return
    }
    setState({ kind: "ready", runId: state.runId, preview: state.preview })
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
            const f = e.target.files?.[0] ?? null
            setFile(f)
            setState({ kind: "idle" })
          }}
        />
        <button onClick={onGeneratePreview} disabled={!file || state.kind === "previewing"}>
          Generate preview
        </button>
      </section>

      <section>
        <h2>Preview</h2>
        {state.kind === "idle" && <div>Not generated</div>}
        {state.kind === "previewing" && <div>Generating…</div>}
        {state.kind === "error" && <div>{state.message}</div>}
        {(state.kind === "preview_ready" ||
          state.kind === "paid" ||
          state.kind === "processing" ||
          state.kind === "ready") && (
          <div>
            <div>runId: {state.runId}</div>
            <ul>
              {Object.entries(state.preview).map(([k, v]) => (
                <li key={k}>
                  {k}: {v}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section>
        <h2>Paywall</h2>
        <button onClick={onPay} disabled={state.kind !== "preview_ready"}>
          Pay to download (${tool.priceUsd})
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
