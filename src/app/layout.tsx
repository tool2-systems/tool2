import "./globals.css"
import Link from "next/link"

export const metadata = {
  title: "Tool2",
  description: "Pay-per-run utilities."
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        {children}
        <div className="mx-auto w-full max-w-2xl px-4 pb-8">
          <div className="border-t pt-3 text-xs text-muted-foreground">
            <Link href="/terms">Terms</Link>
            <span className="px-2">•</span>
            <Link href="/privacy">Privacy</Link>
            <span className="px-2">•</span>
            <Link href="/support">Support</Link>
          </div>
        </div>
      </body>
    </html>
  )
}
