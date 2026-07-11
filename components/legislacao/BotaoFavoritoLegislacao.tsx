"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

type Props = {
  origemId: string;
  titulo: string;
  descricao?: string | null;
  categoria?: string | null;
  tipoConteudo?: string | null;
  url?: string | null;
  className?: string;
};

type UsuarioLocal = {
  auth_id?: string;
  municipio_id?: number;
};

async function obterUsuario(): Promise<UsuarioLocal> {
  const local = JSON.parse(
    localStorage.getItem("usuarioLogado") || "{}"
  ) as UsuarioLocal;

  if (local.auth_id) return local;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    ...local,
    auth_id: user?.id,
  };
}

export default function BotaoFavoritoLegislacao({
  origemId,
  titulo,
  descricao = null,
  categoria = null,
  tipoConteudo = null,
  url = null,
  className = "",
}: Props) {
  const [favoritoId, setFavoritoId] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function verificarFavorito() {
    try {
      const usuario = await obterUsuario();

      if (!usuario.municipio_id || !usuario.auth_id) return;

      const { data, error } = await supabase
        .from("legislacao_favoritos")
        .select("id")
        .eq("municipio_id", usuario.municipio_id)
        .eq("auth_user_id", usuario.auth_id)
        .eq("origem_id", origemId)
        .maybeSingle();

      if (error) throw error;

      setFavoritoId(data?.id || null);
    } catch (error) {
      console.error("Erro ao verificar favorito:", error);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void verificarFavorito();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origemId]);

  async function alternarFavorito() {
    const usuario = await obterUsuario();

    if (!usuario.municipio_id || !usuario.auth_id) {
      alert("Usuário não identificado.");
      return;
    }

    setCarregando(true);

    try {
      if (favoritoId) {
        const { error } = await supabase
          .from("legislacao_favoritos")
          .delete()
          .eq("id", favoritoId)
          .eq("municipio_id", usuario.municipio_id)
          .eq("auth_user_id", usuario.auth_id);

        if (error) throw error;

        await registrarAuditoria({
          modulo: "Central de Legislação",
          acao: "EXCLUIR",
          descricao: `Removeu dos favoritos: ${titulo}.`,
          tabela: "legislacao_favoritos",
          registro_id: favoritoId,
          detalhes: {
            municipio_id: usuario.municipio_id,
            origem_id: origemId,
          },
        });

        setFavoritoId(null);
      } else {
        const { data, error } = await supabase
          .from("legislacao_favoritos")
          .insert({
            municipio_id: usuario.municipio_id,
            auth_user_id: usuario.auth_id,
            origem_id: origemId,
            titulo,
            descricao,
            categoria,
            tipo_conteudo: tipoConteudo,
            url,
          })
          .select("id")
          .single();

        if (error) throw error;

        await registrarAuditoria({
          modulo: "Central de Legislação",
          acao: "FAVORITAR",
          descricao: `Adicionou aos favoritos: ${titulo}.`,
          tabela: "legislacao_favoritos",
          registro_id: data.id,
          detalhes: {
            municipio_id: usuario.municipio_id,
            origem_id: origemId,
          },
        });

        setFavoritoId(data.id);
      }
    } catch (error: any) {
      console.error("Erro ao alterar favorito:", error);
      alert(error?.message || "Erro ao alterar favorito.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void alternarFavorito()}
      disabled={carregando}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 font-bold transition disabled:opacity-50 ${
        favoritoId
          ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
          : "border-slate-700 bg-slate-900 text-slate-300 hover:border-amber-500/30 hover:text-amber-300"
      } ${className}`}
      aria-pressed={Boolean(favoritoId)}
    >
      <Star
        size={18}
        className={favoritoId ? "fill-current" : ""}
      />
      {favoritoId ? "Favoritado" : "Favoritar"}
    </button>
  );
}
