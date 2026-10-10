import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { APP_FULL_NAME, APP_TAGLINE } from "@/lib/config";

export const metadata: Metadata = {
  title: `${APP_FULL_NAME} — ${APP_TAGLINE}`,
  description: `${APP_FULL_NAME} is a modern self-custodial web wallet. Import your wallet and earn 2% APR on every stake.`,
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0b0b12",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-dvh antialiased gradient-bg relative overflow-x-hidden">
        <div className="aurora" aria-hidden="true" />
        <div className="grid-overlay" aria-hidden="true" />
        <div className="aurora-vignette" aria-hidden="true" />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
