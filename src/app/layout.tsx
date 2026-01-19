/**
 * Root Layout - taxbook-pro
 * Generated: 2026-01-19
 *
 * Main application layout with metadata and global styles.
 * Wraps entire application with Providers (Auth, Query, Toast, i18n).
 * Place this in: app/layout.tsx
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
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
  title: "taxbook-pro",
  description: "Welcome to taxbook-pro",
  openGraph: {
    title: "taxbook-pro",
    description: "Welcome to taxbook-pro",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "taxbook-pro",
    description: "Welcome to taxbook-pro",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
