import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIG-GCM Biritinga",
  description: "Sistema Integrado da Guarda Civil Municipal",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}