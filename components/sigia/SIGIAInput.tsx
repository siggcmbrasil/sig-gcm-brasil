"use client";

import {
  ChangeEvent,
  useRef,
  useState,
} from "react";
import {
  FileText,
  Mic,
  Paperclip,
  Send,
  X,
} from "lucide-react";
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
  const inputArquivoRef =
    useRef<HTMLInputElement | null>(null);

  const [arquivoSelecionado, setArquivoSelecionado] =
    useState<File | null>(null);

  const { iniciar, parar, gravando } =
    useSpeechRecognition((fala) => {
      setTexto(fala);
    });

  function selecionarArquivo(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const arquivo =
      event.target.files?.[0];

    if (!arquivo) {
      return;
    }

    const tamanhoMaximo =
      10 * 1024 * 1024;

    if (arquivo.size > tamanhoMaximo) {
      alert(
        "O arquivo deve ter no máximo 10 MB."
      );

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

    if (
      !tiposPermitidos.includes(
        arquivo.type
      )
    ) {
      alert(
        "Formato inválido. Envie PDF, TXT, JPG, PNG ou WEBP."
      );

      event.target.value = "";
      return;
    }

    setArquivoSelecionado(arquivo);
    anexar?.(arquivo);
  }

  function removerArquivo() {
    setArquivoSelecionado(null);

    if (inputArquivoRef.current) {
      inputArquivoRef.current.value = "";
    }
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
    if (
      carregando ||
      (!texto.trim() &&
        !arquivoSelecionado)
    ) {
      return;
    }

    enviar();
  }

  return (
    <div className="rounded-2xl border border-yellow-500/20 bg-slate-900 p-3">
      <input
        ref={inputArquivoRef}
        type="file"
        accept=".pdf,.txt,.jpg,.jpeg,.png,.webp"
        onChange={selecionarArquivo}
        className="hidden"
      />

      {arquivoSelecionado && (
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-2">
          <div className="rounded-lg bg-cyan-500/10 p-2">
            <FileText className="h-4 w-4 text-cyan-300" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {arquivoSelecionado.name}
            </p>

            <p className="text-xs text-slate-400">
              {(
                arquivoSelecionado.size /
                1024
              ).toFixed(1)}{" "}
              KB
            </p>
          </div>

          <button
            type="button"
            onClick={removerArquivo}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="Remover anexo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() =>
            inputArquivoRef.current?.click()
          }
          disabled={carregando}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"          title="Anexar arquivo"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={acionarMicrofone}
          disabled={carregando}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition ${
  gravando
    ? "bg-red-600 hover:bg-red-500"
    : "bg-cyan-600 hover:bg-cyan-500"
} disabled:cursor-not-allowed disabled:opacity-50`}
          title={
            gravando
              ? "Parar gravação"
              : "Falar com a SIGIA"
          }
        >
          <Mic
            className={`h-5 w-5 text-white ${
              gravando
                ? "animate-pulse"
                : ""
            }`}
          />
        </button>

        <textarea
          value={texto}
          onChange={(event) =>
            setTexto(event.target.value)
          }
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey
            ) {
              event.preventDefault();
              enviarConteudo();
            }
          }}
          rows={1}
          placeholder={
            gravando
              ? "Ouvindo..."
              : "Converse com a SIGIA..."
          }
          className="max-h-32 min-h-12 flex-1 resize-none rounded-3xl border border-slate-700 bg-slate-800 px-5 py-3 text-white outline-none focus:border-yellow-400"
        />

        <button
          type="button"
          disabled={
            carregando ||
            (!texto.trim() &&
              !arquivoSelecionado)
          }
          onClick={enviarConteudo}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-slate-950 hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
          title="Enviar"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-slate-500">
        <span>
          PDF, TXT ou imagem — máximo 10 MB
        </span>

        <span>
          Enter envia • Shift + Enter quebra linha
        </span>
      </div>
    </div>
  );
}