import { promises as fs } from "fs"
import path from "path"
import { Run } from "./run"
import { runsDir } from "./paths"

export async function saveRun(run: Run) {
  await fs.mkdir(runsDir(), { recursive: true })
  const p = path.join(runsDir(), `${run.id}.json`)
  await fs.writeFile(p, JSON.stringify(run), "utf8")
}

export async function loadRun(id: string) {
  const p = path.join(runsDir(), `${id}.json`)
  const raw = await fs.readFile(p, "utf8")
  return JSON.parse(raw) as Run
}
