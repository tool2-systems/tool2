import { spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:3000"

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function http(method, url, { headers, body } = {}) {
  const res = await fetch(url, { method, headers, body })
  const text = await res.text()
  return { res, text }
}

async function postPreview(toolSlug, csvText) {
  const fd = new FormData()
  const blob = new Blob([csvText], { type: "text/csv" })
  fd.append("file", blob, "test.csv")
  const { res, text } = await http("POST", `${baseUrl}/api/preview/${toolSlug}`, { body: fd })
  if (!res.ok) throw new Error(`preview ${toolSlug} failed: ${res.status} ${text}`)
  const json = JSON.parse(text)
  if (!json.runId) throw new Error(`preview ${toolSlug} missing runId: ${text}`)
  return json.runId
}

async function postUnlock(runId) {
  const { res, text } = await http("POST", `${baseUrl}/api/unlock`, {
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ runId })
  })
  if (!res.ok) throw new Error(`unlock failed: ${res.status} ${text}`)
}

async function postProcess(toolSlug, runId) {
  const { res, text } = await http("POST", `${baseUrl}/api/process/${toolSlug}`, {
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ runId })
  })
  if (!res.ok) throw new Error(`process ${toolSlug} failed: ${res.status} ${text}`)
}

async function getDownload(runId) {
  const { res, text } = await http("GET", `${baseUrl}/download/${runId}`)
  if (!res.ok) throw new Error(`download failed: ${res.status} ${text}`)
  return { text, headers: Object.fromEntries(res.headers.entries()) }
}

async function run() {
  const tmpCsv = `email\na@example.com\nb@example.com\na@example.com\n`

  const r1 = await postPreview("remove-duplicate-csv", tmpCsv)
  await postUnlock(r1)
  await postProcess("remove-duplicate-csv", r1)
  const d1 = await getDownload(r1)

  if (!d1.headers["content-type"]?.includes("text/csv")) {
    throw new Error(`remove-duplicate-csv content-type unexpected: ${d1.headers["content-type"]}`)
  }
  const lines1 = d1.text.trim().split("\n")
  if (lines1.length !== 3) {
    throw new Error(`remove-duplicate-csv expected 3 lines after dedupe, got ${lines1.length}\n${d1.text}`)
  }

  const r2 = await postPreview("count-csv-rows", tmpCsv)
  await postUnlock(r2)
  await postProcess("count-csv-rows", r2)
  const d2 = await getDownload(r2)

  if (!d2.headers["content-type"]?.includes("text/csv")) {
    throw new Error(`count-csv-rows content-type unexpected: ${d2.headers["content-type"]}`)
  }
  const lines2 = d2.text.trim().split("\n")
  if (lines2.length !== 4) {
    throw new Error(`count-csv-rows expected 4 lines (passthrough), got ${lines2.length}\n${d2.text}`)
  }

  process.stdout.write("SMOKE OK\n")
}

run().catch((e) => {
  process.stderr.write(`SMOKE FAIL: ${e?.message || e}\n`)
  process.exit(1)
})
