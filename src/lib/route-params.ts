export async function getToolSlugFromParams(params: unknown): Promise<string> {
  const p = (params instanceof Promise ? await params : params) as { toolSlug?: unknown } | null
  const toolSlug = typeof p?.toolSlug === "string" ? p.toolSlug : ""
  return toolSlug
}
