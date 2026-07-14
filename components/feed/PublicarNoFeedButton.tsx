"use client";

import { useState } from "react";
import {
  Loader2,
  Megaphone,
  Share2,
} from "lucide-react";

import { publicarAutomaticamenteNoFeed } from "@/lib/publicarAutomaticamenteNoFeed";
import { registrarAuditoria } from "@/lib/auditoria";

type PublicarNoFeedButtonProps = {
  municipioId: number;
  usuarioId: number | string;
  titulo: string;
  texto: string;
  modulo: string;
  registroId?: string | number;
  imagemUrl?: string;
  className?: string;
};

export default function PublicarNoFeedButton({
  municipioId,
  usuarioId,
  titulo,
  texto,
  modulo,
  registroId,
  imagemUrl,
  className = "",
}: PublicarNoFeedButtonProps) {
  const [publicando, setPublicando] = useState(false);

  async function publicar(compartilharBrasil: boolean) {
    if (publicando) return;

    const confirmar = confirm(
      compartilharBrasil
        ? "Deseja publicar este resumo no Feed Brasil?"
        : "Deseja publicar este resumo na Rede Interna SIG?"
    );

    if (!confirmar) return;

    setPublicando(true);

    try {
      await publicarAutomaticamenteNoFeed({
        municipioId,
        usuarioId,
        titulo,
        texto,
        modulo,
        registroId,
        compartilharBrasil,
        imagemUrl,
      });

      await registrarAuditoria({
        modulo: "Feed SIG",
        acao: compartilharBrasil
          ? "PUBLICAR_AUTOMATICAMENTE_BRASIL"
          : "PUBLICAR_AUTOMATICAMENTE_INTERNO",
        descricao: `Publicou automaticamente um registro do módulo ${modulo}.`,
        tabela: "feed_sig",
        registro_id:
          registroId === undefined ? undefined : String(registroId),
        detalhes: {
          modulo_origem: modulo,
          compartilhar_brasil: compartilharBrasil,
        },
      });

      alert(
        compartilharBrasil
          ? "Publicado no Feed Brasil."
          : "Publicado na Rede Interna SIG."
      );
    } catch (error) {
      console.error("Erro ao publicar automaticamente no Feed:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível publicar no Feed."
      );
    } finally {
      setPublicando(false);
    }
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => void publicar(false)}
        disabled={publicando}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/[0.08] px-4 text-sm font-black text-cyan-200 transition hover:bg-cyan-400/15 disabled:opacity-50"
      >
        {publicando ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Megaphone className="h-4 w-4" />
        )}
        Publicar no Feed SIG
      </button>

      <button
        type="button"
        onClick={() => void publicar(true)}
        disabled={publicando}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-blue-400/25 bg-blue-400/[0.08] px-4 text-sm font-black text-blue-200 transition hover:bg-blue-400/15 disabled:opacity-50"
      >
        {publicando ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        Compartilhar no Feed Brasil
      </button>
    </div>
  );
}
