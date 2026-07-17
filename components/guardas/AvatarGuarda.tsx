"use client";

import { useMemo, useState } from "react";
import { UserRound } from "lucide-react";

type AvatarGuardaProps = {
  nome: string;
  fotoUrl?: string | null;
  tamanho?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const tamanhos = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-24 w-24",
  xl: "h-32 w-32",
};

export default function AvatarGuarda({
  nome,
  fotoUrl,
  tamanho = "md",
  className = "",
}: AvatarGuardaProps) {
  const [erroImagem, setErroImagem] =
    useState(false);

  const urlFinal = useMemo(() => {
    if (!fotoUrl) {
      return "";
    }

    const separador =
      fotoUrl.includes("?") ? "&" : "?";

    return `${fotoUrl}${separador}v=${Date.now()}`;
  }, [fotoUrl]);

  const iniciais = useMemo(() => {
    return nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) =>
        parte.charAt(0).toUpperCase()
      )
      .join("");
  }, [nome]);

  return (
    <div
      className={`${tamanhos[tamanho]} ${className} relative shrink-0 overflow-hidden rounded-full border border-cyan-500/30 bg-slate-800`}
    >
      {urlFinal && !erroImagem ? (
        <img
          src={urlFinal}
          alt={`Foto de ${nome}`}
          className="h-full w-full object-cover"
          onError={() =>
            setErroImagem(true)
          }
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-slate-800 text-cyan-300">
          {iniciais ? (
            <span className="font-black">
              {iniciais}
            </span>
          ) : (
            <UserRound className="h-1/2 w-1/2" />
          )}
        </div>
      )}
    </div>
  );
}