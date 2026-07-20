"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Calculator,
  FilePlus2,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  formatarDimensionamento,
  formatarMoeda,
  lerUsuarioDimensionamento,
  podeGerenciarDimensionamento,
} from "@/lib/dimensionamentoEfetivo";
import { supabase } from "@/lib/supabase";

type Planejamento = {
  id: number;
  titulo: string;
  ano_referencia: number;
  setor: string | null;
  regiao: string | null;
  turno: string | null;
  cargo: string;
  efetivo_atual: number;
  efetivo_ideal: number;
  aposentadorias_previstas: number;
  afastamentos_estimados: number;
  crescimento_demanda_percentual: number;
  contratacoes_previstas: number;
  custo_unitario_mensal: number;
  custo_total_mensal: number;
  custo_total_anual: number;
  prioridade: string;
  status: string;
  justificativa: string | null;
  cronograma: string | null;
};

type Guarda = {
  id: number;
  ativo?: boolean;
  status?: string | null;
};

type Necessidade = {
  id: number;
  efetivo_necessario: number;
  efetivo_disponivel: number;
};

export default function DimensionamentoEfetivoPage() {
  const [usuario] = useState(() => lerUsuarioDimensionamento());
  const [planejamentos, setPlanejamentos] = useState<Planejamento[]>([]);
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [necessidades, setNecessidades] = useState<Necessidade[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario
    ? podeGerenciarDimensionamento(usuario.perfil)
    : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) {
      setErro("Sessão ou município não identificado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    const [planejamentoResp, guardasResp, necessidadesResp] = await Promise.all([
      supabase
        .from("planejamento_dimensionamento_efetivo")
        .select("*")
        .eq("municipio_id", usuario.municipio_id)
        .order("ano_referencia", { ascending: false })
        .order("prioridade"),
      supabase
        .from("guardas")
        .select("id,ativo,status")
        .eq("municipio_id", usuario.municipio_id),
      supabase
        .from("necessidades_operacionais_efetivo")
        .select("id,efetivo_necessario,efetivo_disponivel")
        .eq("municipio_id", usuario.municipio_id)
        .eq("ativo", true),
    ]);

    const primeiroErro =
      planejamentoResp.error || guardasResp.error || necessidadesResp.error;

    if (primeiroErro) setErro(primeiroErro.message);

    setPlanejamentos((planejamentoResp.data as Planejamento[] | null) || []);
    setGuardas((guardasResp.data as Guarda[] | null) || []);
    setNecessidades((necessidadesResp.data as Necessidade[] | null) || []);
    setCarregando(false);
  }, [usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return planejamentos.filter((item) =>
      `${item.titulo} ${item.cargo} ${item.setor || ""} ${item.regiao || ""} ${item.status}`
        .toLowerCase()
        .includes(termo)
    );
  }, [busca, planejamentos]);

  const efetivoAtual = guardas.filter(
    (item) =>
      item.ativo !== false &&
      !["INATIVO", "EXONERADO", "APOSENTADO"].includes(
        String(item.status || "").toUpperCase()
      )
  ).length;

  const efetivoIdealMapa = necessidades.reduce(
    (total, item) => total + Number(item.efetivo_necessario || 0),
    0
  );

  const deficitMapa = Math.max(0, efetivoIdealMapa - efetivoAtual);

  const contratacoesPlanejadas = planejamentos.reduce(
    (total, item) => total + Number(item.contratacoes_previstas || 0),
    0
  );

  const impactoAnual = planejamentos.reduce(
    (total, item) => total + Number(item.custo_total_anual || 0),
    0
  );

  const aposentadorias = planejamentos.reduce(
    (total, item) => total + Number(item.aposentadorias_previstas || 0),
    0
  );

  async function imprimir() {
    await registrarAuditoria({
      modulo: "RH",
      acao: "IMPRIMIR",
      tabela: "planejamento_dimensionamento_efetivo",
      descricao: "Impressão do planejamento de dimensionamento do efetivo.",
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
                  Planejamento institucional
                </p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">
                  Dimensionamento do Efetivo
                </h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  Projeções de necessidade, recomposição, concursos, convocações e impacto financeiro.
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
                  href="/sistema/mapa-estrategico-efetivo"
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 px-4 py-3 text-sm font-black text-cyan-300"
                >
                  <BarChart3 className="h-4 w-4" />
                  Mapa estratégico
                </Link>


                <Link
                  href="/sistema/concursos-provimento"
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-400/25 bg-violet-400/10 px-4 py-3 text-sm font-black text-violet-300"
                >
                  Concursos e provimento
                </Link>

                {podeGerenciar ? (
                  <Link
                    href="/sistema/dimensionamento-efetivo/novo"
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950"
                  >
                    <FilePlus2 className="h-4 w-4" />
                    Novo cenário
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
            <Metrica titulo="Efetivo atual" valor={efetivoAtual} icone={Users} />
            <Metrica titulo="Efetivo ideal" valor={efetivoIdealMapa} icone={ShieldCheck} />
            <Metrica titulo="Déficit projetado" valor={deficitMapa} icone={AlertTriangle} />
            <Metrica titulo="Contratações" valor={contratacoesPlanejadas} icone={TrendingUp} />
            <Metrica titulo="Aposentadorias" valor={aposentadorias} icone={Building2} />
            <Metrica titulo="Impacto anual" valor={formatarMoeda(impactoAnual)} icone={WalletCards} />
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-4 print:hidden">
            <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/60 px-4">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar cenário, cargo, setor, região ou status..."
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
                const deficit = Math.max(
                  0,
                  Number(item.efetivo_ideal || 0) -
                    Number(item.efetivo_atual || 0)
                );

                return (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-cyan-300 print:text-black">
                          {item.ano_referencia} • {item.cargo}
                        </p>
                        <h2 className="mt-1 text-lg font-black">{item.titulo}</h2>
                        <p className="mt-1 text-sm text-slate-500 print:text-black">
                          {item.regiao || "Todas as regiões"} •{" "}
                          {item.setor || "Todos os setores"} •{" "}
                          {item.turno ? formatarDimensionamento(item.turno) : "Todos os turnos"}
                        </p>
                      </div>

                      <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[10px] font-black uppercase text-cyan-300 print:border-black print:bg-white print:text-black">
                        {formatarDimensionamento(item.status)}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                      <Numero titulo="Atual" valor={item.efetivo_atual} />
                      <Numero titulo="Ideal" valor={item.efetivo_ideal} />
                      <Numero titulo="Déficit" valor={deficit} />
                      <Numero titulo="Contratações" valor={item.contratacoes_previstas} />
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <Info
                        titulo="Custo mensal"
                        valor={formatarMoeda(item.custo_total_mensal)}
                      />
                      <Info
                        titulo="Custo anual"
                        valor={formatarMoeda(item.custo_total_anual)}
                      />
                      <Info
                        titulo="Prioridade"
                        valor={formatarDimensionamento(item.prioridade)}
                      />
                    </div>

                    {item.justificativa ? (
                      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/30 p-4 print:border-black print:bg-white">
                        <p className="text-xs font-black uppercase text-slate-500 print:text-black">
                          Justificativa técnica
                        </p>
                        <p className="mt-2 text-sm text-slate-300 print:text-black">
                          {item.justificativa}
                        </p>
                      </div>
                    ) : null}

                    {item.cronograma ? (
                      <p className="mt-4 text-sm text-slate-400 print:text-black">
                        <strong>Cronograma:</strong> {item.cronograma}
                      </p>
                    ) : null}
                  </article>
                );
              })}

              {!filtrados.length ? (
                <div className="rounded-2xl border border-slate-800 bg-[#061326] p-16 text-center text-slate-500 xl:col-span-2">
                  Nenhum cenário de dimensionamento cadastrado.
                </div>
              ) : null}
            </section>
          )}

          <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.05] p-5 print:hidden">
            <div className="flex items-start gap-3">
              <Calculator className="mt-1 h-5 w-5 text-cyan-300" />
              <div>
                <h2 className="font-black">Base para decisão</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Use os cenários para justificar concursos, convocações, recomposição por aposentadoria e ampliação do efetivo com projeção financeira.
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
  valor: number | string;
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
