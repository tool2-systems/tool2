import { NextResponse } from "next/server"

export function apiError(status: number, code: string, extra?: Record<string, unknown>) {
  const requestId = crypto.randomUUID()
  return NextResponse.json(
    { error: code, requestId, ...(extra ?? {}) },
    { status }
  )
}
