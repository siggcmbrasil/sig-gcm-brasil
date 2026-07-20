"use client";

import { ChangeEvent, useRef, useState } from "react";
import { FileText, Mic, Paperclip, Send, Sparkles, X } from "lucide-react";
import useSpeechRecognition from "@/hooks/useSpeechRecognition";

interface Props {
  texto: string;
  carregando: boolean;
  setTexto: (texto: string) => void;
  enviar: () => void;
  microfone?: () => void;
  anexar?: (arquivo: File) => void;
}

export default function SIGIAInput({
  texto,
  carregando,
  setTexto,
  enviar,
  microfone,
  anexar,
}: Props) {
  const inputArquivoRef = useRef<HTMLInputElement | null>(null);
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const { iniciar, parar, gravando } = useSpeechRecognition((fala) => {
    setTexto(fala);
  });

  function selecionarArquivo(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    const tamanhoMaximo = 10 * 1024 * 1024;
    if (arquivo.size > tamanhoMaximo) {
      alert("O arquivo deve ter no máximo 10 MB.");
      event.target.value = "";
      return;
    }

    const tiposPermitidos = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "text/plain",
    ];

    if (!tiposPermitidos.includes(arquivo.type)) {
      alert("Formato inválido. Envie PDF, TXT, JPG, PNG ou WEBP.");
      event.target.value = "";
      return;
    }

    setArquivoSelecionado(arquivo);
    anexar?.(arquivo);
  }

  function removerArquivo() {
    setArquivoSelecionado(null);
    if (inputArquivoRef.current) inputArquivoRef.current.value = "";
  }

  function acionarMicrofone() {
    if (gravando) {
      parar();
      return;
    }

    iniciar();
    microfone?.();
  }

  function enviarConteudo() {
    if (carregando || (!texto.trim() && !arquivoSelecionado)) return;
    enviar();
  }

  return (
    <div className="rounded-[28px] border border-cyan-400/15 bg-[linear-gradient(180deg,rgba(8,19,38,.96),rgba(2,8,23,.98))] p-3 shadow-xl md:p-4">
      <input
        ref={inputArquivoRef}
        type="file"
        accept=".pdf,.txt,.jpg,.jpeg,.png,.webp"
        onChange={selecionarArquivo}
        className="hidden"
      />

      {arquivoSelecionado ? (
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-cyan-400/15 bg-cyan-400/[.06] px-3 py-3">
          <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/10 p-2.5">
            <FileText className="h-4 w-4 text-cyan-200" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-white">{arquivoSelecionado.name}</p>
            <p className="text-xs text-slate-500">{(arquivoSelecionado.size / 1024).toFixed(1)} KB</p>
          </div>

          <button
            type="button"
            onClick={removerArquivo}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-white/[.06] hover:text-white"
            title="Remover anexo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputArquivoRef.current?.click()}
            disabled={carregando}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[.04] text-slate-300 transition hover:border-cyan-400/20 hover:bg-cyan-400/[.06] disabled:cursor-not-allowed disabled:opacity-50"
            title="Anexar arquivo"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={acionarMicrofone}
            disabled={carregando}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition disabled:cursor-not-allowed disabled:opacity-50 ${
              gravando
                ? "border-red-400/20 bg-red-500 text-white"
                : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20"
            }`}
            title={gravando ? "Parar gravação" : "Falar com a SIGIA"}
          >
            <Mic className={`h-5 w-5 ${gravando ? "animate-pulse" : ""}`} />
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3 rounded-[24px] border border-white/10 bg-[#020817]/75 px-4 py-3 focus-within:border-cyan-400/30 focus-within:ring-4 focus-within:ring-cyan-400/10">
            <Sparkles className="mt-1 h-4 w-4 shrink-0 text-cyan-300" />
            <textarea
              value={texto}
              onChange={(event) => setTexto(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  enviarConteudo();
                }
              }}
              rows={1}
              placeholder={gravando ? "Ouvindo..." : "Converse com a SIGIA..."}
              className="max-h-36 min-h-12 flex-1 resize-none bg-transparent py-0.5 text-white outline-none placeholder:text-slate-500"
            />
          </div>
        </div>

        <button
          type="button"
          disabled={carregando || (!texto.trim() && !arquivoSelecionado)}
          onClick={enviarConteudo}
          className="flex h-12 min-w-[124px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 font-black text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          title="Enviar"
        >
          <Send className="h-4 w-4" />
          Enviar
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2 px-1 text-[11px] text-slate-500 md:flex-row md:items-center md:justify-between">
        <span>PDF, TXT ou imagem — máximo 10 MB</span>
        <span>Enter envia • Shift + Enter quebra linha</span>
      </div>
    </div>
  );
}
