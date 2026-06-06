import type { Metadata, Viewport } from "next";
import "./globals.css";
import FetchSanitizer from "@/components/FetchSanitizer";

export const metadata: Metadata = {
  title: "Otavio Fontes | Personal e Consultoria-ON",
  description: "Plataforma de treinos personalizados — Otavio Fontes Personal e Consultoria-ON",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OF Personal",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full flex flex-col antialiased">
        <FetchSanitizer />
        {children}
      </body>
    </html>
  );
}
