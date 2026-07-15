import type { Metadata, Viewport } from "next";
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "SIG-GCM Brasil",
  description: "Sistema Integrado das Guardas Municipais",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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

        {/* Microsoft Clarity */}
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)}
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)
            })(window, document, "clarity", "script", "xmwpfk2l60");
          `}
        </Script>

        {/* Eventos automáticos do Clarity */}
        <Script id="clarity-events" strategy="afterInteractive">
          {`
            document.addEventListener("click", function(e) {
              const el = e.target.closest("a,button");
              if (!el || typeof clarity !== "function") return;

              const texto = (el.innerText || "").trim().toLowerCase();

              if (texto.includes("solicitar demonstra")) {
                clarity("event", "Solicitar_Demonstracao");
              }

              if (texto.includes("telegram")) {
                clarity("event", "Telegram");
              }

              if (texto.includes("acessar sistema")) {
                clarity("event", "Acessar_Sistema");
              }

              if (texto.includes("login")) {
                clarity("event", "Login");
              }

              if (texto.includes("cadastro")) {
                clarity("event", "Cadastro");
              }

              if (texto.includes("baixar")) {
                clarity("event", "Download");
              }
            });
          `}
        </Script>
      </body>
    </html>
  );
}