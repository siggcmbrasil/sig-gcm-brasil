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
        body: JSON.stringify({ pergunta: perguntaFinal }),
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
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-2xl bg-slate-900 p-6 text-white shadow">
          <h1 className="text-2xl font-bold">🤖 Inteligência Artificial</h1>
          <p className="mt-2 text-sm text-slate-300">
            Consulte a IA, grave por voz e gere relatos profissionais de ocorrência.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <label className="mb-2 block font-semibold text-slate-700">
            Pergunta ou informações da ocorrência
          </label>

          <textarea
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            placeholder="Digite ou grave por voz. Ex: Hoje por volta das 20h, a guarnição foi acionada para uma perturbação do sossego..."
            className="w-full rounded-xl border border-slate-300 bg-white p-4 text-black outline-none focus:border-blue-600"
            rows={8}
          />

          <div className="mt-4 flex flex-col gap-3 md:flex-row">
            <button
              type="button"
              onClick={gravarVoz}
              disabled={gravando || carregando}
              className="rounded-xl bg-red-700 px-6 py-3 font-semibold text-white hover:bg-red-800 disabled:opacity-60"
            >
              {gravando ? "🎙️ Gravando..." : "🎙️ Gravar com voz"}
            </button>

            <button
              type="button"
              onClick={() => consultarIA()}
              disabled={carregando}
              className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {carregando ? "Consultando..." : "Consultar IA"}
            </button>

            <button
              type="button"
              onClick={fazerRelatoOcorrencia}
              disabled={carregando || !pergunta.trim()}
              className="rounded-xl bg-emerald-700 px-6 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              📝 Fazer relato de ocorrência
            </button>
          </div>
        </div>

        {resposta && (
          <div className="mt-6 rounded-2xl bg-white p-5 shadow">
            <h2 className="mb-3 text-lg font-bold text-slate-800">
              Resposta da IA
            </h2>

            <div className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-slate-700">
              {resposta}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}