"use client";

import { X, ZoomIn } from "lucide-react";

import AvatarGuarda from "./AvatarGuarda";
import { adicionarVersaoFoto } from "./utils";

type VisualizarFotoProps = {
  aberto: boolean;
  nome: string;
  matricula?: string | null;
  graduacao?: string | null;
  fotoUrl?: string | null;
  versao?: string | number;
  onClose: () => void;
};

export default function VisualizarFoto({
  aberto,
  nome,
  matricula,
  graduacao,
  fotoUrl,
  versao,
  onClose,
}: VisualizarFotoProps) {
  if (!aberto) {
    return null;
  }

  const urlFinal = adicionarVersaoFoto(
    fotoUrl,
    versao
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-cyan-500/30 bg-slate-950 shadow-2xl"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full border border-white/10 bg-black/50 p-3 text-white transition hover:bg-red-600"
          aria-label="Fechar visualização"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex min-h-[420px] items-center justify-center bg-black/40 p-6">
          {urlFinal ? (
            <img
              src={urlFinal}
              alt={`Foto de ${nome}`}
              className="max-h-[70dvh] max-w-full rounded-2xl object-contain"
            />
          ) : (
            <AvatarGuarda
              nome={nome}
              tamanho="xl"
              className="h-48 w-48"
            />
          )}
        </div>

        <div className="border-t border-white/10 p-5">
          <div className="flex items-center gap-3">
            <ZoomIn className="h-6 w-6 text-cyan-300" />

            <div>
              <h2 className="text-xl font-black text-white">
                {nome}
              </h2>

              <p className="text-sm text-slate-400">
                {graduacao || "Graduação não informada"}
                {matricula
                  ? ` • Matrícula ${matricula}`
                  : ""}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}