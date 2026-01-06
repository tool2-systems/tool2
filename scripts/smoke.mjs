const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:3000"

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function postPreview(toolSlug, filePath) {
  const form = new FormData()
  const buf = await Bun.file(filePath).arrayBuffer().catch(async () => {
    const fs = await import("node:fs/promises")
    return (await fs.readFile(filePath)).buffer
  })

  const blob = new Blob([buf], { type: "text/csv" })
  form.append("file", blob, "input.csv")

  const res = await fetch(`${baseUrl}/api/preview/${toolSlug}`, { method: "POST", body: form })
  const text = await res.text()
  if (!res.ok) throw new Error(`preview ${toolSlug} failed: ${res.status} ${text}`)
  const json = JSON.parse(text)
  return { runId: json.runId }
}

async function postUnlock(runId) {
  const res = await fetch(`${baseUrl}/api/unlock`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ runId })
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`unlock failed: ${res.status} ${text}`)
}

async function postProcess(toolSlug, runId) {
  const res = await fetch(`${baseUrl}/api/process/${toolSlug}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ runId })
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`process ${toolSlug} failed: ${res.status} ${text}`)
}

async function getDownload(runId) {
  const res = await fetch(`${baseUrl}/download/${runId}`)
  const text = await res.text()
  const headers = Object.fromEntries(res.headers.entries())
  if (!res.ok) throw new Error(`download failed: ${res.status} ${text}`)
  return { text, headers }
}

async function run() {
  const os = await import("node:os")
  const fs = await import("node:fs/promises")
  const path = await import("node:path")

  const tmpCsv = path.join(os.tmpdir(), `tool2-smoke-${Date.now()}.csv`)
  await fs.writeFile(tmpCsv, ["email", "a@example.com", "b@example.com", "a@example.com"].join("\n"), "utf8")

  const r1 = await postPreview("remove-duplicate-csv", tmpCsv)
  await postUnlock(r1.runId)
  await postProcess("remove-duplicate-csv", r1.runId)
  const d1 = await getDownload(r1.runId)

  if (!d1.headers["content-type"]?.includes("text/csv")) {
    throw new Error(`remove-duplicate-csv content-type unexpected: ${d1.headers["content-type"]}`)
  }

  const lines1 = d1.text.trim().split("\n")
  if (lines1.length !== 3) {
    throw new Error(`remove-duplicate-csv expected 3 lines after dedupe, got ${lines1.length}\n${d1.text}`)
  }

  process.stdout.write("SMOKE OK\n")
}

run().catch((e) => {
  process.stderr.write(`SMOKE FAIL: ${e?.message || e}\n`)
  process.exit(1)
})
