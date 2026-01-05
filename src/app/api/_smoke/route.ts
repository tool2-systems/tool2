import { apiOk } from "@/lib/api-error"

export async function GET() {
  return apiOk({ ok: true, app: "tool2" })
}
