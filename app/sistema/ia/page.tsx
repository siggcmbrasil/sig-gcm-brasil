"use client";

import { useState } from "react";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function IAConsultaPage() {
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [gravando, setGravando] = useState(false);

  async function consultarIA(texto?: string) {
    const perguntaFinal = texto || pergunta;

    if (!perguntaFinal.trim()) return;

    setCarregando(true);
    setResposta("");

    try {
      const res = await fetch("/api/ia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  pergunta: perguntaFinal,
  usuario: JSON.parse(localStorage.getItem("usuarioLogado") || "{}"),
}),
      });

      const data = await res.json();
      setResposta(data.resposta || data.erro || "Sem resposta.");
    } catch {
      setResposta("Erro ao conectar com a IA.");
    } finally {
      setCarregando(false);
    }
  }

  function gravarVoz() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Seu navegador não suporta gravação por voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;

    setGravando(true);

    recognition.start();

    recognition.onresult = (event: any) => {
      const textoFalado = event.results[0][0].transcript;
      setPergunta((textoAtual) =>
        textoAtual ? `${textoAtual} ${textoFalado}` : textoFalado
      );
    };

    recognition.onerror = () => {
      alert("Não foi possível captar o áudio.");
      setGravando(false);
    };

    recognition.onend = () => {
      setGravando(false);
    };
  }

  function fazerRelatoOcorrencia() {
    const comando = `
Transforme as informações abaixo em um relato profissional de ocorrência da Guarda Civil Municipal.

Use linguagem formal, objetiva e adequada para relatório oficial.
Organize o texto com:
- Data e horário, se informado
- Local
- Equipe ou guarnição, se informado
- Fatos narrados
- Providências adotadas
- Encerramento

Informações:
${pergunta}
    `;

    consultarIA(comando);
  }

  return (
  <main className="min-h-screen bg-[#020b1c] text-white p-6">
    <div className="painel-premium p-10 text-center">
      <h1 className="text-4xl font-black text-yellow-400">
        🤖 IA Operacional
      </h1>

      <p className="mt-4 text-xl text-slate-300">
        Módulo em desenvolvimento
      </p>

      <p className="mt-2 text-slate-500">
        Em breve o SIG-GCM Brasil contará com consultas por inteligentes articial.
      </p>
    </div>
  </main>
);
}