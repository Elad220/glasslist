import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/lib/toast/context";
import LayoutWrapper from "@/components/LayoutWrapper";
import { OfflineProvider } from "@/components/OfflineProvider";

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export const metadata: Metadata = {
  title: "GlassList - Beautiful Shopping Lists",
  description: "The most beautiful shopping list app with glassmorphism design and AI-powered features. Organize, shop, and never forget items again.",
  keywords: ["shopping list", "grocery list", "AI", "glassmorphism", "beautiful", "modern", "offline", "PWA"],
  authors: [{ name: "GlassList Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#6366f1",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GlassList"
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <ToastProvider>
          <OfflineProvider>
            {isDemoMode && (
              <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white text-center py-2 text-sm font-medium z-[9999]">
                🎨 Demo Mode - Explore the beautiful glassmorphism interface!
              </div>
            )}
            <div className={isDemoMode ? 'pt-10' : ''}>
              <LayoutWrapper>{children}</LayoutWrapper>
            </div>
          </OfflineProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
