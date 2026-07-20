"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Loader2,
  Plus,
  Printer,
  Save,
  UserPlus,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  calcularSituacaoMatricula,
  formatarTextoCapacitacao,
  lerUsuarioCapacitacao,
  podeGerenciarCapacitacoes,
} from "@/lib/capacitacoes";
import { supabase } from "@/lib/supabase";

type Turma = {
  id: number;
  curso_id: number;
  curso_nome: string;
  codigo: string;
  instrutor_nome: string | null;
  local: string | null;
  data_inicio: string;
  data_fim: string;
  vagas: number;
  status: string;
};

type Curso = {
  id: number;
  nota_minima: number;
  frequencia_minima: number;
  validade_meses: number | null;
  carga_horaria: number;
};

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
};

type Matricula = {
  id: number;
  guarda_id: number;
  guarda_nome: string;
  matricula: string | null;
  frequencia_percentual: number;
  nota_final: number | null;
  status: string;
  certificado_numero: string | null;
  certificado_emitido_em: string | null;
  validade_certificacao: string | null;
  observacao: string | null;
};

export default function TurmaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [usuario] = useState(() => lerUsuarioCapacitacao());
  const [turma, setTurma] = useState<Turma | null>(null);
  const [curso, setCurso] = useState<Curso | null>(null);
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [guardaId, setGuardaId] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario
    ? podeGerenciarCapacitacoes(usuario.perfil)
    : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) return;

    setCarregando(true);
    setErro("");

    const turmaResp = await supabase
      .from("capacitacoes_turmas")
      .select("*")
      .eq("id", Number(id))
      .eq("municipio_id", usuario.municipio_id)
      .single();

    if (turmaResp.error) {
      setErro(turmaResp.error.message);
      setCarregando(false);
      return;
    }

    const turmaAtual = turmaResp.data as Turma;
    setTurma(turmaAtual);

    const [cursoResp, guardasResp, matriculasResp] = await Promise.all([
      supabase
        .from("capacitacoes_cursos")
        .select("id,nota_minima,frequencia_minima,validade_meses,carga_horaria")
        .eq("id", turmaAtual.curso_id)
        .single(),
      supabase
        .from("guardas")
        .select("id,nome,matricula")
        .eq("municipio_id", usuario.municipio_id)
        .order("nome"),
      supabase
        .from("capacitacoes_matriculas")
        .select("*")
        .eq("turma_id", turmaAtual.id)
        .eq("municipio_id", usuario.municipio_id)
        .order("guarda_nome"),
    ]);

    if (!cursoResp.error) setCurso(cursoResp.data as Curso);
    if (!guardasResp.error) setGuardas((guardasResp.data as Guarda[] | null) || []);
    if (!matriculasResp.error) {
      setMatriculas((matriculasResp.data as Matricula[] | null) || []);
    }

    setCarregando(false);
  }, [id, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const disponiveis = useMemo(() => {
    const matriculados = new Set(matriculas.map((item) => item.guarda_id));
    return guardas.filter((item) => !matriculados.has(item.id));
  }, [guardas, matriculas]);

  async function inscrever() {
    if (!turma || !usuario || !guardaId || !podeGerenciar) return;

    const guarda = guardas.find((item) => String(item.id) === guardaId);
    if (!guarda) return;

    if (matriculas.length >= turma.vagas) {
      setErro("A turma atingiu o limite de vagas.");
      return;
    }

    setProcessando(true);
    setErro("");

    const { data, error } = await supabase
      .from("capacitacoes_matriculas")
      .insert({
        municipio_id: usuario.municipio_id,
        turma_id: turma.id,
        curso_id: turma.curso_id,
        guarda_id: guarda.id,
        guarda_nome: guarda.nome,
        matricula: guarda.matricula,
        status: "INSCRITO",
        inscrito_por_id: String(usuario.id),
        inscrito_por_nome: usuario.nome,
      })
      .select("id")
      .single();

    if (error) {
      setErro(error.message);
      setProcessando(false);
      return;
    }

    await registrarAuditoria({
      modulo: "RH",
      acao: "INSCREVER_GUARDA",
      tabela: "capacitacoes_matriculas",
      registro_id: data.id,
      descricao: `${guarda.nome} inscrito na turma ${turma.codigo}.`,
    });

    setGuardaId("");
    await carregar();
    setProcessando(false);
  }

  function alterarLocal(
    matriculaId: number,
    campo: "frequencia_percentual" | "nota_final" | "observacao",
    valor: string
  ) {
    setMatriculas((atual) =>
      atual.map((item) =>
        item.id === matriculaId
          ? {
              ...item,
              [campo]:
                campo === "observacao"
                  ? valor
                  : valor === ""
                    ? campo === "nota_final"
                      ? null
                      : 0
                    : Number(valor),
            }
          : item
      )
    );
  }

  async function salvarMatricula(item: Matricula) {
    if (!curso || !usuario || !podeGerenciar) return;

    const situacao = calcularSituacaoMatricula(
      item.nota_final,
      Number(curso.nota_minima),
      Number(item.frequencia_percentual),
      Number(curso.frequencia_minima)
    );

    const { error } = await supabase
      .from("capacitacoes_matriculas")
      .update({
        frequencia_percentual: item.frequencia_percentual,
        nota_final: item.nota_final,
        status: situacao,
        observacao: item.observacao || null,
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
      acao: "ATUALIZAR_RESULTADO",
      tabela: "capacitacoes_matriculas",
      registro_id: item.id,
      descricao: `Resultado atualizado para ${item.guarda_nome}.`,
      detalhes: {
        frequencia: item.frequencia_percentual,
        nota: item.nota_final,
        status: situacao,
      },
    });

    await carregar();
  }

  async function emitirCertificado(item: Matricula) {
    if (!curso || !turma || !usuario || item.status !== "APROVADO") return;

    const numero = `SIG-${usuario.municipio_id}-${turma.id}-${item.id}-${new Date().getFullYear()}`;
    const emissao = new Date();
    const validade = curso.validade_meses
      ? new Date(
          emissao.getFullYear(),
          emissao.getMonth() + curso.validade_meses,
          emissao.getDate()
        )
      : null;

    const { error } = await supabase
      .from("capacitacoes_matriculas")
      .update({
        certificado_numero: numero,
        certificado_emitido_em: emissao.toISOString(),
        validade_certificacao: validade
          ? validade.toISOString().slice(0, 10)
          : null,
        atualizado_em: emissao.toISOString(),
      })
      .eq("id", item.id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      setErro(error.message);
      return;
    }

    await supabase.from("cursos_guardas").insert({
      municipio_id: usuario.municipio_id,
      guarda_id: item.guarda_id,
      curso: turma.curso_nome,
      instituicao: "SIG-GCM Brasil",
      carga_horaria: curso.carga_horaria,
      data_conclusao: turma.data_fim,
      observacao: `Certificado ${numero}`,
    });

    await registrarAuditoria({
      modulo: "RH",
      acao: "EMITIR_CERTIFICADO",
      tabela: "capacitacoes_matriculas",
      registro_id: item.id,
      descricao: `Certificado emitido para ${item.guarda_nome}.`,
      detalhes: { certificado_numero: numero },
    });

    await carregar();
  }

  async function concluirTurma() {
    if (!turma || !usuario || !podeGerenciar) return;

    const { error } = await supabase
      .from("capacitacoes_turmas")
      .update({
        status: "CONCLUIDA",
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", turma.id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      setErro(error.message);
      return;
    }

    await registrarAuditoria({
      modulo: "RH",
      acao: "CONCLUIR_TURMA",
      tabela: "capacitacoes_turmas",
      registro_id: turma.id,
      descricao: `Turma ${turma.codigo} concluída.`,
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

  if (!turma || !curso) {
    return (
      <div className="min-h-screen bg-[#020b1c] p-8 text-white">
        {erro || "Turma não encontrada."}
      </div>
    );
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white print:bg-white print:text-black lg:px-7">
        <div className="mx-auto max-w-[1500px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-[#061326] p-5 print:border-black print:bg-white lg:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Link
                  href={`/sistema/capacitacoes/${turma.curso_id}`}
                  className="inline-flex items-center gap-2 text-sm font-black text-cyan-300 print:hidden"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Link>
                <h1 className="mt-4 text-2xl font-black">{turma.curso_nome}</h1>
                <p className="mt-1 text-sm text-slate-400 print:text-black">
                  Turma {turma.codigo} • {formatarTextoCapacitacao(turma.status)}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 print:hidden">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 px-4 py-3 font-black text-cyan-300"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir/PDF
                </button>

                {podeGerenciar && turma.status !== "CONCLUIDA" ? (
                  <button
                    onClick={() => void concluirTurma()}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 font-black text-slate-950"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Concluir turma
                  </button>
                ) : null}
              </div>
            </div>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Resumo titulo="Período" valor={`${new Date(`${turma.data_inicio}T00:00:00`).toLocaleDateString("pt-BR")} a ${new Date(`${turma.data_fim}T00:00:00`).toLocaleDateString("pt-BR")}`} />
            <Resumo titulo="Instrutor" valor={turma.instrutor_nome || "Não informado"} />
            <Resumo titulo="Inscritos" valor={`${matriculas.length}/${turma.vagas}`} />
            <Resumo titulo="Local" valor={turma.local || "Não informado"} />
          </section>

          {podeGerenciar && turma.status !== "CONCLUIDA" ? (
            <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:hidden">
              <h2 className="font-black">Inscrever guarda</h2>
              <div className="mt-4 flex flex-col gap-3 md:flex-row">
                <select
                  value={guardaId}
                  onChange={(event) => setGuardaId(event.target.value)}
                  className="h-12 flex-1 rounded-xl border border-slate-700 bg-slate-950/60 px-4"
                >
                  <option value="">Selecione...</option>
                  {disponiveis.map((guarda) => (
                    <option key={guarda.id} value={guarda.id}>
                      {guarda.nome} — {guarda.matricula || "sem matrícula"}
                    </option>
                  ))}
                </select>

                <button
                  disabled={processando || !guardaId}
                  onClick={() => void inscrever()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
                >
                  <UserPlus className="h-4 w-4" />
                  Inscrever
                </button>
              </div>
            </section>
          ) : null}

          <section className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#061326] print:border-black print:bg-white">
            <table className="w-full min-w-[1250px] text-left text-sm">
              <thead className="border-b border-slate-700 text-[10px] uppercase text-slate-400 print:text-black">
                <tr>
                  <th className="px-4 py-3">Guarda</th>
                  <th className="px-4 py-3">Frequência</th>
                  <th className="px-4 py-3">Nota</th>
                  <th className="px-4 py-3">Situação</th>
                  <th className="px-4 py-3">Observação</th>
                  <th className="px-4 py-3">Certificado</th>
                  <th className="px-4 py-3 print:hidden">Ações</th>
                </tr>
              </thead>
              <tbody>
                {matriculas.map((item) => (
                  <tr key={item.id} className="border-b border-slate-800/70 align-top">
                    <td className="px-4 py-4">
                      <p className="font-black">{item.guarda_nome}</p>
                      <p className="text-xs text-slate-500">
                        {item.matricula || "Sem matrícula"}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.frequencia_percentual}
                        onChange={(event) =>
                          alterarLocal(item.id, "frequencia_percentual", event.target.value)
                        }
                        className="h-10 w-24 rounded-lg border border-slate-700 bg-slate-950/60 px-3 print:border-0 print:bg-white"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={item.nota_final ?? ""}
                        onChange={(event) =>
                          alterarLocal(item.id, "nota_final", event.target.value)
                        }
                        className="h-10 w-24 rounded-lg border border-slate-700 bg-slate-950/60 px-3 print:border-0 print:bg-white"
                      />
                    </td>
                    <td className="px-4 py-4">
                      {formatarTextoCapacitacao(item.status)}
                    </td>
                    <td className="px-4 py-4">
                      <textarea
                        value={item.observacao || ""}
                        onChange={(event) =>
                          alterarLocal(item.id, "observacao", event.target.value)
                        }
                        rows={2}
                        className="w-64 rounded-lg border border-slate-700 bg-slate-950/60 p-2 print:border-0 print:bg-white"
                      />
                    </td>
                    <td className="px-4 py-4">
                      {item.certificado_numero ? (
                        <div>
                          <p className="font-black text-emerald-300 print:text-black">
                            {item.certificado_numero}
                          </p>
                          <p className="text-xs text-slate-500 print:text-black">
                            Validade: {item.validade_certificacao
                              ? new Date(`${item.validade_certificacao}T00:00:00`).toLocaleDateString("pt-BR")
                              : "indeterminada"}
                          </p>
                        </div>
                      ) : (
                        "Não emitido"
                      )}
                    </td>
                    <td className="px-4 py-4 print:hidden">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => void salvarMatricula(item)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-400/25 px-3 py-2 font-black text-cyan-300"
                        >
                          <Save className="h-4 w-4" />
                          Salvar
                        </button>

                        {item.status === "APROVADO" && !item.certificado_numero ? (
                          <button
                            onClick={() => void emitirCertificado(item)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-400 px-3 py-2 font-black text-slate-950"
                          >
                            <Award className="h-4 w-4" />
                            Certificar
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}

                {!matriculas.length ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
                      Nenhum guarda inscrito.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </section>
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
