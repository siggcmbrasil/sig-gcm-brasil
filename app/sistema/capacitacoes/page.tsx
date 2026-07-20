"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpenCheck,
  CalendarDays,
  Eye,
  FilePlus2,
  GraduationCap,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
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
  obrigatorio: boolean;
  validade_meses: number | null;
  status: string;
  criado_em: string;
};

type Turma = {
  id: number;
  curso_id: number;
  status: string;
  data_inicio: string;
  data_fim: string;
};

type Matricula = {
  id: number;
  status: string;
  validade_certificacao: string | null;
};

export default function CapacitacoesPage() {
  const [usuario] = useState(() => lerUsuarioCapacitacao());
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario
    ? podeGerenciarCapacitacoes(usuario.perfil)
    : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) {
      setErro("Sessão ou município não identificado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    const [cursosResp, turmasResp, matriculasResp] = await Promise.all([
      supabase
        .from("capacitacoes_cursos")
        .select("*")
        .eq("municipio_id", usuario.municipio_id)
        .order("nome"),
      supabase
        .from("capacitacoes_turmas")
        .select("id,curso_id,status,data_inicio,data_fim")
        .eq("municipio_id", usuario.municipio_id)
        .order("data_inicio", { ascending: false }),
      supabase
        .from("capacitacoes_matriculas")
        .select("id,status,validade_certificacao")
        .eq("municipio_id", usuario.municipio_id),
    ]);

    const primeiroErro =
      cursosResp.error || turmasResp.error || matriculasResp.error;

    if (primeiroErro) {
      setErro(primeiroErro.message);
    }

    setCursos((cursosResp.data as Curso[] | null) || []);
    setTurmas((turmasResp.data as Turma[] | null) || []);
    setMatriculas((matriculasResp.data as Matricula[] | null) || []);
    setCarregando(false);
  }, [usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return cursos.filter((item) =>
      `${item.nome} ${item.categoria} ${item.modalidade}`
        .toLowerCase()
        .includes(termo)
    );
  }, [busca, cursos]);

  const turmasAtivas = turmas.filter((item) =>
    ["PLANEJADA", "INSCRICOES_ABERTAS", "EM_ANDAMENTO"].includes(item.status)
  ).length;

  const aprovados = matriculas.filter((item) => item.status === "APROVADO").length;

  const vencendo = matriculas.filter((item) => {
    if (!item.validade_certificacao) return false;
    const validade = new Date(`${item.validade_certificacao}T00:00:00`);
    const limite = new Date();
    limite.setDate(limite.getDate() + 60);
    return validade >= new Date() && validade <= limite;
  }).length;

  async function imprimir() {
    await registrarAuditoria({
      modulo: "RH",
      acao: "IMPRIMIR",
      tabela: "capacitacoes_cursos",
      descricao: "Impressão do painel de cursos e capacitações.",
    });
    window.print();
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white print:bg-white print:text-black lg:px-7">
        <div className="mx-auto max-w-[1700px] space-y-5">
          <header className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#07182f] to-[#020b1c] p-5 print:border-black print:bg-white lg:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300 print:text-black">
                  Formação profissional
                </p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">
                  Cursos, Capacitações e Certificações
                </h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  Catálogo, turmas, inscrições, frequência, notas, certificados e validade.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 print:hidden">
                <button
                  onClick={() => void carregar()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-black"
                >
                  <RefreshCw className="h-4 w-4" />
                  Atualizar
                </button>

                <button
                  onClick={() => void imprimir()}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-300"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir/PDF
                </button>


                <Link
                  href="/sistema/treinamentos-obrigatorios"
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm font-black text-amber-300"
                >
                  Treinamentos obrigatórios
                </Link>

                {podeGerenciar ? (
                  <Link
                    href="/sistema/capacitacoes/novo"
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950"
                  >
                    <FilePlus2 className="h-4 w-4" />
                    Novo curso
                  </Link>
                ) : null}
              </div>
            </div>
          </header>

          {erro ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metrica titulo="Cursos cadastrados" valor={cursos.length} icone={BookOpenCheck} />
            <Metrica titulo="Turmas ativas" valor={turmasAtivas} icone={CalendarDays} />
            <Metrica titulo="Aprovações" valor={aprovados} icone={ShieldCheck} />
            <Metrica titulo="Certificados vencendo" valor={vencendo} icone={AlertTriangle} />
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-4 print:hidden">
            <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/60 px-4">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar curso, categoria ou modalidade..."
                className="h-12 w-full bg-transparent outline-none"
              />
            </label>
          </section>

          <section className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#061326] print:border-black print:bg-white">
            {carregando ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
              </div>
            ) : (
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="border-b border-slate-700 text-[10px] uppercase text-slate-400 print:text-black">
                  <tr>
                    <th className="px-4 py-3">Curso</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3">Modalidade</th>
                    <th className="px-4 py-3">Carga horária</th>
                    <th className="px-4 py-3">Obrigatório</th>
                    <th className="px-4 py-3">Validade</th>
                    <th className="px-4 py-3">Turmas</th>
                    <th className="px-4 py-3 print:hidden">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((curso) => {
                    const quantidadeTurmas = turmas.filter(
                      (turma) => turma.curso_id === curso.id
                    ).length;

                    return (
                      <tr key={curso.id} className="border-b border-slate-800/70">
                        <td className="px-4 py-4">
                          <p className="font-black">{curso.nome}</p>
                          <p className="text-xs text-slate-500">
                            {formatarTextoCapacitacao(curso.status)}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          {formatarTextoCapacitacao(curso.categoria)}
                        </td>
                        <td className="px-4 py-4">
                          {formatarTextoCapacitacao(curso.modalidade)}
                        </td>
                        <td className="px-4 py-4">{curso.carga_horaria}h</td>
                        <td className="px-4 py-4">{curso.obrigatorio ? "Sim" : "Não"}</td>
                        <td className="px-4 py-4">
                          {curso.validade_meses ? `${curso.validade_meses} meses` : "Sem validade"}
                        </td>
                        <td className="px-4 py-4">{quantidadeTurmas}</td>
                        <td className="px-4 py-4 print:hidden">
                          <Link
                            href={`/sistema/capacitacoes/${curso.id}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/25 px-3 py-2 font-black text-cyan-300"
                          >
                            <Eye className="h-4 w-4" />
                            Abrir
                          </Link>
                        </td>
                      </tr>
                    );
                  })}

                  {!filtrados.length ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-16 text-center text-slate-500">
                        Nenhum curso encontrado.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function Metrica({
  titulo,
  valor,
  icone: Icone,
}: {
  titulo: string;
  valor: number | string;
  icone: typeof GraduationCap;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
      <Icone className="h-6 w-6 text-cyan-300 print:text-black" />
      <p className="mt-4 text-[10px] font-black uppercase tracking-wider text-slate-500 print:text-black">
        {titulo}
      </p>
      <p className="mt-1 text-xl font-black">{valor}</p>
    </div>
  );
}
