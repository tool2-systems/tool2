import path from "path"

export function tmpDir() {
  return path.join(process.cwd(), "tmp")
}

export function runsDir() {
  return path.join(tmpDir(), "runs")
}

export function inputsDir() {
  return path.join(tmpDir(), "inputs")
}

export function outputsDir() {
  return path.join(tmpDir(), "outputs")
}
