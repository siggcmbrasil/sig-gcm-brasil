"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  Loader2,
  MapPin,
  Play,
  Save,
  Shield,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  estiloPrioridadeOS,
  estiloStatusOS,
  formatarDataOS,
  lerUsuarioOS,
  normalizarOS,
  podeGerenciarOS,
} from "@/lib/ordemServico";

type Ordem = {
  id: number;
  numero: string;
  titulo: string;
  missao: string;
  objetivo: string | null;
  prioridade: string;
  status: string;
  data_inicio: string;
  hora_inicio: string | null;
  data_fim: string | null;
  hora_fim: string | null;
  local: string | null;
  endereco: string | null;
  ponto_referencia: string | null;
  comandante_nome: string | null;
  equipe: string | null;
  viatura_descricao: string | null;
  instrucoes: string | null;
  observacoes: string | null;
  relatorio_final: string | null;
  criado_por_nome: string | null;
  criado_em: string;
};

type Designado = {
  id: number;
  guarda_id: number | null;
  guarda_nome: string;
  matricula: string | null;
  funcao: string | null;
  ciencia_status: string;
  ciencia_em: string | null;
};

type Historico = {
  id: number;
  usuario_nome: string | null;
  acao: string;
  descricao: string | null;
  criado_em: string;
};

