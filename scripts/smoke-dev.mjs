import fs from "node:fs"
import path from "node:path"
import { spawn } from "node:child_process"

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function getJson(url) {
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    return await r.json().catch(() => null)
  } catch {
    return null
  }
}

async function isTool2(base) {
  const j = await getJson(`${base}/api/_smoke`)
  return !!(j && j.ok === true && j.app === "tool2")
}

async function findRunningDevBase() {
  for (let port = 3000; port <= 3010; port++) {
    const base = `http://localhost:${port}`
    if (await isTool2(base)) return base
  }
  return null
}

async function runSmoke(base) {
  const p = spawn("npm", ["run", "smoke"], {
    stdio: "inherit",
    env: { ...process.env, SMOKE_BASE_URL: base }
  })
  p.on("exit", (code) => process.exit(code ?? 1))
}

async function stopChild(child, code) {
  try { child.kill("SIGTERM") } catch {}
  await sleep(150)
  try { child.kill("SIGKILL") } catch {}
  process.exit(code)
}

async function waitForUrlFromStdout(child, ms) {
  let found = null
  const re = /http:\/\/localhost:(\d+)/

  const onData = (buf) => {
    const s = String(buf)
    const m = s.match(re)
    if (m?.[1]) found = `http://localhost:${m[1]}`
  }

  child.stdout?.on("data", onData)
  child.stderr?.on("data", onData)

  const deadline = Date.now() + ms
  while (!found && Date.now() < deadline) await sleep(50)

  child.stdout?.off("data", onData)
  child.stderr?.off("data", onData)

  return found
}

async function waitForTool2(base, ms) {
  const deadline = Date.now() + ms
  while (Date.now() < deadline) {
    if (await isTool2(base)) return true
    await sleep(100)
  }
  return false
}

async function main() {
  const lock = path.join(process.cwd(), ".next", "dev", "lock")

  if (fs.existsSync(lock)) {
    const base = await findRunningDevBase()
    if (!base) {
      process.stderr.write("smoke:dev blocked: lock exists but Tool2 not found on 3000-3010\n")
      process.exit(1)
    }
    await runSmoke(base)
    return
  }

  const dev = spawn("npm", ["run", "dev"], { stdio: ["ignore", "pipe", "pipe"] })

  dev.on("exit", (code) => {
    if (code && code !== 0) process.exit(code)
  })

  const base = (await waitForUrlFromStdout(dev, 20000)) || (await findRunningDevBase())
  if (!base) {
    process.stderr.write("smoke:dev failed: could not detect dev base url\n")
    await stopChild(dev, 1)
    return
  }

  const ok = await waitForTool2(base, 20000)
  if (!ok) {
    process.stderr.write(`smoke:dev failed: Tool2 not reachable at ${base}\n`)
    await stopChild(dev, 1)
    return
  }

  const smoke = spawn("npm", ["run", "smoke"], {
    stdio: "inherit",
    env: { ...process.env, SMOKE_BASE_URL: base }
  })

  smoke.on("exit", async (code) => {
    await stopChild(dev, code ?? 1)
  })
}

main().catch((e) => {
  process.stderr.write(String(e?.stack || e) + "\n")
  process.exit(1)
})
