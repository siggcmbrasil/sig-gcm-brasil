import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIG-GCM Brasil",
  description: "Sistema Integrado das Guardas Municipais",
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