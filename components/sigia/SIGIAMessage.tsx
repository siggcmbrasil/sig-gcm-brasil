"use client";

import { Bot, Clipboard, FileText, Heart, Shield, User2, Volume2 } from "lucide-react";

type Props = {
  autor: "usuario" | "sigia";
  texto: string;
  agente?: string;
  onOcorrencia?: (texto: string) => void;
};

export default function SIGIAMessage({ autor, texto, agente, onOcorrencia }: Props) {
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
    <div className={`flex ${usuario ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[96%] overflow-hidden rounded-[26px] shadow-xl sm:max-w-[88%] ${
          usuario
            ? "border border-cyan-300/20 bg-gradient-to-br from-cyan-400 to-blue-500 text-slate-950"
            : "border border-white/10 bg-[#071225] text-white"
        }`}
      >
        <div className={`flex items-center gap-3 px-4 py-3 ${usuario ? "border-b border-slate-950/10 bg-white/10" : "border-b border-white/10 bg-[#040d1c]"}`}>
          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${usuario ? "bg-white/25 text-slate-950" : "border border-cyan-400/15 bg-cyan-400/10 text-cyan-200"}`}>
            {usuario ? <User2 className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
          </div>

          <div className="min-w-0 flex-1">
            <p className={`text-sm font-black ${usuario ? "text-slate-950" : "text-white"}`}>{usuario ? "Você" : "SIGIA"}</p>
            <p className={`text-xs ${usuario ? "text-slate-900/70" : "text-cyan-300"}`}>{usuario ? "Solicitação enviada" : agente || "Assistente Inteligente"}</p>
          </div>

          {!usuario ? <Shield className="h-4 w-4 text-emerald-400" /> : null}
        </div>

        <div className="px-4 py-4 md:px-5">
          <p className={`whitespace-pre-wrap break-words text-[15px] leading-7 ${usuario ? "text-slate-950" : "text-slate-100"}`}>
            {texto}
          </p>
        </div>

        {!usuario ? (
          <>
            <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-[#040d1c] px-4 py-3">
              <button onClick={copiar} className="rounded-xl border border-white/10 bg-white/[.03] p-2.5 text-slate-300 transition hover:border-cyan-400/20 hover:bg-cyan-400/[.06]">
                <Clipboard className="h-4 w-4" />
              </button>
              <button onClick={ouvir} className="rounded-xl border border-white/10 bg-white/[.03] p-2.5 text-slate-300 transition hover:border-cyan-400/20 hover:bg-cyan-400/[.06]">
                <Volume2 className="h-4 w-4" />
              </button>
              <button className="rounded-xl border border-white/10 bg-white/[.03] p-2.5 text-slate-300 transition hover:border-cyan-400/20 hover:bg-cyan-400/[.06]">
                <Heart className="h-4 w-4" />
              </button>
              <button
                onClick={() => onOcorrencia?.(texto)}
                title="Transformar em ocorrência"
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/15 bg-cyan-400/[.06] px-3 py-2 text-xs font-black text-cyan-200 transition hover:bg-cyan-400/[.12]"
              >
                <FileText className="h-4 w-4" />
                Criar ocorrência
              </button>
            </div>

            <div className="flex items-center gap-2 px-5 pb-4 pt-1 text-[11px] text-slate-500">
              <span>IA</span>
              <span>•</span>
              <span>Resposta inteligente</span>
              <span>•</span>
              <span>
                {new Date().toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </>
        ) : (
          <div className="px-5 pb-4 pt-1 text-[11px] text-slate-900/70">
            {new Date().toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>
    </div>
  );
}
