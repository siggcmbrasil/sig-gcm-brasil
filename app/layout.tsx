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
      <body>
        {children}

        <footer className="text-center text-sm text-gray-500 py-4 border-t mt-8">
          <p>SIG-GCM Brasil © 2026</p>
          <p>Suporte: suporte@siggcmbrasil.com</p>
          <p>Comercial: comercial@siggcmbrasil.com</p>
        </footer>
      </body>
    </html>
  );
}