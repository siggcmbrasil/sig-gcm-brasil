"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  Building2,
  FilePlus2,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  TriangleAlert,
  Users,
  UserRoundCheck,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  formatarLotacao,
  lerUsuarioLotacao,
  podeGerenciarLotacao,
} from "@/lib/lotacaoEfetivo";
import { supabase } from "@/lib/supabase";

type Vaga = {
  id: number;
  unidade: string;
  setor: string | null;
  cargo: string;
  classe: string | null;
  vagas_previstas: number;
  vagas_ocupadas: number;
  ativo: boolean;
};

type Lotacao = {
  id: number;
  guarda_id: number;
  guarda_nome: string;
  matricula: string | null;
  unidade: string;
  setor: string | null;
  cargo: string | null;
  tipo_lotacao: string;
  data_inicio: string;
  data_fim: string | null;
  ativo: boolean;
};

type Movimentacao = {
  id: number;
  guarda_nome: string;
  tipo: string;
  unidade_origem: string | null;
  unidade_destino: string | null;
  status: string;
  solicitado_em: string;
};

export default function QuadroVagasPage() {
  const [usuario] = useState(() => lerUsuarioLotacao());
  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [lotacoes, setLotacoes] = useState<Lotacao[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario ? podeGerenciarLotacao(usuario.perfil) : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) {
      setErro("Sessão ou município não identificado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    const [vagasResp, lotacoesResp, movimentacoesResp] = await Promise.all([
      supabase
        .from("quadro_vagas")
        .select("*")
        .eq("municipio_id", usuario.municipio_id)
        .eq("ativo", true)
        .order("unidade"),
      supabase
        .from("lotacoes_efetivo")
        .select("*")
        .eq("municipio_id", usuario.municipio_id)
        .eq("ativo", true)
        .order("guarda_nome"),
      supabase
        .from("movimentacoes_efetivo")
        .select("*")
        .eq("municipio_id", usuario.municipio_id)
        .order("solicitado_em", { ascending: false })
        .limit(8),
    ]);

    const primeiroErro =
      vagasResp.error || lotacoesResp.error || movimentacoesResp.error;

    if (primeiroErro) setErro(primeiroErro.message);

    setVagas((vagasResp.data as Vaga[] | null) || []);
    setLotacoes((lotacoesResp.data as Lotacao[] | null) || []);
    setMovimentacoes((movimentacoesResp.data as Movimentacao[] | null) || []);
    setCarregando(false);
  }, [usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const vagasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return vagas.filter((item) =>
      `${item.unidade} ${item.setor || ""} ${item.cargo} ${item.classe || ""}`
        .toLowerCase()
        .includes(termo)
    );
  }, [busca, vagas]);

  const totalPrevisto = vagas.reduce(
    (total, item) => total + Number(item.vagas_previstas || 0),
    0
  );
  const totalOcupado = vagas.reduce(
    (total, item) => total + Number(item.vagas_ocupadas || 0),
    0
  );
  const deficit = Math.max(0, totalPrevisto - totalOcupado);
  const excedente = Math.max(0, totalOcupado - totalPrevisto);

  async function imprimir() {
    await registrarAuditoria({
      modulo: "RH",
      acao: "IMPRIMIR",
      tabela: "quadro_vagas",
      descricao: "Impressão do quadro de vagas e lotação do efetivo.",
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
                  Gestão do efetivo
                </p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">
                  Quadro de Vagas, Lotação e Movimentação
                </h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  Controle de vagas previstas, ocupadas, déficit, excedente e distribuição do efetivo.
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
                  href="/sistema/quadro-vagas/movimentacoes"
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 px-4 py-3 text-sm font-black text-cyan-300"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Movimentações
                </Link>


                <Link
                  href="/sistema/mapa-estrategico-efetivo"
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-400/25 bg-violet-400/10 px-4 py-3 text-sm font-black text-violet-300"
                >
                  Mapa estratégico
                </Link>


                <Link
                  href="/sistema/dimensionamento-efetivo"
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm font-black text-amber-300"
                >
                  Dimensionamento
                </Link>


                <Link
                  href="/sistema/concursos-provimento"
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-300"
                >
                  Concursos e provimento
                </Link>

                {podeGerenciar ? (
                  <Link
                    href="/sistema/quadro-vagas/novo"
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950"
                  >
                    <FilePlus2 className="h-4 w-4" />
                    Nova vaga
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

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Metrica titulo="Quadro previsto" valor={totalPrevisto} icone={Users} />
            <Metrica titulo="Quadro ocupado" valor={totalOcupado} icone={UserRoundCheck} />
            <Metrica titulo="Déficit" valor={deficit} icone={TriangleAlert} />
            <Metrica titulo="Excedente" valor={excedente} icone={Users} />
            <Metrica titulo="Lotações ativas" valor={lotacoes.length} icone={Building2} />
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-4 print:hidden">
            <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/60 px-4">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar unidade, setor, cargo ou classe..."
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
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="border-b border-slate-700 text-[10px] uppercase text-slate-400 print:text-black">
                  <tr>
                    <th className="px-4 py-3">Unidade</th>
                    <th className="px-4 py-3">Setor</th>
                    <th className="px-4 py-3">Cargo/Classe</th>
                    <th className="px-4 py-3">Previstas</th>
                    <th className="px-4 py-3">Ocupadas</th>
                    <th className="px-4 py-3">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {vagasFiltradas.map((item) => {
                    const saldo =
                      Number(item.vagas_previstas) - Number(item.vagas_ocupadas);

                    return (
                      <tr key={item.id} className="border-b border-slate-800/70">
                        <td className="px-4 py-4 font-black">{item.unidade}</td>
                        <td className="px-4 py-4">{item.setor || "Geral"}</td>
                        <td className="px-4 py-4">
                          {item.cargo}
                          {item.classe ? ` — ${item.classe}` : ""}
                        </td>
                        <td className="px-4 py-4">{item.vagas_previstas}</td>
                        <td className="px-4 py-4">{item.vagas_ocupadas}</td>
                        <td
                          className={`px-4 py-4 font-black ${
                            saldo < 0
                              ? "text-rose-300"
                              : saldo > 0
                                ? "text-amber-300"
                                : "text-emerald-300"
                          }`}
                        >
                          {saldo}
                        </td>
                      </tr>
                    );
                  })}

                  {!vagasFiltradas.length ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center text-slate-500">
                        Nenhuma vaga cadastrada.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            )}
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
              <h2 className="font-black">Distribuição atual do efetivo</h2>
              <div className="mt-4 space-y-3">
                {lotacoes.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 print:border-black print:bg-white"
                  >
                    <p className="font-black">{item.guarda_nome}</p>
                    <p className="mt-1 text-xs text-slate-500 print:text-black">
                      {item.unidade} • {item.setor || "Geral"} •{" "}
                      {formatarLotacao(item.tipo_lotacao)}
                    </p>
                  </div>
                ))}
                {!lotacoes.length ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    Nenhuma lotação ativa.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white">
              <h2 className="font-black">Movimentações recentes</h2>
              <div className="mt-4 space-y-3">
                {movimentacoes.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 print:border-black print:bg-white"
                  >
                    <p className="font-black">{item.guarda_nome}</p>
                    <p className="mt-1 text-xs text-slate-500 print:text-black">
                      {formatarLotacao(item.tipo)} •{" "}
                      {item.unidade_origem || "Sem origem"} →{" "}
                      {item.unidade_destino || "Sem destino"} •{" "}
                      {formatarLotacao(item.status)}
                    </p>
                  </div>
                ))}
                {!movimentacoes.length ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    Nenhuma movimentação registrada.
                  </p>
                ) : null}
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
