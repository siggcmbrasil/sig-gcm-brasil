"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  FilePlus2,
  GraduationCap,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  formatarConcursos,
  formatarDataConcurso,
  lerUsuarioConcursos,
  podeGerenciarConcursos,
} from "@/lib/concursosProvimento";
import { supabase } from "@/lib/supabase";

type Concurso = {
  id: number;
  numero_edital: string;
  titulo: string;
  cargo: string;
  vagas_imediatas: number;
  vagas_cadastro_reserva: number;
  vagas_cotas: number;
  data_publicacao: string | null;
  validade_ate: string | null;
  status: string;
  organizadora: string | null;
};

type Candidato = {
  id: number;
  concurso_id: number;
  nome: string;
  classificacao: number | null;
  status: string;
};

type Convocacao = {
  id: number;
  concurso_id: number;
  candidato_id: number;
  prazo_apresentacao: string | null;
  status: string;
};

export default function ConcursosProvimentoPage() {
  const [usuario] = useState(() => lerUsuarioConcursos());
  const [concursos, setConcursos] = useState<Concurso[]>([]);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [convocacoes, setConvocacoes] = useState<Convocacao[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario
    ? podeGerenciarConcursos(usuario.perfil)
    : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) {
      setErro("Sessão ou município não identificado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    const [concursosResp, candidatosResp, convocacoesResp] = await Promise.all([
      supabase
        .from("concursos_publicos")
        .select("*")
        .eq("municipio_id", usuario.municipio_id)
        .order("criado_em", { ascending: false }),
      supabase
        .from("concursos_candidatos")
        .select("id,concurso_id,nome,classificacao,status")
        .eq("municipio_id", usuario.municipio_id),
      supabase
        .from("concursos_convocacoes")
        .select("id,concurso_id,candidato_id,prazo_apresentacao,status")
        .eq("municipio_id", usuario.municipio_id),
    ]);

    const primeiroErro =
      concursosResp.error || candidatosResp.error || convocacoesResp.error;

    if (primeiroErro) setErro(primeiroErro.message);

    setConcursos((concursosResp.data as Concurso[] | null) || []);
    setCandidatos((candidatosResp.data as Candidato[] | null) || []);
    setConvocacoes((convocacoesResp.data as Convocacao[] | null) || []);
    setCarregando(false);
  }, [usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return concursos.filter((item) =>
      `${item.numero_edital} ${item.titulo} ${item.cargo} ${item.status} ${item.organizadora || ""}`
        .toLowerCase()
        .includes(termo)
    );
  }, [busca, concursos]);

  const totalVagas = concursos.reduce(
    (total, item) => total + Number(item.vagas_imediatas || 0),
    0
  );
  const aprovados = candidatos.filter((item) =>
    ["APROVADO", "CONVOCADO", "NOMEADO", "EMPOSSADO", "EM_EXERCICIO"].includes(
      item.status
    )
  ).length;
  const emExercicio = candidatos.filter(
    (item) => item.status === "EM_EXERCICIO"
  ).length;
  const convocacoesPendentes = convocacoes.filter(
    (item) => !["CONCLUIDA", "CANCELADA", "DESISTENCIA"].includes(item.status)
  ).length;

  const hoje = new Date().toISOString().slice(0, 10);
  const prazosProximos = convocacoes.filter(
    (item) =>
      item.prazo_apresentacao &&
      item.prazo_apresentacao >= hoje &&
      item.prazo_apresentacao <=
        new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10)
  ).length;

  async function imprimir() {
    await registrarAuditoria({
      modulo: "RH",
      acao: "IMPRIMIR",
      tabela: "concursos_publicos",
      descricao: "Impressão do painel de concursos e provimento de cargos.",
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
                  Gestão de ingresso
                </p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">
                  Concursos, Convocações e Provimento
                </h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  Controle completo do edital ao exercício do novo servidor.
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
                  href="/sistema/dimensionamento-efetivo"
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 px-4 py-3 text-sm font-black text-cyan-300"
                >
                  <Users className="h-4 w-4" />
                  Dimensionamento
                </Link>

                {podeGerenciar ? (
                  <Link
                    href="/sistema/concursos-provimento/novo"
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950"
                  >
                    <FilePlus2 className="h-4 w-4" />
                    Novo concurso
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

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <Metrica titulo="Concursos" valor={concursos.length} icone={GraduationCap} />
            <Metrica titulo="Vagas imediatas" valor={totalVagas} icone={Users} />
            <Metrica titulo="Aprovados" valor={aprovados} icone={BadgeCheck} />
            <Metrica titulo="Convocações pendentes" valor={convocacoesPendentes} icone={UserCheck} />
            <Metrica titulo="Em exercício" valor={emExercicio} icone={ShieldCheck} />
            <Metrica titulo="Prazos próximos" valor={prazosProximos} icone={AlertTriangle} />
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-4 print:hidden">
            <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/60 px-4">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar edital, concurso, cargo, status ou organizadora..."
                className="h-12 w-full bg-transparent outline-none"
              />
            </label>
          </section>

          {carregando ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <Loader2 className="h-9 w-9 animate-spin text-cyan-300" />
            </div>
          ) : (
            <section className="grid gap-4 xl:grid-cols-2">
              {filtrados.map((item) => {
                const candidatosConcurso = candidatos.filter(
                  (candidato) => candidato.concurso_id === item.id
                );
                const convocadosConcurso = candidatosConcurso.filter((candidato) =>
                  ["CONVOCADO", "NOMEADO", "EMPOSSADO", "EM_EXERCICIO"].includes(
                    candidato.status
                  )
                ).length;

                return (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-cyan-300 print:text-black">
                          Edital {item.numero_edital}
                        </p>
                        <h2 className="mt-1 text-lg font-black">{item.titulo}</h2>
                        <p className="mt-1 text-sm text-slate-500 print:text-black">
                          {item.cargo} • {item.organizadora || "Organizadora não informada"}
                        </p>
                      </div>

                      <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[10px] font-black uppercase text-cyan-300 print:border-black print:bg-white print:text-black">
                        {formatarConcursos(item.status)}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                      <Numero titulo="Vagas" valor={item.vagas_imediatas} />
                      <Numero titulo="Cadastro reserva" valor={item.vagas_cadastro_reserva} />
                      <Numero titulo="Cotas" valor={item.vagas_cotas} />
                      <Numero titulo="Convocados" valor={convocadosConcurso} />
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <Info titulo="Publicação" valor={formatarDataConcurso(item.data_publicacao)} />
                      <Info titulo="Validade" valor={formatarDataConcurso(item.validade_ate)} />
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3 print:hidden">
                      <Link
                        href={`/sistema/concursos-provimento/${item.id}`}
                        className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950"
                      >
                        Abrir concurso
                      </Link>
                      <Link
                        href={`/sistema/concursos-provimento/${item.id}/candidatos`}
                        className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-black"
                      >
                        Candidatos
                      </Link>
                    </div>
                  </article>
                );
              })}

              {!filtrados.length ? (
                <div className="rounded-2xl border border-slate-800 bg-[#061326] p-16 text-center text-slate-500 xl:col-span-2">
                  Nenhum concurso cadastrado.
                </div>
              ) : null}
            </section>
          )}

          <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.05] p-5 print:hidden">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-1 h-5 w-5 text-cyan-300" />
              <div>
                <h2 className="font-black">Fluxo de provimento</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Edital, fases, classificação, convocação, análise documental, exames, investigação social, curso de formação, nomeação, posse e exercício.
                </p>
              </div>
            </div>
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
  valor: number;
  icone: typeof Users;
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

function Numero({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-center print:border-black print:bg-white">
      <p className="text-[10px] font-black uppercase text-slate-500 print:text-black">
        {titulo}
      </p>
      <p className="mt-1 text-lg font-black">{valor}</p>
    </div>
  );
}

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 print:border-black print:bg-white">
      <p className="text-[10px] font-black uppercase text-slate-500 print:text-black">
        {titulo}
      </p>
      <p className="mt-1 font-black">{valor}</p>
    </div>
  );
}
