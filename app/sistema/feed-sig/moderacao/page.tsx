"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Flag,
  Gavel,
  Loader2,
  ShieldAlert,
  Trash2,
  XCircle,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigStatCard from "@/components/sig/SigStatCard";
import { registrarAuditoria } from "@/lib/auditoria";
import { supabase } from "@/lib/supabase";

type UsuarioLocal = {
  id?: number | string;
  perfil?: string;
  municipio_id?: number;
};

type Denuncia = {
  id: number;
  post_id: number;
  usuario_id: number | string;
  municipio_id: number;
  motivo: string;
  status: string;
  criado_em: string;
};

function lerUsuario(): UsuarioLocal {
  try {
    return JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    ) as UsuarioLocal;
  } catch {
    return {};
  }
}

export default function FeedModeracaoPage() {
  const [usuario] = useState<UsuarioLocal>(() => lerUsuario());
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processandoId, setProcessandoId] = useState<number | null>(null);
  const [erro, setErro] = useState("");

  const autorizado = useMemo(
    () =>
      [
        "DESENVOLVEDOR",
        "ADMIN",
        "COMANDANTE",
        "DIRETOR",
      ].includes(String(usuario.perfil || "").toUpperCase()),
    [usuario.perfil]
  );

  async function carregar() {
    if (!autorizado) {
      setErro("Seu perfil não possui acesso à moderação.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    let consulta = supabase
      .from("feed_sig_denuncias")
      .select("id,post_id,usuario_id,municipio_id,motivo,status,criado_em")
      .order("criado_em", { ascending: false });

    if (
      String(usuario.perfil || "").toUpperCase() !== "DESENVOLVEDOR" &&
      usuario.municipio_id
    ) {
      consulta = consulta.eq("municipio_id", usuario.municipio_id);
    }

    const resposta = await consulta;

    if (resposta.error) {
      setErro(resposta.error.message);
      setDenuncias([]);
    } else {
      setDenuncias((resposta.data as Denuncia[] | null) || []);
    }

    setCarregando(false);
  }

  useEffect(() => {
    void carregar();
  }, [autorizado]);

  async function atualizarStatus(
    denuncia: Denuncia,
    status: "ANALISADA" | "ARQUIVADA"
  ) {
    setProcessandoId(denuncia.id);

    const resposta = await supabase
      .from("feed_sig_denuncias")
      .update({ status })
      .eq("id", denuncia.id);

    if (resposta.error) {
      alert(resposta.error.message);
      setProcessandoId(null);
      return;
    }

    await registrarAuditoria({
      modulo: "Feed SIG",
      acao: "MODERAR_DENUNCIA",
      descricao: `Alterou a denúncia ${denuncia.id} para ${status}.`,
      tabela: "feed_sig_denuncias",
      registro_id: String(denuncia.id),
    });

    await carregar();
    setProcessandoId(null);
  }

  async function removerPublicacao(denuncia: Denuncia) {
    if (
      !confirm(
        "Deseja apagar a publicação denunciada? Esta ação não poderá ser desfeita."
      )
    ) {
      return;
    }

    setProcessandoId(denuncia.id);

    const resposta = await supabase
      .from("feed_sig")
      .delete()
      .eq("id", denuncia.post_id);

    if (resposta.error) {
      alert(resposta.error.message);
      setProcessandoId(null);
      return;
    }

    await supabase
      .from("feed_sig_denuncias")
      .update({ status: "PUBLICACAO_REMOVIDA" })
      .eq("id", denuncia.id);

    await registrarAuditoria({
      modulo: "Feed SIG",
      acao: "REMOVER_PUBLICACAO_MODERACAO",
      descricao: `Removeu a publicação ${denuncia.post_id} pela moderação.`,
      tabela: "feed_sig",
      registro_id: String(denuncia.post_id),
    });

    await carregar();
    setProcessandoId(null);
  }

  const pendentes = denuncias.filter(
    (item) => item.status === "PENDENTE"
  ).length;

  return (
    <ProtecaoModulo modulo="feed_sig">
      <main className="sig-page">
        <div className="sig-page-content">
          <SigPageHeader
            titulo="Moderação do Feed"
            subtitulo="Análise de denúncias e controle das publicações."
            detalhe="Acesso restrito"
            icone={Gavel}
            acoes={
              <Link
                href="/sistema/feed-sig"
                className="inline-flex min-h-10 items-center rounded-xl bg-cyan-600 px-4 text-sm font-black text-white"
              >
                Voltar ao Feed
              </Link>
            }
          />

          {erro ? <div className="sig-error">{erro}</div> : null}

          <section className="grid gap-4 sm:grid-cols-3">
            <SigStatCard
              titulo="Denúncias"
              valor={denuncias.length}
              subtitulo="Total carregado"
              icone={Flag}
              destaque="red"
            />

            <SigStatCard
              titulo="Pendentes"
              valor={pendentes}
              subtitulo="Aguardam análise"
              icone={ShieldAlert}
              destaque="amber"
            />

            <SigStatCard
              titulo="Concluídas"
              valor={denuncias.length - pendentes}
              subtitulo="Já processadas"
              icone={CheckCircle2}
              destaque="green"
            />
          </section>

          {carregando ? (
            <div className="sig-loading">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
            </div>
          ) : denuncias.length === 0 ? (
            <SigCard>
              <div className="py-12 text-center text-slate-500">
                Nenhuma denúncia registrada.
              </div>
            </SigCard>
          ) : (
            <section className="space-y-4">
              {denuncias.map((denuncia) => (
                <SigCard key={denuncia.id}>
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-red-400/20 bg-red-400/[0.06] px-2.5 py-1 text-[10px] font-black uppercase text-red-300">
                          {denuncia.status}
                        </span>

                        <span className="text-xs text-slate-500">
                          Publicação #{denuncia.post_id}
                        </span>
                      </div>

                      <h2 className="mt-4 font-black text-white">
                        Motivo da denúncia
                      </h2>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                        {denuncia.motivo}
                      </p>

                      <p className="mt-3 text-xs text-slate-500">
                        {new Date(denuncia.criado_em).toLocaleString(
                          "pt-BR"
                        )}
                      </p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3 xl:w-[430px]">
                      <button
                        type="button"
                        disabled={processandoId === denuncia.id}
                        onClick={() =>
                          void atualizarStatus(
                            denuncia,
                            "ANALISADA"
                          )
                        }
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-black text-white disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Analisada
                      </button>

                      <button
                        type="button"
                        disabled={processandoId === denuncia.id}
                        onClick={() =>
                          void atualizarStatus(
                            denuncia,
                            "ARQUIVADA"
                          )
                        }
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 text-sm font-black text-slate-300 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                        Arquivar
                      </button>

                      <button
                        type="button"
                        disabled={processandoId === denuncia.id}
                        onClick={() =>
                          void removerPublicacao(denuncia)
                        }
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-3 text-sm font-black text-white disabled:opacity-50"
                      >
                        {processandoId === denuncia.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Remover post
                      </button>
                    </div>
                  </div>
                </SigCard>
              ))}
            </section>
          )}
        </div>
      </main>
    </ProtecaoModulo>
  );
}
