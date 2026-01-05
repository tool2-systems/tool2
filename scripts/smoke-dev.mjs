import { spawn } from "node:child_process"

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function waitForOk(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { method: "HEAD" })
      if (res.ok) return true
    } catch {}
    await sleep(250)
  }
  return false
}

function parsePortFromLine(line) {
  const m = line.match(/http:\/\/localhost:(\d+)/)
  return m ? Number(m[1]) : null
}

async function main() {
  const dev = spawn("npm", ["run", "dev"], {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, FORCE_COLOR: "0" }
  })

  let port = 3000
  let sawUrl = false

  const onLine = (chunk) => {
    const s = chunk.toString("utf8")
    process.stdout.write(s)
    const lines = s.split(/\r?\n/)
    for (const line of lines) {
      const p = parsePortFromLine(line)
      if (p) {
        port = p
        sawUrl = true
      }
    }
  }

  dev.stdout.on("data", onLine)
  dev.stderr.on("data", onLine)

  const stop = async (code) => {
    try { dev.kill("SIGINT") } catch {}
    await sleep(250)
    try { dev.kill("SIGKILL") } catch {}
    process.exit(code)
  }

  const deadline = Date.now() + 15000
  while (!sawUrl && Date.now() < deadline) await sleep(50)

  const base = `http://localhost:${port}`
  const ok = await waitForOk(`${base}/`)
  if (!ok) {
    process.stderr.write(`smoke:dev failed: server not reachable at ${base}\n`)
    await stop(1)
    return
  }

  const smoke = spawn("npm", ["run", "smoke"], {
    stdio: "inherit",
    env: { ...process.env, SMOKE_BASE_URL: base }
  })

  smoke.on("exit", async (code) => {
    await stop(code ?? 1)
  })
}

main().catch((e) => {
  process.stderr.write(String(e?.stack || e) + "\n")
  process.exit(1)
})
