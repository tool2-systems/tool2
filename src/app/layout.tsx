import "./globals.css"
import Link from "next/link"

export const metadata = {
  title: "Tool2",
  description: "Pay-per-run utilities."
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <div style={{ maxWidth: "var(--maxw)", margin: "0 auto", padding: "0 16px 28px" }}>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, fontSize: 13, color: "var(--muted)" }}>
            <Link href="/terms">Terms</Link>
            <span style={{ padding: "0 10px" }}>•</span>
            <Link href="/privacy">Privacy</Link>
            <span style={{ padding: "0 10px" }}>•</span>
            <Link href="/support">Support</Link>
          </div>
        </div>
      </body>
    </html>
  )
}
