import { ToolRunnerView } from "@/components/tool-runner/ToolRunner"

const tool = {
  slug: "remove-duplicate-csv",
  title: "Remove duplicate rows from CSV",
  oneLiner: "",
  priceUsd: 2,
  input: { accepts: ["text/csv"], maxSizeMb: 10 }
}

export default function UiPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-14 space-y-10">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight leading-tight sm:text-4xl">UI</h1>
        <p className="text-sm text-muted-foreground sm:text-base">ToolRunner states</p>
      </header>

      <section className="space-y-6">
        <div className="text-sm font-medium text-muted-foreground">Idle (no file)</div>
        <ToolRunnerView
          tool={tool}
          fileName={null}
          constraintsLabel="Max 10 MB"
          state={{ kind: "idle" }}
          showFilePanel={true}
          showActions={false}
          pickFile={() => {}}
          changeFile={() => {}}
          resetAll={() => {}}
          onGeneratePreview={() => {}}
          onPayAndDownload={() => {}}
          startDownload={() => {}}
          onDropFile={() => {}}
        />
      </section>

      <section className="space-y-6">
        <div className="text-sm font-medium text-muted-foreground">Idle (file selected)</div>
        <ToolRunnerView
          tool={tool}
          fileName="example.csv"
          constraintsLabel="Max 10 MB"
          state={{ kind: "idle" }}
          showFilePanel={true}
          showActions={true}
          pickFile={() => {}}
          changeFile={() => {}}
          resetAll={() => {}}
          onGeneratePreview={() => {}}
          onPayAndDownload={() => {}}
          startDownload={() => {}}
          onDropFile={() => {}}
        />
      </section>

      <section className="space-y-6">
        <div className="text-sm font-medium text-muted-foreground">Preview ready</div>
        <ToolRunnerView
          tool={tool}
          fileName="example.csv"
          constraintsLabel="Max 10 MB"
          state={{ kind: "preview_ready", runId: "demo", totalRows: 100, uniqueRows: 92, duplicates: 8 }}
          showFilePanel={true}
          showActions={true}
          pickFile={() => {}}
          changeFile={() => {}}
          resetAll={() => {}}
          onGeneratePreview={() => {}}
          onPayAndDownload={() => {}}
          startDownload={() => {}}
          onDropFile={() => {}}
        />
      </section>

      <section className="space-y-6">
        <div className="text-sm font-medium text-muted-foreground">Ready</div>
        <ToolRunnerView
          tool={tool}
          fileName="example.csv"
          constraintsLabel="Max 10 MB"
          state={{ kind: "ready", runId: "demo", expiresAt: Date.now() + 60 * 60 * 1000 }}
          showFilePanel={false}
          showActions={true}
          pickFile={() => {}}
          changeFile={() => {}}
          resetAll={() => {}}
          onGeneratePreview={() => {}}
          onPayAndDownload={() => {}}
          startDownload={() => {}}
          onDropFile={() => {}}
        />
      </section>
    </main>
  )
}
