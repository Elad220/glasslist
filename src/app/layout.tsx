import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/lib/toast/context";
import { ThemeProvider } from "@/lib/theme/context";
import LayoutWrapper from "@/components/LayoutWrapper";
import { SyncNotification } from "@/components/OfflineIndicator";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "GlassList - Beautiful Shopping Lists",
  description: "The most beautiful shopping list app with glassmorphism design and AI-powered features. Organize, shop, and never forget items again.",
  keywords: ["shopping list", "grocery list", "AI", "glassmorphism", "beautiful", "modern"],
  authors: [{ name: "GlassList Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#6366f1",
  icons: {
    icon: '/globe.svg',
    shortcut: '/globe.svg',
    apple: '/globe.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <ToastProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
            <SyncNotification />
            <ServiceWorkerRegistration />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
