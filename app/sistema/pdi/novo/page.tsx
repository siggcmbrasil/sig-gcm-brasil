"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  calcularProgressoPdi,
  criarMetaVazia,
  lerUsuarioPdi,
  MetaPdi,
  podeGerenciarPdi,
} from "@/lib/pdi";
import { supabase } from "@/lib/supabase";

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
};

type Avaliacao = {
  id: number;
  guarda_id: number;
  guarda_nome: string;
  periodo_referencia: string;
  media_final: number;
  conceito: string;
  plano_melhoria: string | null;
};

export default function NovoPdiPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const avaliacaoInicial = searchParams.get("avaliacao_id") || "";

  const [usuario] = useState(() => lerUsuarioPdi());
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [guardaId, setGuardaId] = useState("");
  const [avaliacaoId, setAvaliacaoId] = useState(avaliacaoInicial);
  const [titulo, setTitulo] = useState("Plano de Desenvolvimento Individual");
  const [objetivoGeral, setObjetivoGeral] = useState("");
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().slice(0, 10));
  const [dataFim, setDataFim] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [metas, setMetas] = useState<MetaPdi[]>([criarMetaVazia()]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario ? podeGerenciarPdi(usuario.perfil) : false;
  const progresso = useMemo(() => calcularProgressoPdi(metas), [metas]);

  useEffect(() => {
    async function carregarDados() {
      if (!usuario?.municipio_id) return;

      const [guardasResposta, avaliacoesResposta] = await Promise.all([
        supabase
          .from("guardas")
          .select("id,nome,matricula")
          .eq("municipio_id", usuario.municipio_id)
          .order("nome"),
        supabase
          .from("avaliacoes_desempenho")
          .select("id,guarda_id,guarda_nome,periodo_referencia,media_final,conceito,plano_melhoria")
          .eq("municipio_id", usuario.municipio_id)
          .order("criado_em", { ascending: false }),
      ]);

      if (!guardasResposta.error) {
        setGuardas((guardasResposta.data as Guarda[] | null) || []);
      }

      if (!avaliacoesResposta.error) {
        const lista = (avaliacoesResposta.data as Avaliacao[] | null) || [];
        setAvaliacoes(lista);

        if (avaliacaoInicial) {
          const avaliacao = lista.find((item) => String(item.id) === avaliacaoInicial);
          if (avaliacao) {
            setGuardaId(String(avaliacao.guarda_id));
            setObjetivoGeral(avaliacao.plano_melhoria || "");
          }
        }
      }
    }

    void carregarDados();
  }, [avaliacaoInicial, usuario]);

  function alterarMeta(
    id: string,
    campo: keyof MetaPdi,
    valor: string | number
  ) {
    setMetas((atual) =>
      atual.map((meta) =>
        meta.id === id
          ? {
              ...meta,
              [campo]:
                campo === "progresso"
                  ? Math.min(100, Math.max(0, Number(valor || 0)))
                  : valor,
            }
          : meta
      )
    );
  }

  function selecionarAvaliacao(valor: string) {
    setAvaliacaoId(valor);
    const avaliacao = avaliacoes.find((item) => String(item.id) === valor);

    if (avaliacao) {
      setGuardaId(String(avaliacao.guarda_id));
      if (avaliacao.plano_melhoria) setObjetivoGeral(avaliacao.plano_melhoria);
    }
  }

  async function salvar(status: "RASCUNHO" | "ATIVO") {
    if (!usuario?.municipio_id || !usuario.id) {
      setErro("Sessão inválida.");
      return;
    }

    if (!podeGerenciar) {
      setErro("Seu perfil não pode criar PDI.");
      return;
    }

    const guarda = guardas.find((item) => String(item.id) === guardaId);
    if (!guarda) {
      setErro("Selecione o guarda.");
      return;
    }

    if (!titulo.trim() || !dataInicio) {
      setErro("Informe o título e a data inicial.");
      return;
    }

    const metasValidas = metas.filter((meta) => meta.titulo.trim());
    if (!metasValidas.length) {
      setErro("Cadastre ao menos uma meta.");
      return;
    }

    setSalvando(true);
    setErro("");

    const { data, error } = await supabase
      .from("planos_desenvolvimento_individual")
      .insert({
        municipio_id: usuario.municipio_id,
        guarda_id: guarda.id,
        guarda_nome: guarda.nome,
        matricula: guarda.matricula,
        avaliacao_id: avaliacaoId ? Number(avaliacaoId) : null,
        titulo: titulo.trim(),
        objetivo_geral: objetivoGeral.trim() || null,
        data_inicio: dataInicio,
        data_fim: dataFim || null,
        metas: metasValidas,
        progresso: calcularProgressoPdi(metasValidas),
        status,
        observacoes: observacoes.trim() || null,
        responsavel_id: String(usuario.id),
        responsavel_nome: usuario.nome,
      })
      .select("id")
      .single();

    if (error) {
      setErro(error.message);
      setSalvando(false);
      return;
    }

    await registrarAuditoria({
      modulo: "RH",
      acao: "CRIAR",
      tabela: "planos_desenvolvimento_individual",
      registro_id: data.id,
      descricao: `PDI criado para ${guarda.nome}.`,
      detalhes: {
        status,
        avaliacao_id: avaliacaoId || null,
        quantidade_metas: metasValidas.length,
      },
    });

    router.push(`/sistema/pdi/${data.id}`);
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7">
        <div className="mx-auto max-w-6xl space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 lg:p-7">
            <Link
              href="/sistema/pdi"
              className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
            <h1 className="mt-4 text-2xl font-black">Novo PDI</h1>
            <p className="mt-2 text-sm text-slate-400">
              Estruture metas, competências, cursos, responsabilidades e prazos.
            </p>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-4 rounded-2xl border border-slate-800 bg-[#061326] p-5 md:grid-cols-2">
            <Campo titulo="Guarda">
              <select
                value={guardaId}
                onChange={(event) => setGuardaId(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              >
                <option value="">Selecione...</option>
                {guardas.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome} — {item.matricula || "sem matrícula"}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo titulo="Avaliação de desempenho vinculada">
              <select
                value={avaliacaoId}
                onChange={(event) => selecionarAvaliacao(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              >
                <option value="">Sem vínculo</option>
                {avaliacoes.map((item) => (
                  <option key={item.id} value={item.id}>
                    #{item.id} — {item.guarda_nome} — {item.periodo_referencia} — nota {Number(item.media_final).toFixed(2)}
                  </option>
                ))}
              </select>
            </Campo>

            <Campo titulo="Título">
              <input
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Progresso inicial">
              <div className="flex h-12 items-center rounded-xl border border-slate-700 bg-slate-950/60 px-4 font-black text-cyan-300">
                {progresso}%
              </div>
            </Campo>

            <Campo titulo="Data inicial">
              <input
                type="date"
                value={dataInicio}
                onChange={(event) => setDataInicio(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <Campo titulo="Prazo final">
              <input
                type="date"
                value={dataFim}
                onChange={(event) => setDataFim(event.target.value)}
                className="h-12 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4"
              />
            </Campo>

            <div className="md:col-span-2">
              <Campo titulo="Objetivo geral">
                <textarea
                  value={objetivoGeral}
                  onChange={(event) => setObjetivoGeral(event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4"
                />
              </Campo>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-black">Metas e ações</h2>
                <p className="text-sm text-slate-400">
                  Inclua competências, cursos, ações operacionais e resultados esperados.
                </p>
              </div>
              <button
                onClick={() => setMetas((atual) => [...atual, criarMetaVazia()])}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 px-4 py-3 font-black text-cyan-300"
              >
                <Plus className="h-4 w-4" />
                Adicionar meta
              </button>
            </div>

            <div className="space-y-4">
              {metas.map((meta, indice) => (
                <div key={meta.id} className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-black">Meta {indice + 1}</h3>
                    <button
                      onClick={() =>
                        setMetas((atual) => atual.filter((item) => item.id !== meta.id))
                      }
                      className="rounded-lg border border-rose-400/25 p-2 text-rose-300"
                      title="Excluir meta"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <input
                      value={meta.titulo}
                      onChange={(event) => alterarMeta(meta.id, "titulo", event.target.value)}
                      placeholder="Título da meta"
                      className="h-11 rounded-lg border border-slate-700 bg-slate-950/60 px-3 md:col-span-2"
                    />
                    <select
                      value={meta.categoria}
                      onChange={(event) => alterarMeta(meta.id, "categoria", event.target.value)}
                      className="h-11 rounded-lg border border-slate-700 bg-slate-950/60 px-3"
                    >
                      <option value="COMPETENCIA">Competência</option>
                      <option value="CURSO">Curso</option>
                      <option value="CONDUTA">Conduta</option>
                      <option value="PRODUTIVIDADE">Produtividade</option>
                      <option value="LIDERANCA">Liderança</option>
                      <option value="OPERACIONAL">Operacional</option>
                      <option value="OUTRO">Outro</option>
                    </select>
                    <select
                      value={meta.prioridade}
                      onChange={(event) => alterarMeta(meta.id, "prioridade", event.target.value)}
                      className="h-11 rounded-lg border border-slate-700 bg-slate-950/60 px-3"
                    >
                      <option value="BAIXA">Prioridade baixa</option>
                      <option value="MEDIA">Prioridade média</option>
                      <option value="ALTA">Prioridade alta</option>
                      <option value="CRITICA">Prioridade crítica</option>
                    </select>
                    <textarea
                      value={meta.descricao}
                      onChange={(event) => alterarMeta(meta.id, "descricao", event.target.value)}
                      placeholder="Descrição e resultado esperado"
                      rows={3}
                      className="rounded-lg border border-slate-700 bg-slate-950/60 p-3 md:col-span-2"
                    />
                    <input
                      value={meta.responsavel}
                      onChange={(event) => alterarMeta(meta.id, "responsavel", event.target.value)}
                      placeholder="Responsável"
                      className="h-11 rounded-lg border border-slate-700 bg-slate-950/60 px-3"
                    />
                    <input
                      type="date"
                      value={meta.prazo}
                      onChange={(event) => alterarMeta(meta.id, "prazo", event.target.value)}
                      className="h-11 rounded-lg border border-slate-700 bg-slate-950/60 px-3"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5">
            <Campo titulo="Observações iniciais">
              <textarea
                value={observacoes}
                onChange={(event) => setObservacoes(event.target.value)}
                rows={5}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4"
              />
            </Campo>
          </section>

          <div className="flex flex-wrap justify-end gap-3">
            <button
              disabled={salvando}
              onClick={() => void salvar("RASCUNHO")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 font-black disabled:opacity-50"
            >
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar rascunho
            </button>

            <button
              disabled={salvando}
              onClick={() => void salvar("ATIVO")}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Ativar PDI
            </button>
          </div>
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Campo({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase tracking-wider text-slate-400">
        {titulo}
      </span>
      {children}
    </label>
  );
}
