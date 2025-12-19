import Link from "next/link"
import { tools } from "@/tools"

export default function Page() {
  return (
    <main>
      <h1>Tool2</h1>
      <ul>
        {tools.map(t => (
          <li key={t.slug}>
            <Link href={`/${t.slug}`}>{t.title}</Link>
            <div>{t.oneLiner}</div>
            <div>${t.priceUsd}</div>
          </li>
        ))}
      </ul>
    </main>
  )
}
