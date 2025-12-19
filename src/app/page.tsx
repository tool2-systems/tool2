import Link from "next/link"
import { tools } from "@/tools"

export default function Page() {
  return (
    <main>
      <h1>Tool2</h1>
      <p>Pay-per-run utilities.</p>
      <section>
        <h2>Tools</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {tools.map((t) => (
            <li key={t.slug} style={{ padding: "12px 0", borderTop: "1px solid var(--border)" }}>
              <Link href={`/${t.slug}`} style={{ fontWeight: 700 }}>
                {t.title}
              </Link>
              <div style={{ color: "var(--muted)", marginTop: 4 }}>{t.oneLiner}</div>
              <div style={{ marginTop: 6, fontSize: 13, color: "var(--muted)" }}>${t.priceUsd} per run</div>
            </li>
          ))}
        </ul>
      </section>
      <footer>Save this link if you need it again.</footer>
    </main>
  )
}
