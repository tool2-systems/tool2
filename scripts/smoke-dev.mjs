import { spawn } from "node:child_process"

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function isTool2(base) {
  try {
    const res = await fetch(`${base}/api/smoke`, { method: "GET" })
    if (!res.ok) return false
    const j = await res.json().catch(() => null)
    return !!j && j.ok === true && j.app === "tool2"
  } catch {
    return false
  }
}

async function waitForTool2(base, ms) {
  const deadline = Date.now() + ms
  while (Date.now() < deadline) {
    if (await isTool2(base)) return true
    await sleep(100)
  }
  return false
}

function runSmoke(base) {
  return new Promise((resolve) => {
    const p = spawn("npm", ["run", "smoke"], {
      stdio: "inherit",
      env: { ...process.env, SMOKE_BASE_URL: base }
    })
    p.on("exit", (code) => resolve(code ?? 1))
  })
}

async function stopChild(p, code) {
  if (!p || p.killed) process.exit(code)
  p.kill("SIGINT")
  const deadline = Date.now() + 2000
  while (Date.now() < deadline && !p.killed) await sleep(50)
  try { p.kill("SIGKILL") } catch {}
  process.exit(code)
}

async function main() {
  const ports = [3000, 3001, 3999]
  for (const port of ports) {
    const base = `http://localhost:${port}`
    if (await isTool2(base)) {
      const code = await runSmoke(base)
      process.exit(code)
    }
  }

  const port = Number(process.env.SMOKE_DEV_PORT || "3999")
  const base = `http://localhost:${port}`

  const dev = spawn("npm", ["run", "dev"], {
    stdio: "inherit",
    env: { ...process.env, PORT: String(port) }
  })

  const ok = await waitForTool2(base, 20000)
  if (!ok) {
    process.stderr.write(`smoke:dev failed: Tool2 not reachable at ${base}\n`)
    await stopChild(dev, 1)
    return
  }

  const code = await runSmoke(base)
  await stopChild(dev, code)
}

main().catch((e) => {
  process.stderr.write(String(e?.stack || e) + "\n")
  process.exit(1)
})
