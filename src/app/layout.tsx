import "./globals.css"
import Link from "next/link"
import "@/lib/server-bootstrap"

export const metadata = {
  title: "Tool2",
  description: "Pay-per-run utilities."
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        {children}

        <footer className="mx-auto w-full max-w-2xl px-4 pb-10">
          <nav
            aria-label="Legal"
            className="flex justify-center gap-8 text-sm text-muted-foreground"
          >
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link href="/support" className="transition-colors hover:text-foreground">
              Support
            </Link>
          </nav>
        </footer>
      </body>
    </html>
  )
}
