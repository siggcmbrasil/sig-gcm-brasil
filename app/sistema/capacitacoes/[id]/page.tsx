"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarPlus,
  Eye,
  Loader2,
  Printer,
  Save,
  Users,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  formatarTextoCapacitacao,
  lerUsuarioCapacitacao,
  podeGerenciarCapacitacoes,
} from "@/lib/capacitacoes";
import { supabase } from "@/lib/supabase";

type Curso = {
  id: number;
  nome: string;
  categoria: string;
  modalidade: string;
  carga_horaria: number;
  ementa: string | null;
  objetivos: string | null;
  publico_alvo: string | null;
  obrigatorio: boolean;
  validade_meses: number | null;
  nota_minima: number;
  frequencia_minima: number;
  status: string;
};

type Turma = {
  id: number;
  codigo: string;
  instrutor_nome: string | null;
  local: string | null;
  data_inicio: string;
  data_fim: string;
  vagas: number;
  status: string;
};

export default function CursoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [usuario] = useState(() => lerUsuarioCapacitacao());
  const [curso, setCurso] = useState<Curso | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [codigo, setCodigo] = useState("");
  const [instrutor, setInstrutor] = useState("");
  const [local, setLocal] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [vagas, setVagas] = useState("30");
  const [status, setStatus] = useState("INSCRICOES_ABERTAS");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario
    ? podeGerenciarCapacitacoes(usuario.perfil)
    : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) return;

    setCarregando(true);
    setErro("");

    const [cursoResp, turmasResp] = await Promise.all([
      supabase
        .from("capacitacoes_cursos")
        .select("*")
        .eq("id", Number(id))
        .eq("municipio_id", usuario.municipio_id)
        .single(),
      supabase
        .from("capacitacoes_turmas")
        .select("*")
        .eq("curso_id", Number(id))
        .eq("municipio_id", usuario.municipio_id)
        .order("data_inicio", { ascending: false }),
    ]);

    if (cursoResp.error) setErro(cursoResp.error.message);
    else setCurso(cursoResp.data as Curso);

    if (!turmasResp.error) setTurmas((turmasResp.data as Turma[] | null) || []);
    setCarregando(false);
  }, [id, usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function criarTurma() {
    if (!curso || !usuario || !podeGerenciar) return;

    if (!codigo.trim() || !dataInicio || !dataFim) {
      setErro("Informe código, data inicial e data final.");
      return;
    }

    setSalvando(true);
    setErro("");

    const { data, error } = await supabase
      .from("capacitacoes_turmas")
      .insert({
        municipio_id: usuario.municipio_id,
        curso_id: curso.id,
        curso_nome: curso.nome,
        codigo: codigo.trim(),
        instrutor_nome: instrutor.trim() || null,
        local: local.trim() || null,
        modalidade: curso.modalidade,
        data_inicio: dataInicio,
        data_fim: dataFim,
        vagas: Number(vagas || 0),
        status,
        criado_por_id: String(usuario.id),
        criado_por_nome: usuario.nome,
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
      acao: "CRIAR_TURMA",
      tabela: "capacitacoes_turmas",
      registro_id: data.id,
      descricao: `Turma ${codigo.trim()} criada para o curso ${curso.nome}.`,
    });

    setCodigo("");
    setInstrutor("");
    setLocal("");
    setDataInicio("");
    setDataFim("");
    setVagas("30");
    await carregar();
    setSalvando(false);
  }

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020b1c]">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-300" />
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="min-h-screen bg-[#020b1c] p-8 text-white">
        {erro || "Curso não encontrado."}
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
                  href="/sistema/capacitacoes"
                  className="inline-flex items-center gap-2 text-sm font-black text-cyan-300 print:hidden"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Link>
                <h1 className="mt-4 text-2xl font-black">{curso.nome}</h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  {formatarTextoCapacitacao(curso.categoria)} •{" "}
                  {formatarTextoCapacitacao(curso.modalidade)} •{" "}
                  {curso.carga_horaria} horas
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
            <Resumo titulo="Carga horária" valor={`${curso.carga_horaria}h`} />
            <Resumo titulo="Nota mínima" valor={Number(curso.nota_minima).toFixed(1)} />
            <Resumo titulo="Frequência mínima" valor={`${curso.frequencia_minima}%`} />
            <Resumo
              titulo="Certificação"
              valor={curso.validade_meses ? `${curso.validade_meses} meses` : "Indeterminada"}
            />
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Texto titulo="Objetivos" valor={curso.objetivos} />
            <Texto titulo="Ementa" valor={curso.ementa} />
          </section>

          {curso.publico_alvo ? (
            <Texto titulo="Público-alvo" valor={curso.publico_alvo} />
          ) : null}

          {podeGerenciar ? (
            <section className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:hidden">
              <div className="mb-5">
                <h2 className="text-lg font-black">Criar turma</h2>
                <p className="text-sm text-slate-400">
                  Defina período, instrutor, vagas e situação das inscrições.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <input
                  value={codigo}
                  onChange={(event) => setCodigo(event.target.value)}
                  placeholder="Código da turma"
                  className="h-11 rounded-lg border border-slate-700 bg-slate-950/60 px-3"
                />
                <input
                  value={instrutor}
                  onChange={(event) => setInstrutor(event.target.value)}
                  placeholder="Instrutor"
                  className="h-11 rounded-lg border border-slate-700 bg-slate-950/60 px-3"
                />
                <input
                  value={local}
                  onChange={(event) => setLocal(event.target.value)}
                  placeholder="Local ou link"
                  className="h-11 rounded-lg border border-slate-700 bg-slate-950/60 px-3"
                />
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(event) => setDataInicio(event.target.value)}
                  className="h-11 rounded-lg border border-slate-700 bg-slate-950/60 px-3"
                />
                <input
                  type="date"
                  value={dataFim}
                  onChange={(event) => setDataFim(event.target.value)}
                  className="h-11 rounded-lg border border-slate-700 bg-slate-950/60 px-3"
                />
                <input
                  type="number"
                  min="1"
                  value={vagas}
                  onChange={(event) => setVagas(event.target.value)}
                  placeholder="Vagas"
                  className="h-11 rounded-lg border border-slate-700 bg-slate-950/60 px-3"
                />
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="h-11 rounded-lg border border-slate-700 bg-slate-950/60 px-3"
                >
                  <option value="PLANEJADA">Planejada</option>
                  <option value="INSCRICOES_ABERTAS">Inscrições abertas</option>
                  <option value="EM_ANDAMENTO">Em andamento</option>
                </select>

                <button
                  disabled={salvando}
                  onClick={() => void criarTurma()}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-4 font-black text-slate-950 disabled:opacity-50"
                >
                  {salvando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CalendarPlus className="h-4 w-4" />
                  )}
                  Criar turma
                </button>
              </div>
            </section>
          ) : null}

          <section className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#061326] print:border-black print:bg-white">
            <div className="border-b border-slate-800 p-5">
              <h2 className="text-lg font-black">Turmas</h2>
            </div>

            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-700 text-[10px] uppercase text-slate-400 print:text-black">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Período</th>
                  <th className="px-4 py-3">Instrutor</th>
                  <th className="px-4 py-3">Local</th>
                  <th className="px-4 py-3">Vagas</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 print:hidden">Ações</th>
                </tr>
              </thead>
              <tbody>
                {turmas.map((turma) => (
                  <tr key={turma.id} className="border-b border-slate-800/70">
                    <td className="px-4 py-4 font-black">{turma.codigo}</td>
                    <td className="px-4 py-4">
                      {new Date(`${turma.data_inicio}T00:00:00`).toLocaleDateString("pt-BR")}
                      {" — "}
                      {new Date(`${turma.data_fim}T00:00:00`).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-4">{turma.instrutor_nome || "Não informado"}</td>
                    <td className="px-4 py-4">{turma.local || "Não informado"}</td>
                    <td className="px-4 py-4">{turma.vagas}</td>
                    <td className="px-4 py-4">{formatarTextoCapacitacao(turma.status)}</td>
                    <td className="px-4 py-4 print:hidden">
                      <Link
                        href={`/sistema/capacitacoes/turmas/${turma.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/25 px-3 py-2 font-black text-cyan-300"
                      >
                        <Eye className="h-4 w-4" />
                        Gerenciar
                      </Link>
                    </td>
                  </tr>
                ))}

                {!turmas.length ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-14 text-center text-slate-500">
                      Nenhuma turma cadastrada.
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
