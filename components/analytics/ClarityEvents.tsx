"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    clarity?: (...args: any[]) => void;
  }
}

export default function ClarityEvents() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest("a,button");

      if (!el) return;

      const texto = (el.textContent || "").toLowerCase();

      if (typeof window.clarity !== "function") return;

      if (texto.includes("solicitar demonstra")) {
        window.clarity("event", "Solicitar_Demonstracao");
      }

      if (texto.includes("telegram")) {
        window.clarity("event", "Telegram");
      }

      if (texto.includes("acessar sistema")) {
        window.clarity("event", "Acessar_Sistema");
      }

      if (texto.includes("login")) {
        window.clarity("event", "Login");
      }

      if (texto.includes("cadastro")) {
        window.clarity("event", "Cadastro");
      }

      if (texto.includes("baixar")) {
        window.clarity("event", "Download");
      }
    };

    document.addEventListener("click", handler);

    return () => {
      document.removeEventListener("click", handler);
    };
  }, []);

  return null;
}