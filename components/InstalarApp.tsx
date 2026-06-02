"use client";

import { useEffect, useState } from "react";

export default function InstalarApp() {
  const [eventoInstalacao, setEventoInstalacao] = useState<any>(null);
  const [mostrarBotao, setMostrarBotao] = useState(false);

  useEffect(() => {
    function prepararInstalacao(event: any) {
      event.preventDefault();
      setEventoInstalacao(event);
      setMostrarBotao(true);
    }

    window.addEventListener("beforeinstallprompt", prepararInstalacao);

    return () => {
      window.removeEventListener("beforeinstallprompt", prepararInstalacao);
    };
  }, []);

  async function instalar() {
    if (!eventoInstalacao) {
      alert("Se o botão não funcionar, use o menu do navegador e toque em 'Adicionar à tela inicial'.");
      return;
    }

    eventoInstalacao.prompt();

    await eventoInstalacao.userChoice;

    setEventoInstalacao(null);
    setMostrarBotao(false);
  }

  if (!mostrarBotao) return null;

  return (
    <button
      type="button"
      onClick={instalar}
      className="bg-green-700 hover:bg-green-800 px-5 py-4 rounded-xl font-semibold text-center w-full md:w-auto"
    >
      📱 Instalar App
    </button>
  );
}