"use client";

import {
  Bot,
  Clipboard,
  FileText,
  Heart,
  Shield,
  Volume2,
} from "lucide-react";

type Props = {
  autor: "usuario" | "sigia";
  texto: string;
  agente?: string;
  onOcorrencia?: (texto: string) => void;
};

export default function SIGIAMessage({
  autor,
  texto,
  agente,
  onOcorrencia,
}: Props) {
  const usuario = autor === "usuario";

  function copiar() {
    navigator.clipboard.writeText(texto);
  }

  function ouvir() {
    const speech = new SpeechSynthesisUtterance(texto);

    speech.lang = "pt-BR";

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);
  }

  return (
    <div
      className={`flex ${
        usuario ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[92%] sm:max-w-[88%] rounded-3xl shadow-xl overflow-hidden ${
          usuario
            ? "bg-yellow-500 text-slate-950 shadow-lg"
            : "bg-slate-900 border border-slate-700"
        }`}
      >
        {!usuario && (
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700 bg-slate-950">

            <Bot className="w-5 h-5 text-cyan-400" />

            <div className="flex-1">

              <p className="font-bold text-white">
                SIGIA
              </p>

              <p className="text-xs text-cyan-300">
                {agente || "Assistente Inteligente"}
              </p>

            </div>

            <Shield className="w-4 h-4 text-emerald-400" />

          </div>
        )}

        <div className="px-4 py-4">

          <p className="whitespace-pre-wrap break-words text-[15px] leading-7">
            {texto}
          </p>

        </div>

               {!usuario && (
          <>
            <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-slate-700 bg-slate-950">

              <button
                onClick={copiar}
                className="rounded-full p-2 transition hover:bg-slate-800"
              >
                <Clipboard className="w-4 h-4" />
              </button>

              <button
                onClick={ouvir}
                className="rounded-full p-2 transition hover:bg-slate-800"              >
                <Volume2 className="w-4 h-4" />
              </button>

              <button
                className="rounded-full p-2 transition hover:bg-slate-800"              >
                <Heart className="w-4 h-4" />
              </button>

<button
  onClick={() => onOcorrencia?.(texto)}
  title="Transformar em ocorrência"
  className="rounded-xl p-2 hover:bg-slate-800"
>
  <FileText className="w-4 h-4 text-cyan-300" />
</button>

            </div>

            <div className="px-5 pb-4 text-[11px] text-slate-500 flex items-center gap-2">
              <span>IA</span>
              <span>•</span>
              <span>Resposta Inteligente</span>
              <span>•</span>
              <span>
                {new Date().toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </>
        )}

      </div>
    </div>
  );
}