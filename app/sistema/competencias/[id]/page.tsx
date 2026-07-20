"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpenCheck,
  Loader2,
  Printer,
  Save,
  Target,
  UserPlus,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  NIVEIS_COMPETENCIA,
  formatarTextoCompetencia,
  lerUsuarioCompetencia,
  nomeNivelCompetencia,
  podeGerenciarCompetencias,
} from "@/lib/competencias";
import { supabase } from "@/lib/supabase";

type Competencia = {
  id: number;
  nome: string;
  categoria: string;
  descricao: string | null;
  evidencias_esperadas: string | null;
  curso_recomendado_id: number | null;
  curso_recomendado_nome: string | null;
};

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
};

type Matriz = {
  id: number;
  guarda_id: number;
  guarda_nome: string;
  matricula: string | null;
  nivel_atual: number;
  nivel_exigido: number;
  autoavaliacao_nivel: number | null;
  evidencias: string | null;
  observacao_comando: string | null;
  status_validacao: string;
};

export default function CompetenciaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [usuario] = useState(() => lerUsuarioCompetencia());
  const [competencia, setCompetencia] = useState<Competencia | null>(null);
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [matriz, setMatriz] = useState<Matriz[]>([]);
  const [guardaId, setGuardaId] = useState("");
  const [nivelExigido, setNivelExigido] = useState("2");
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario
    ? podeGerenciarCompetencias(usuario.perfil)
    : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) return;

    setCarregando(true);
    setErro("");

    const [competenciaResp, guardasResp, matrizResp] = await Promise.all([
      supabase
        .from("competencias_catalogo")
        .select("*")
        .eq("id", Number(id))
        .eq("municipio_id", usuario.municipio_id)
        .single(),
      supabase
        .from("guardas")
        .select("id,nome,matricula")
        .eq("municipio_id", usuario.municipio_id)
        .order("nome"),
      supabase
        .from("competencias_matriz_guardas")
        .select("*")
        .eq("competencia_id", Number(id))
        .eq("municipio_id", usuario.municipio_id)
        .order("guarda_nome"),
    ]);

    if (competenciaResp.error) setErro(competenciaResp.error.message);
    else setCompetencia(competenciaResp.data as Competencia);

    if (!guardasResp.error) setGuardas((guardasResp.data as Guarda[] | null) || []);
    if (!matrizResp.error) setMatriz((matrizResp.data as Matriz[] | null) || []);
    setCarregando(false);
  }, [id, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function vincularGuarda() {
    if (!competencia || !usuario || !guardaId || !podeGerenciar) return;

    const guarda = guardas.find((item) => String(item.id) === guardaId);
    if (!guarda) return;

    setProcessando(true);
    setErro("");

    const { data, error } = await supabase
      .from("competencias_matriz_guardas")
      .upsert(
        {
          municipio_id: usuario.municipio_id,
          guarda_id: guarda.id,
          guarda_nome: guarda.nome,
          matricula: guarda.matricula,
          competencia_id: competencia.id,
          competencia_nome: competencia.nome,
          nivel_atual: 1,
          nivel_exigido: Number(nivelExigido),
          status_validacao: "PENDENTE",
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: "municipio_id,guarda_id,competencia_id" }
      )
      .select("id")
      .single();

    if (error) {
      setErro(error.message);
      setProcessando(false);
      return;
    }

    await registrarAuditoria({
      modulo: "RH",
      acao: "VINCULAR_COMPETENCIA",
      tabela: "competencias_matriz_guardas",
      registro_id: data.id,
      descricao: `${competencia.nome} vinculada a ${guarda.nome}.`,
    });

    setGuardaId("");
    await carregar();
    setProcessando(false);
  }

  function alterarLocal(
    registroId: number,
    campo:
      | "nivel_atual"
      | "nivel_exigido"
      | "autoavaliacao_nivel"
      | "evidencias"
      | "observacao_comando",
    valor: string
  ) {
    setMatriz((atual) =>
      atual.map((item) =>
        item.id === registroId
          ? {
              ...item,
              [campo]:
                campo.includes("nivel")
                  ? valor === ""
                    ? null
                    : Number(valor)
                  : valor,
            }
          : item
      )
    );
  }

  async function salvarRegistro(item: Matriz, validar: boolean) {
    if (!usuario || !podeGerenciar) return;

    const { error } = await supabase
      .from("competencias_matriz_guardas")
      .update({
        nivel_atual: item.nivel_atual,
        nivel_exigido: item.nivel_exigido,
        autoavaliacao_nivel: item.autoavaliacao_nivel,
        evidencias: item.evidencias || null,
        observacao_comando: item.observacao_comando || null,
        status_validacao: validar ? "VALIDADO" : item.status_validacao,
        validado_por_id: validar ? String(usuario.id) : null,
        validado_por_nome: validar ? usuario.nome : null,
        validado_em: validar ? new Date().toISOString() : null,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", item.id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      setErro(error.message);
      return;
    }

    await registrarAuditoria({
      modulo: "RH",
      acao: validar ? "VALIDAR_COMPETENCIA" : "ATUALIZAR_COMPETENCIA",
      tabela: "competencias_matriz_guardas",
      registro_id: item.id,
      descricao: `Competência ${competencia?.nome || ""} atualizada para ${item.guarda_nome}.`,
    });

    await carregar();
  }

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020b1c]">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
      </div>
    );
  }

  if (!competencia) {
    return (
      <div className="min-h-screen bg-[#020b1c] p-8 text-white">
        {erro || "Competência não encontrada."}
      </div>
    );
  }

  const vinculados = new Set(matriz.map((item) => item.guarda_id));
  const guardasDisponiveis = guardas.filter((item) => !vinculados.has(item.id));

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white print:bg-white print:text-black lg:px-7">
        <div className="mx-auto max-w-[1500px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 print:border-black print:bg-white lg:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Link
                  href="/sistema/competencias"
                  className="inline-flex items-center gap-2 text-sm font-black text-cyan-300 print:hidden"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Link>
                <h1 className="mt-4 text-2xl font-black">{competencia.nome}</h1>
                <p className="mt-1 text-sm text-slate-400 print:text-black">
                  {formatarTextoCompetencia(competencia.categoria)}
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

          <section className="grid gap-4 md:grid-cols-2">
            <Texto titulo="Descrição" valor={competencia.descricao} />
            <Texto
              titulo="Evidências esperadas"
              valor={competencia.evidencias_esperadas}
            />
          </section>

          {competencia.curso_recomendado_id ? (
            <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-5 print:hidden">
              <p className="text-xs font-black uppercase text-cyan-300">
                Curso recomendado
              </p>
              <Link
                href={`/sistema/capacitacoes/${competencia.curso_recomendado_id}`}
                className="mt-2 inline-flex items-center gap-2 font-black text-white underline decoration-cyan-300 underline-offset-4"
              >
                <BookOpenCheck className="h-4 w-4" />
                {competencia.curso_recomendado_nome}
              </Link>
            </section>
          ) : null}

          {podeGerenciar ? (
            <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:hidden">
              <h2 className="font-black">Vincular ao guarda</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px_auto]">
                <select
                  value={guardaId}
                  onChange={(event) => setGuardaId(event.target.value)}
                  className="h-12 rounded-xl border border-slate-700 bg-slate-950/60 px-4"
                >
                  <option value="">Selecione...</option>
                  {guardasDisponiveis.map((guarda) => (
                    <option key={guarda.id} value={guarda.id}>
                      {guarda.nome} — {guarda.matricula || "sem matrícula"}
                    </option>
                  ))}
                </select>

                <select
                  value={nivelExigido}
                  onChange={(event) => setNivelExigido(event.target.value)}
                  className="h-12 rounded-xl border border-slate-700 bg-slate-950/60 px-4"
                >
                  {NIVEIS_COMPETENCIA.map((nivel) => (
                    <option key={nivel.valor} value={nivel.valor}>
                      Exigido: {nivel.titulo}
                    </option>
                  ))}
                </select>

                <button
                  disabled={processando || !guardaId}
                  onClick={() => void vincularGuarda()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
                >
                  <UserPlus className="h-4 w-4" />
                  Vincular
                </button>
              </div>
            </section>
          ) : null}

          <section className="space-y-4">
            {matriz.map((item) => {
              const lacuna = Math.max(
                0,
                Number(item.nivel_exigido) - Number(item.nivel_atual)
              );

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="font-black">{item.guarda_nome}</h3>
                      <p className="text-xs text-slate-500 print:text-black">
                        {item.matricula || "Sem matrícula"} •{" "}
                        {formatarTextoCompetencia(item.status_validacao)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-cyan-400/20 px-4 py-2 text-sm font-black text-cyan-300 print:border-black print:text-black">
                      Lacuna: {lacuna} nível(is)
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <CampoSelect
                      titulo="Nível atual"
                      valor={item.nivel_atual}
                      alterar={(valor) =>
                        alterarLocal(item.id, "nivel_atual", valor)
                      }
                    />
                    <CampoSelect
                      titulo="Nível exigido"
                      valor={item.nivel_exigido}
                      alterar={(valor) =>
                        alterarLocal(item.id, "nivel_exigido", valor)
                      }
                    />
                    <CampoSelect
                      titulo="Autoavaliação"
                      valor={item.autoavaliacao_nivel}
                      permitirVazio
                      alterar={(valor) =>
                        alterarLocal(item.id, "autoavaliacao_nivel", valor)
                      }
                    />
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <textarea
                      value={item.evidencias || ""}
                      onChange={(event) =>
                        alterarLocal(item.id, "evidencias", event.target.value)
                      }
                      rows={3}
                      placeholder="Evidências apresentadas"
                      className="rounded-xl border border-slate-700 bg-slate-950/60 p-4 print:border-black print:bg-white"
                    />
                    <textarea
                      value={item.observacao_comando || ""}
                      onChange={(event) =>
                        alterarLocal(
                          item.id,
                          "observacao_comando",
                          event.target.value
                        )
                      }
                      rows={3}
                      placeholder="Observação do comando"
                      className="rounded-xl border border-slate-700 bg-slate-950/60 p-4 print:border-black print:bg-white"
                    />
                  </div>

                  {podeGerenciar ? (
                    <div className="mt-4 flex flex-wrap justify-end gap-3 print:hidden">
                      <button
                        onClick={() => void salvarRegistro(item, false)}
                        className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 px-4 py-3 font-black text-cyan-300"
                      >
                        <Save className="h-4 w-4" />
                        Salvar
                      </button>
                      <button
                        onClick={() => void salvarRegistro(item, true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 font-black text-slate-950"
                      >
                        <Target className="h-4 w-4" />
                        Validar
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}

            {!matriz.length ? (
              <div className="rounded-2xl border border-slate-800 bg-[#061326] p-14 text-center text-slate-500">
                Nenhum guarda vinculado.
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function CampoSelect({
  titulo,
  valor,
  alterar,
  permitirVazio = false,
}: {
  titulo: string;
  valor: number | null;
  alterar: (valor: string) => void;
  permitirVazio?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-black uppercase text-slate-500 print:text-black">
        {titulo}
      </span>
      <select
        value={valor ?? ""}
        onChange={(event) => alterar(event.target.value)}
        className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 print:border-black print:bg-white"
      >
        {permitirVazio ? <option value="">Não informado</option> : null}
        {NIVEIS_COMPETENCIA.map((nivel) => (
          <option key={nivel.valor} value={nivel.valor}>
            {nivel.titulo}
          </option>
        ))}
      </select>
    </label>
  );
}

function Texto({ titulo, valor }: { titulo: string; valor: string | null }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
      <h2 className="font-black">{titulo}</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-400 print:text-black">
        {valor || "Nenhuma informação registrada."}
      </p>
    </section>
  );
}
