import type { Metadata } from "next";
import { IBM_Plex_Mono, Sora, Syne } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
});

const plex = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
});

export const metadata: Metadata = {
  title: "Monad Agent Desk | Metropolis",
  description:
    "Open TypeScript agent tooling on Monad for Trust, Identity and AI Infrastructure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sora.variable} ${syne.variable} ${plex.variable} antialiased`}
        style={
          {
            ["--sans" as string]: "var(--font-sora), system-ui, sans-serif",
            ["--display" as string]: "var(--font-syne), var(--font-sora), sans-serif",
            ["--mono" as string]: "var(--font-plex), ui-monospace, monospace",
          } as React.CSSProperties
        }
      >
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
