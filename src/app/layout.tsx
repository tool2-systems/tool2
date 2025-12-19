import "./globals.css"

export const metadata = {
  title: "Tool2",
  description: "Pay-per-run utilities."
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
