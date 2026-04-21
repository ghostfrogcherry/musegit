import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { PlayerProvider } from "@/lib/player-context";

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-body"
});

const displayFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "ChuneUp | Music Review Workspace for Bands and Producers",
  description: "ChuneUp is a private music workflow app for organizing albums, songs, versions, timestamped feedback, and approvals in one place."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${monoFont.variable} ${displayFont.variable}`}>
        <PlayerProvider>{children}</PlayerProvider>
      </body>
    </html>
  );
}
