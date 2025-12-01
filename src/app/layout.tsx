import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tool2",
  description: "Deterministic file and data tools.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="flex min-h-screen flex-col">
          <header className="border-b">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
              <div className="text-base font-medium tracking-tight">
                Tool2
              </div>
              <nav className="flex items-center gap-6" />
            </div>
          </header>
          <main className="flex-1">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
              {children}
            </div>
          </main>
          <footer className="border-t">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-4">
              <p className="text-xs text-muted-foreground">© Tool2</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
