import Link from "next/link"
import { listTools } from "@/tools"

export default function Page() {
  const tools = listTools()

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-14">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight leading-tight sm:text-4xl">Tool2</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">Pay-per-run utilities.</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight">Tools</h2>

        <ul className="divide-y rounded-xl border bg-card">
          {tools.map((t) => (
            <li key={t.slug} className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link className="block truncate text-base font-semibold hover:underline sm:text-lg" href={`/${t.slug}`}>
                    {t.title}
                  </Link>
                  <div className="mt-1 text-sm text-muted-foreground sm:text-base">{t.oneLiner}</div>
                </div>

                <div className="shrink-0 text-sm font-medium text-muted-foreground sm:text-base">${t.priceUsd}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
