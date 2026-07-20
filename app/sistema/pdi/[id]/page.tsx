"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MessageSquarePlus,
  Printer,
  Save,
  ShieldCheck,
  Signature,
  XCircle,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  calcularProgressoPdi,
  formatarStatusPdi,
  lerUsuarioPdi,
  MetaPdi,
  podeGerenciarPdi,
} from "@/lib/pdi";
import { supabase } from "@/lib/supabase";

type Acompanhamento = {
  id: string;
  data: string;
  autor: string;
  texto: string;
  progresso: number;
};

type Pdi = {
  id: number;
  guarda_id: number;
  guarda_nome: string;
  matricula: string | null;
  avaliacao_id: number | null;
  titulo: string;
  objetivo_geral: string | null;
  data_inicio: string;
  data_fim: string | null;
  metas: MetaPdi[];
  progresso: number;
  status: string;
  observacoes: string | null;
  acompanhamentos: Acompanhamento[];
  responsavel_nome: string | null;
  responsavel_assinatura_em: string | null;
  guarda_ciencia_em: string | null;
  guarda_ciencia_nome: string | null;
  criado_em: string;
};

export default function PdiDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [usuario] = useState(() => lerUsuarioPdi());
  const [pdi, setPdi] = useState<Pdi | null>(null);
  const [metas, setMetas] = useState<MetaPdi[]>([]);
  const [comentario, setComentario] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario ? podeGerenciarPdi(usuario.perfil) : false;
  const progressoCalculado = useMemo(() => calcularProgressoPdi(metas), [metas]);

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) return;

    setCarregando(true);
    setErro("");

    const { data, error } = await supabase
      .from("planos_desenvolvimento_individual")
      .select("*")
      .eq("id", Number(id))
      .eq("municipio_id", usuario.municipio_id)
      .single();

    if (error) {
      setErro(error.message);
      setPdi(null);
    } else {
      const registro = data as Pdi;
      setPdi(registro);
      setMetas(registro.metas || []);
    }

    setCarregando(false);
  }, [id, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  function alterarMeta(
    metaId: string,
    campo: "progresso" | "status" | "evidencia",
    valor: string | number
  ) {
    setMetas((atual) =>
      atual.map((meta) =>
        meta.id === metaId
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

  async function atualizar(
    campos: Record<string, unknown>,
    acao: string,
    descricao: string
  ) {
    if (!pdi || !usuario) return false;

    setProcessando(true);
    setErro("");

    const { error } = await supabase
      .from("planos_desenvolvimento_individual")
      .update({
        ...campos,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", pdi.id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      setErro(error.message);
      setProcessando(false);
      return false;
    }

    await registrarAuditoria({
      modulo: "RH",
      acao,
      tabela: "planos_desenvolvimento_individual",
      registro_id: pdi.id,
      descricao,
    });

    await carregar();
    setProcessando(false);
    return true;
  }

  async function salvarProgresso() {
    await atualizar(
      {
        metas,
        progresso: progressoCalculado,
      },
      "ATUALIZAR_PROGRESSO",
      `Progresso do PDI de ${pdi?.guarda_nome || ""} atualizado para ${progressoCalculado}%.`
    );
  }

  async function adicionarAcompanhamento() {
    if (!comentario.trim() || !pdi || !usuario) return;

    const novo: Acompanhamento = {
      id: crypto.randomUUID(),
      data: new Date().toISOString(),
      autor: usuario.nome,
      texto: comentario.trim(),
      progresso: progressoCalculado,
    };

    const sucesso = await atualizar(
      {
        acompanhamentos: [...(pdi.acompanhamentos || []), novo],
        metas,
        progresso: progressoCalculado,
      },
      "ACOMPANHAR",
      `Acompanhamento incluído no PDI de ${pdi.guarda_nome}.`
    );

    if (sucesso) setComentario("");
  }

  async function assinarResponsavel() {
    await atualizar(
      { responsavel_assinatura_em: new Date().toISOString() },
      "ASSINAR_RESPONSAVEL",
      `PDI de ${pdi?.guarda_nome || ""} assinado pelo responsável.`
    );
  }

  async function registrarCiencia() {
    if (!usuario) return;

    await atualizar(
      {
        guarda_ciencia_em: new Date().toISOString(),
        guarda_ciencia_nome: usuario.nome,
      },
      "REGISTRAR_CIENCIA",
      `Ciência registrada no PDI de ${pdi?.guarda_nome || ""}.`
    );
  }

  async function alterarStatus(status: "ATIVO" | "CONCLUIDO" | "CANCELADO") {
    await atualizar(
      { status },
      status === "CONCLUIDO" ? "CONCLUIR" : status === "CANCELADO" ? "CANCELAR" : "ATIVAR",
      `Status do PDI de ${pdi?.guarda_nome || ""} alterado para ${status}.`
    );
  }

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020b1c]">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
      </div>
    );
  }

  if (!pdi) {
    return (
      <div className="min-h-screen bg-[#020b1c] p-8 text-white">
        {erro || "PDI não encontrado."}
      </div>
    );
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white print:bg-white print:text-black lg:px-7">
        <div className="mx-auto max-w-6xl space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 print:border-black print:bg-white lg:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Link
                  href="/sistema/pdi"
                  className="inline-flex items-center gap-2 text-sm font-black text-cyan-300 print:hidden"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Link>
                <h1 className="mt-4 text-2xl font-black">{pdi.titulo}</h1>
                <p className="mt-1 text-sm text-slate-400 print:text-black">
                  {pdi.guarda_nome} • {pdi.matricula || "Sem matrícula"} •{" "}
                  {formatarStatusPdi(pdi.status)}
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 self-start rounded-xl border border-cyan-400/25 px-4 py-3 font-black text-cyan-300 print:hidden"
              >
                <Printer className="h-4 w-4" />
                Imprimir/PDF
              </button>
            </div>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Resumo titulo="Status" valor={formatarStatusPdi(pdi.status)} />
            <Resumo titulo="Progresso" valor={`${progressoCalculado}%`} />
            <Resumo
              titulo="Início"
              valor={new Date(`${pdi.data_inicio}T00:00:00`).toLocaleDateString("pt-BR")}
            />
            <Resumo
              titulo="Prazo"
              valor={
                pdi.data_fim
                  ? new Date(`${pdi.data_fim}T00:00:00`).toLocaleDateString("pt-BR")
                  : "Não definido"
              }
            />
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Texto titulo="Objetivo geral" valor={pdi.objetivo_geral} />
            <Texto titulo="Observações" valor={pdi.observacoes} />
          </section>

          {pdi.avaliacao_id ? (
            <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-5">
              <p className="text-xs font-black uppercase text-cyan-300">
                Origem do plano
              </p>
              <Link
                href={`/sistema/avaliacoes-desempenho/${pdi.avaliacao_id}`}
                className="mt-2 inline-block font-black text-white underline decoration-cyan-300 underline-offset-4"
              >
                Abrir avaliação de desempenho #{pdi.avaliacao_id}
              </Link>
            </section>
          ) : null}


          <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-5 print:hidden">
            <p className="text-xs font-black uppercase text-cyan-300">
              Formação vinculada ao desenvolvimento
            </p>
            <Link
              href="/sistema/capacitacoes"
              className="mt-2 inline-block font-black text-white underline decoration-cyan-300 underline-offset-4"
            >
              Abrir catálogo de cursos e capacitações
            </Link>
          </section>


          <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-5 print:hidden">
            <p className="text-xs font-black uppercase text-cyan-300">
              Matriz de desenvolvimento
            </p>
            <Link
              href="/sistema/competencias"
              className="mt-2 inline-block font-black text-white underline decoration-cyan-300 underline-offset-4"
            >
              Abrir competências, habilidades e lacunas do efetivo
            </Link>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black">Metas e ações</h2>
                <p className="text-sm text-slate-400 print:text-black">
                  Atualize progresso, situação e evidências.
                </p>
              </div>
              <div className="text-2xl font-black text-cyan-300 print:text-black">
                {progressoCalculado}%
              </div>
            </div>

            <div className="space-y-4">
              {metas.map((meta, indice) => (
                <div
                  key={meta.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/30 p-4 print:border-black print:bg-white"
                >
                  <div className="grid gap-4 lg:grid-cols-[1fr_170px_150px]">
                    <div>
                      <p className="text-xs font-black uppercase text-cyan-300 print:text-black">
                        Meta {indice + 1} • {formatarStatusPdi(meta.categoria)} •{" "}
                        {formatarStatusPdi(meta.prioridade)}
                      </p>
                      <h3 className="mt-1 font-black">{meta.titulo}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400 print:text-black">
                        {meta.descricao || "Sem descrição."}
                      </p>
                      <p className="mt-3 text-xs text-slate-500 print:text-black">
                        Responsável: {meta.responsavel || "Não informado"} • Prazo:{" "}
                        {meta.prazo
                          ? new Date(`${meta.prazo}T00:00:00`).toLocaleDateString("pt-BR")
                          : "não definido"}
                      </p>
                    </div>

                    <label className="space-y-2 print:hidden">
                      <span className="text-xs font-black uppercase text-slate-500">
                        Progresso
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={meta.progresso}
                        onChange={(event) =>
                          alterarMeta(meta.id, "progresso", event.target.value)
                        }
                        className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3"
                      />
                    </label>

                    <label className="space-y-2 print:hidden">
                      <span className="text-xs font-black uppercase text-slate-500">
                        Status
                      </span>
                      <select
                        value={meta.status}
                        onChange={(event) =>
                          alterarMeta(meta.id, "status", event.target.value)
                        }
                        className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3"
                      >
                        <option value="NAO_INICIADA">Não iniciada</option>
                        <option value="EM_ANDAMENTO">Em andamento</option>
                        <option value="CONCLUIDA">Concluída</option>
                        <option value="CANCELADA">Cancelada</option>
                      </select>
                    </label>
                  </div>

                  <label className="mt-4 block space-y-2 print:hidden">
                    <span className="text-xs font-black uppercase text-slate-500">
                      Evidência, link, documento ou resultado
                    </span>
                    <textarea
                      value={meta.evidencia}
                      onChange={(event) =>
                        alterarMeta(meta.id, "evidencia", event.target.value)
                      }
                      rows={2}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950/60 p-3"
                    />
                  </label>

                  {meta.evidencia ? (
                    <p className="mt-4 text-sm print:block">
                      <strong>Evidência:</strong> {meta.evidencia}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-5 flex justify-end print:hidden">
              <button
                disabled={processando}
                onClick={() => void salvarProgresso()}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                Salvar progresso
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
            <h2 className="text-lg font-black">Acompanhamentos</h2>

            <div className="mt-4 space-y-3">
              {(pdi.acompanhamentos || []).map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-800 p-4 print:border-black">
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-black">{item.autor}</p>
                    <p className="text-xs text-slate-500 print:text-black">
                      {new Date(item.data).toLocaleString("pt-BR")} • progresso {item.progresso}%
                    </p>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400 print:text-black">
                    {item.texto}
                  </p>
                </div>
              ))}

              {!pdi.acompanhamentos?.length ? (
                <p className="text-sm text-slate-500">Nenhum acompanhamento registrado.</p>
              ) : null}
            </div>

            <div className="mt-5 space-y-3 print:hidden">
              <textarea
                value={comentario}
                onChange={(event) => setComentario(event.target.value)}
                placeholder="Registre orientação, reunião, resultado, dificuldade ou próximo passo..."
                rows={4}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 p-4"
              />
              <button
                disabled={processando || !comentario.trim()}
                onClick={() => void adicionarAcompanhamento()}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 px-5 py-3 font-black text-cyan-300 disabled:opacity-50"
              >
                <MessageSquarePlus className="h-4 w-4" />
                Registrar acompanhamento
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
            <h2 className="font-black">Assinaturas e ciência</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Assinatura
                titulo="Responsável pelo PDI"
                nome={pdi.responsavel_nome || "Não informado"}
                data={pdi.responsavel_assinatura_em}
              />
              <Assinatura
                titulo="Ciência do guarda"
                nome={pdi.guarda_ciencia_nome || pdi.guarda_nome}
                data={pdi.guarda_ciencia_em}
              />
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-3 print:hidden">
            {podeGerenciar && !pdi.responsavel_assinatura_em ? (
              <button
                disabled={processando}
                onClick={() => void assinarResponsavel()}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 px-5 py-3 font-black text-cyan-300 disabled:opacity-50"
              >
                <Signature className="h-4 w-4" />
                Assinar como responsável
              </button>
            ) : null}

            {!pdi.guarda_ciencia_em ? (
              <button
                disabled={processando}
                onClick={() => void registrarCiencia()}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/25 px-5 py-3 font-black text-emerald-300 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Registrar ciência
              </button>
            ) : null}

            {podeGerenciar && pdi.status === "RASCUNHO" ? (
              <button
                disabled={processando}
                onClick={() => void alterarStatus("ATIVO")}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" />
                Ativar
              </button>
            ) : null}

            {podeGerenciar && pdi.status === "ATIVO" ? (
              <>
                <button
                  disabled={processando}
                  onClick={() => void alterarStatus("CANCELADO")}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-400/25 px-5 py-3 font-black text-rose-300 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Cancelar
                </button>
                <button
                  disabled={processando}
                  onClick={() => void alterarStatus("CONCLUIDO")}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Concluir
                </button>
              </>
            ) : null}
          </div>
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Resumo({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
      <p className="text-xs font-black uppercase text-slate-500 print:text-black">{titulo}</p>
      <p className="mt-2 font-black">{valor}</p>
    </div>
  );
}

function Texto({ titulo, valor }: { titulo: string; valor: string | null }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
      <h2 className="font-black">{titulo}</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-400 print:text-black">
        {valor || "Nenhuma informação registrada."}
      </p>
    </div>
  );
}

function Assinatura({
  titulo,
  nome,
  data,
}: {
  titulo: string;
  nome: string;
  data: string | null;
}) {
  return (
    <div className="rounded-xl border border-slate-700 p-4 print:border-black">
      <p className="text-xs font-black uppercase text-slate-500 print:text-black">{titulo}</p>
      <p className="mt-3 font-black">{nome}</p>
      <p className="mt-1 text-xs text-slate-500 print:text-black">
        {data ? new Date(data).toLocaleString("pt-BR") : "Assinatura pendente"}
      </p>
    </div>
  );
}