export default function OrdemServicoDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [usuario] = useState(() => lerUsuarioOS());
  const [ordem, setOrdem] = useState<Ordem | null>(null);
  const [designados, setDesignados] = useState<Designado[]>([]);
  const [historico, setHistorico] = useState<Historico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [relatorio, setRelatorio] = useState("");
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!id || !usuario?.municipio_id) return;

    setCarregando(true);
    setErro("");

    try {
      const [ordemResposta, designadosResposta, historicoResposta] = await Promise.all([
        supabase.from("ordens_servico").select("*").eq("municipio_id", usuario.municipio_id).eq("id", id).single(),
        supabase.from("ordens_servico_designados").select("id,guarda_id,guarda_nome,matricula,funcao,ciencia_status,ciencia_em").eq("municipio_id", usuario.municipio_id).eq("ordem_servico_id", id).order("guarda_nome"),
        supabase.from("ordens_servico_historico").select("id,usuario_nome,acao,descricao,criado_em").eq("municipio_id", usuario.municipio_id).eq("ordem_servico_id", id).order("criado_em", { ascending: false }),
      ]);

      if (ordemResposta.error) {
        if (ordemResposta.error.code === "42P01") throw new Error("Execute primeiro o arquivo supabase/ORDEM_SERVICO.sql.");
        throw ordemResposta.error;
      }

      const ordemAtual = ordemResposta.data as Ordem;
      setOrdem(ordemAtual);
      setRelatorio(ordemAtual.relatorio_final || "");
      setDesignados((designadosResposta.data as Designado[] | null) || []);
      setHistorico((historicoResposta.data as Historico[] | null) || []);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível abrir a ordem.");
    } finally {
      setCarregando(false);
    }
  }, [id, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const meuDesignado = useMemo(() => {
    if (!usuario) return null;
    const nome = normalizarOS(usuario.nome);
    return designados.find((item) =>
      (usuario.matricula && item.matricula === usuario.matricula) ||
      normalizarOS(item.guarda_nome) === nome
    ) || null;
  }, [designados, usuario]);

  async function registrarHistorico(acao: string, descricao: string, statusAnterior?: string, statusNovo?: string) {
    if (!usuario?.municipio_id) return;
    await supabase.from("ordens_servico_historico").insert({
      municipio_id: usuario.municipio_id,
      ordem_servico_id: id,
      usuario_id: Number(usuario.id),
      usuario_nome: usuario.nome,
      acao,
      status_anterior: statusAnterior || null,
      status_novo: statusNovo || null,
      descricao,
    });
  }

  async function mudarStatus(novoStatus: string) {
    if (!ordem || !usuario?.municipio_id || !podeGerenciarOS(usuario.perfil)) return;
    setProcessando(true);

    try {
      const campos: Record<string, unknown> = { status: novoStatus };
      if (novoStatus === "PUBLICADA") campos.publicado_em = new Date().toISOString();
      if (novoStatus === "EM_ANDAMENTO") campos.iniciado_em = new Date().toISOString();
      if (novoStatus === "CONCLUIDA") campos.concluido_em = new Date().toISOString();
      if (novoStatus === "CANCELADA") campos.cancelado_em = new Date().toISOString();

      const resposta = await supabase.from("ordens_servico").update(campos).eq("id", id).eq("municipio_id", usuario.municipio_id);
      if (resposta.error) throw resposta.error;

      await registrarHistorico("ALTERACAO_STATUS", `Status alterado para ${novoStatus.replaceAll("_", " ")}.`, ordem.status, novoStatus);
      await registrarAuditoria({
        modulo: "Ordem de Serviço",
        acao: "ALTERAR_STATUS",
        descricao: `Alterou a ordem ${ordem.numero} para ${novoStatus}.`,
        tabela: "ordens_servico",
        registro_id: id,
        detalhes: { status_anterior: ordem.status, status_novo: novoStatus },
      });
      await carregar();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao alterar status.");
    } finally {
      setProcessando(false);
    }
  }

  async function registrarCiencia() {
    if (!meuDesignado || !usuario?.municipio_id || !ordem) return;
    setProcessando(true);

    try {
      const resposta = await supabase
        .from("ordens_servico_designados")
        .update({ ciencia_status: "CIENTE", ciencia_em: new Date().toISOString() })
        .eq("id", meuDesignado.id)
        .eq("municipio_id", usuario.municipio_id);
      if (resposta.error) throw resposta.error;

      await registrarHistorico("CIENCIA", `${usuario.nome} confirmou ciência da ordem.`);
      await registrarAuditoria({
        modulo: "Ordem de Serviço",
        acao: "CIENCIA",
        descricao: `Confirmou ciência da ordem ${ordem.numero}.`,
        tabela: "ordens_servico_designados",
        registro_id: meuDesignado.id,
        detalhes: { ordem_servico_id: id },
      });
      await carregar();
    } finally {
      setProcessando(false);
    }
  }

  async function salvarRelatorio() {
    if (!ordem || !usuario?.municipio_id || !podeGerenciarOS(usuario.perfil)) return;
    setProcessando(true);

    try {
      const resposta = await supabase
        .from("ordens_servico")
        .update({ relatorio_final: relatorio.trim() || null })
        .eq("id", id)
        .eq("municipio_id", usuario.municipio_id);
      if (resposta.error) throw resposta.error;

      await registrarHistorico("RELATORIO_FINAL", "Relatório final atualizado.");
      await carregar();
    } finally {
      setProcessando(false);
    }
  }

  if (carregando) {
    return <main className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-cyan-300" /></main>;
  }

  if (!ordem) {
    return <main className="p-8 text-white">{erro || "Ordem não encontrada."}</main>;
  }

  const gerencia = usuario ? podeGerenciarOS(usuario.perfil) : false;

  return (
    <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 lg:p-7">
          <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-2 text-sm font-black text-slate-400 hover:text-cyan-300">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>

          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">{ordem.numero}</p>
              <h1 className="mt-2 text-2xl font-black lg:text-3xl">{ordem.titulo}</h1>
              <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-400">{ordem.missao}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-2 text-xs font-black ${estiloStatusOS(ordem.status)}`}>{ordem.status.replaceAll("_", " ")}</span>
              <span className={`rounded-full border border-slate-700 px-3 py-2 text-xs font-black ${estiloPrioridadeOS(ordem.prioridade)}`}>{ordem.prioridade}</span>
            </div>
          </div>
        </header>

        {erro ? <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">{erro}</div> : null}

        {gerencia ? (
          <section className="flex flex-wrap gap-3 rounded-2xl border border-slate-800 bg-[#061326] p-4">
            {ordem.status === "RASCUNHO" ? <Acao onClick={() => mudarStatus("PUBLICADA")} icone={BadgeCheck} texto="Publicar ordem" /> : null}
            {ordem.status === "PUBLICADA" ? <Acao onClick={() => mudarStatus("EM_ANDAMENTO")} icone={Play} texto="Iniciar execução" /> : null}
            {ordem.status === "EM_ANDAMENTO" ? <Acao onClick={() => mudarStatus("CONCLUIDA")} icone={CheckCircle2} texto="Concluir ordem" /> : null}
            {!["CONCLUIDA","CANCELADA"].includes(ordem.status) ? <Acao onClick={() => mudarStatus("CANCELADA")} icone={XCircle} texto="Cancelar" danger /> : null}
          </section>
        ) : meuDesignado && meuDesignado.ciencia_status !== "CIENTE" ? (
          <button onClick={() => void registrarCiencia()} disabled={processando} className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-black text-slate-950">
            <UserCheck className="h-5 w-5" /> Confirmar ciência
          </button>
        ) : meuDesignado ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4 text-sm font-black text-emerald-300">Ciência confirmada.</div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-8">
            <Bloco titulo="Planejamento da missão" icone={ClipboardList}>
              <Grade>
                <Item label="Objetivo" valor={ordem.objetivo || "Não informado"} />
                <Item label="Comandante" valor={ordem.comandante_nome || "Não informado"} />
                <Item label="Equipe" valor={ordem.equipe || "Não informada"} />
                <Item label="Viatura" valor={ordem.viatura_descricao || "Não vinculada"} />
              </Grade>
            </Bloco>

            <Bloco titulo="Data e local" icone={CalendarDays}>
              <Grade>
                <Item label="Início" valor={`${formatarDataOS(ordem.data_inicio)} ${ordem.hora_inicio?.slice(0,5) || ""}`} />
                <Item label="Término previsto" valor={ordem.data_fim ? `${formatarDataOS(ordem.data_fim)} ${ordem.hora_fim?.slice(0,5) || ""}` : "Não informado"} />
                <Item label="Local" valor={ordem.local || "Não informado"} />
                <Item label="Endereço" valor={ordem.endereco || "Não informado"} />
                <Item label="Ponto de referência" valor={ordem.ponto_referencia || "Não informado"} />
              </Grade>
            </Bloco>

            <Bloco titulo="Instruções operacionais" icone={FileText}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{ordem.instrucoes || "Nenhuma instrução adicional."}</p>
            </Bloco>

            {gerencia ? (
              <Bloco titulo="Relatório final" icone={Save}>
                <textarea value={relatorio} onChange={(e) => setRelatorio(e.target.value)} rows={8} className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4 outline-none focus:border-cyan-400/40" placeholder="Registre o resultado da missão, providências, ocorrências e observações finais..." />
                <button onClick={() => void salvarRelatorio()} disabled={processando} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950"><Save className="h-4 w-4" /> Salvar relatório</button>
              </Bloco>
            ) : ordem.relatorio_final ? (
              <Bloco titulo="Relatório final" icone={FileText}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{ordem.relatorio_final}</p>
              </Bloco>
            ) : null}
          </div>

          <div className="space-y-4 xl:col-span-4">
            <Bloco titulo="Guardas designados" icone={Users}>
              <div className="space-y-3">
                {designados.length === 0 ? <p className="text-sm text-slate-500">Nenhum guarda designado.</p> : designados.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{item.guarda_nome}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.funcao || "Sem função"} • {item.matricula || "Sem matrícula"}</p>
                      </div>
                      <span className={`text-[10px] font-black ${item.ciencia_status === "CIENTE" ? "text-emerald-300" : "text-amber-300"}`}>{item.ciencia_status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Bloco>

            <Bloco titulo="Histórico" icone={Clock3}>
              <div className="space-y-3">
                {historico.map((item) => (
                  <div key={item.id} className="border-l-2 border-cyan-400/20 pl-3">
                    <p className="text-sm font-black">{item.acao.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.descricao || "Sem descrição"}</p>
                    <p className="mt-1 text-[10px] text-slate-600">{new Date(item.criado_em).toLocaleString("pt-BR")} • {item.usuario_nome || "Sistema"}</p>
                  </div>
                ))}
              </div>
            </Bloco>
          </div>
        </section>
      </div>
    </main>
  );
}

function Acao({ onClick, icone: Icone, texto, danger = false }: { onClick: () => void; icone: typeof Shield; texto: string; danger?: boolean }) {
  return <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${danger ? "border border-rose-400/25 bg-rose-400/10 text-rose-300" : "bg-cyan-400 text-slate-950"}`}><Icone className="h-4 w-4" />{texto}</button>;
}

function Bloco({ titulo, icone: Icone, children }: { titulo: string; icone: typeof Shield; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5"><div className="mb-4 flex items-center gap-3 border-b border-slate-800 pb-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300"><Icone className="h-5 w-5" /></div><h2 className="font-black">{titulo}</h2></div>{children}</section>;
}

function Grade({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Item({ label, valor }: { label: string; valor: string }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-sm font-bold text-slate-200">{valor}</p></div>;
}
