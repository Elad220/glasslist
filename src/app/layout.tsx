import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/lib/toast/context";
import { UndoRedoProvider } from "@/lib/undo-redo/context";
import LayoutWrapper from "@/components/LayoutWrapper";

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export const metadata: Metadata = {
  title: "GlassList - Beautiful Shopping Lists",
  description: "The most beautiful shopping list app with glassmorphism design and AI-powered features. Organize, shop, and never forget items again.",
  keywords: ["shopping list", "grocery list", "AI", "glassmorphism", "beautiful", "modern"],
  authors: [{ name: "GlassList Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#6366f1",
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
          <UndoRedoProvider>
            {isDemoMode && (
              <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white text-center py-2 text-sm font-medium z-[9999]">
                🎨 Demo Mode - Explore the beautiful glassmorphism interface!
              </div>
            )}
            <div className={isDemoMode ? 'pt-10' : ''}>
              <LayoutWrapper>{children}</LayoutWrapper>
            </div>
          </UndoRedoProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
