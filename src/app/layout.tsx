/**
 * Root Layout - taxbook-pro
 * Generated: 2026-01-19
 *
 * Main application layout with metadata and global styles.
 * Wraps entire application with Providers (Auth, Query, Toast, i18n).
 * Place this in: app/layout.tsx
 */

import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

// Display font - Editorial, trustworthy serifs for headings
const displayFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// Body font - Clean, modern, highly readable
const bodyFont = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// Mono font - For code and data
const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "TaxBook Pro | Smart Scheduling for Tax Professionals",
    template: "%s | TaxBook Pro",
  },
  description: "Streamline your tax practice with intelligent scheduling, client management, and document organization. Built for modern tax professionals.",
  keywords: ["tax software", "tax scheduling", "tax professional", "client management", "tax practice"],
  openGraph: {
    title: "TaxBook Pro | Smart Scheduling for Tax Professionals",
    description: "Streamline your tax practice with intelligent scheduling, client management, and document organization.",
    type: "website",
    siteName: "TaxBook Pro",
  },
  twitter: {
    card: "summary_large_image",
    title: "TaxBook Pro | Smart Scheduling for Tax Professionals",
    description: "Streamline your tax practice with intelligent scheduling, client management, and document organization.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} font-body antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
