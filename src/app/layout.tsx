import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Harmonic Life",
  description: "A musical zero-player game — cellular automata driven by music theory",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <nav
          aria-label="Legal links"
          className="fixed bottom-2 right-3 z-[1000] flex gap-2 rounded bg-black/40 px-2 py-1 text-[11px] text-white/60 backdrop-blur-sm"
        >
          <a className="hover:text-white" href="/privacy">Privacy</a>
          <a className="hover:text-white" href="mailto:timcao.support@gmail.com">Contact</a>
        </nav>
      </body>
    </html>
  );
}
