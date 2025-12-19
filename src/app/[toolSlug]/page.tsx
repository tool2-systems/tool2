import { notFound } from "next/navigation"
import { getTool } from "@/tools"
import { ToolRunner } from "./ToolRunner"

type Props = { params: Promise<{ toolSlug: string }> }

export default async function ToolPage({ params }: Props) {
  const { toolSlug } = await params
  const tool = getTool(toolSlug)
  if (!tool) return notFound()

  return <ToolRunner tool={tool} />
}
