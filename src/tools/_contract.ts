export type ToolContract = {
  slug: string
  title: string
  oneLiner: string
  priceUsd: number
  input: {
    accepts: string[]
    maxSizeMb: number
  }
}
