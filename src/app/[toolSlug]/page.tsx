import { notFound } from "next/navigation"
import { getTool } from "@/tools"

type Props = { params: Promise<{ toolSlug: string }> }

export default async function ToolPage({ params }: Props) {
  const { toolSlug } = await params
  const tool = getTool(toolSlug)
  if (!tool) return notFound()

  return (
    <main>
      <h1>{tool.title}</h1>
      <p>{tool.oneLiner}</p>
      <section>
        <h2>Input</h2>
        <div>Upload</div>
      </section>
      <section>
        <h2>Preview</h2>
        <div>Not generated</div>
      </section>
      <section>
        <h2>Paywall</h2>
        <button>Pay to download (${tool.priceUsd})</button>
      </section>
      <section>
        <h2>Delivery</h2>
        <button disabled>Download file</button>
      </section>
      <footer>
        <small>Save this link if you need it again.</small>
      </footer>
    </main>
  )
}
