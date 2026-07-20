"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  FilePlus2,
  Loader2,
  MapPinned,
  Printer,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  calcularCobertura,
  classificarSituacao,
  formatarMapa,
  lerUsuarioMapaEstrategico,
  podeGerenciarMapaEstrategico,
} from "@/lib/mapaEstrategicoEfetivo";
import { supabase } from "@/lib/supabase";

type Necessidade = {
  id: number;
  regiao: string;
  unidade: string;
  setor: string | null;
  turno: string;
  nivel_risco: string;
  efetivo_necessario: number;
  efetivo_disponivel: number;
  afastados: number;
  observacoes: string | null;
  ativo: boolean;
};

type Lotacao = {
  id: number;
  guarda_id: number;
  guarda_nome: string;
  unidade: string;
  setor: string | null;
  ativo: boolean;
};

type Afastamento = {
  id: number;
  guarda_id: number;
  data_inicio: string;
  data_fim: string;
  status: string;
};

export default function MapaEstrategicoEfetivoPage() {
  const [usuario] = useState(() => lerUsuarioMapaEstrategico());
  const [necessidades, setNecessidades] = useState<Necessidade[]>([]);
  const [lotacoes, setLotacoes] = useState<Lotacao[]>([]);
  const [afastamentos, setAfastamentos] = useState<Afastamento[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const podeGerenciar = usuario
    ? podeGerenciarMapaEstrategico(usuario.perfil)
    : false;

  const carregar = useCallback(async () => {
    if (!usuario?.municipio_id) {
      setErro("Sessão ou município não identificado.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    const hoje = new Date().toISOString().slice(0, 10);

    const [necessidadesResp, lotacoesResp, afastamentosResp] = await Promise.all([
      supabase
        .from("necessidades_operacionais_efetivo")
        .select("*")
        .eq("municipio_id", usuario.municipio_id)
        .eq("ativo", true)
        .order("nivel_risco", { ascending: false })
        .order("regiao"),
      supabase
        .from("lotacoes_efetivo")
        .select("id,guarda_id,guarda_nome,unidade,setor,ativo")
        .eq("municipio_id", usuario.municipio_id)
        .eq("ativo", true),
      supabase
        .from("rh_afastamentos")
        .select("id,guarda_id,data_inicio,data_fim,status")
        .eq("municipio_id", usuario.municipio_id)
        .lte("data_inicio", hoje)
        .gte("data_fim", hoje)
        .not("status", "in", '("NEGADO","CANCELADO","FINALIZADO")'),
    ]);

    const primeiroErro =
      necessidadesResp.error || lotacoesResp.error || afastamentosResp.error;

    if (primeiroErro) setErro(primeiroErro.message);

    setNecessidades((necessidadesResp.data as Necessidade[] | null) || []);
    setLotacoes((lotacoesResp.data as Lotacao[] | null) || []);
    setAfastamentos((afastamentosResp.data as Afastamento[] | null) || []);
    setCarregando(false);
  }, [usuario]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const dadosCalculados = useMemo(() => {
    const afastadosIds = new Set(afastamentos.map((item) => Number(item.guarda_id)));

    return necessidades.map((item) => {
      const lotados = lotacoes.filter(
        (lotacao) =>
          lotacao.unidade.toLowerCase() === item.unidade.toLowerCase() &&
          String(lotacao.setor || "").toLowerCase() ===
            String(item.setor || "").toLowerCase()
      );

      const afastadosNaArea = lotados.filter((lotacao) =>
        afastadosIds.has(Number(lotacao.guarda_id))
      ).length;

      const disponivelCalculado = Math.max(0, lotados.length - afastadosNaArea);
      const disponivel =
        lotados.length > 0 ? disponivelCalculado : Number(item.efetivo_disponivel || 0);
      const cobertura = calcularCobertura(
        disponivel,
        Number(item.efetivo_necessario || 0)
      );
      const deficit = Math.max(
        0,
        Number(item.efetivo_necessario || 0) - disponivel
      );

      return {
        ...item,
        efetivo_disponivel_calculado: disponivel,
        afastados_calculado: afastadosNaArea,
        cobertura,
        deficit,
        situacao: classificarSituacao(cobertura),
      };
    });
  }, [afastamentos, lotacoes, necessidades]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return dadosCalculados.filter((item) =>
      `${item.regiao} ${item.unidade} ${item.setor || ""} ${item.turno} ${item.nivel_risco}`
        .toLowerCase()
        .includes(termo)
    );
  }, [busca, dadosCalculados]);

  const totalNecessario = dadosCalculados.reduce(
    (total, item) => total + Number(item.efetivo_necessario || 0),
    0
  );
  const totalDisponivel = dadosCalculados.reduce(
    (total, item) => total + Number(item.efetivo_disponivel_calculado || 0),
    0
  );
  const totalDeficit = dadosCalculados.reduce(
    (total, item) => total + Number(item.deficit || 0),
    0
  );
  const setoresCriticos = dadosCalculados.filter(
    (item) => item.situacao === "CRITICA" || item.nivel_risco === "CRITICO"
  ).length;

  async function imprimir() {
    await registrarAuditoria({
      modulo: "CENTRAL_COMANDO",
      acao: "IMPRIMIR",
      tabela: "necessidades_operacionais_efetivo",
      descricao: "Impressão do mapa estratégico do efetivo.",
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
                  Inteligência de pessoal
                </p>
                <h1 className="mt-1 text-2xl font-black lg:text-3xl">
                  Mapa Estratégico do Efetivo
                </h1>
                <p className="mt-2 text-sm text-slate-400 print:text-black">
                  Cobertura por região, unidade, setor, turno e prioridade operacional.
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
                  href="/sistema/quadro-vagas"
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 px-4 py-3 text-sm font-black text-cyan-300"
                >
                  <Users className="h-4 w-4" />
                  Quadro de vagas
                </Link>


                <Link
                  href="/sistema/dimensionamento-efetivo"
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-400/25 bg-violet-400/10 px-4 py-3 text-sm font-black text-violet-300"
                >
                  Dimensionamento
                </Link>

                {podeGerenciar ? (
                  <Link
                    href="/sistema/mapa-estrategico-efetivo/nova-area"
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950"
                  >
                    <FilePlus2 className="h-4 w-4" />
                    Nova área
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
            <Metrica titulo="Efetivo necessário" valor={totalNecessario} icone={Users} />
            <Metrica titulo="Efetivo disponível" valor={totalDisponivel} icone={ShieldCheck} />
            <Metrica titulo="Déficit total" valor={totalDeficit} icone={AlertTriangle} />
            <Metrica titulo="Setores críticos" valor={setoresCriticos} icone={MapPinned} />
            <Metrica titulo="Afastados hoje" valor={afastamentos.length} icone={Building2} />
          </section>

          <section className="rounded-2xl border border-slate-800 bg-[#061326] p-4 print:hidden">
            <label className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/60 px-4">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar região, unidade, setor, turno ou risco..."
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
              {filtrados.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-800 bg-[#061326] p-5 print:border-black print:bg-white"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-cyan-300 print:text-black">
                        {item.regiao}
                      </p>
                      <h2 className="mt-1 text-lg font-black">{item.unidade}</h2>
                      <p className="mt-1 text-sm text-slate-500 print:text-black">
                        {item.setor || "Setor geral"} • {formatarMapa(item.turno)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Selo texto={formatarMapa(item.nivel_risco)} />
                      <Selo texto={formatarMapa(item.situacao)} />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <Numero titulo="Necessário" valor={item.efetivo_necessario} />
                    <Numero titulo="Disponível" valor={item.efetivo_disponivel_calculado} />
                    <Numero titulo="Afastados" valor={item.afastados_calculado} />
                    <Numero titulo="Déficit" valor={item.deficit} />
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs font-black">
                      <span>Cobertura operacional</span>
                      <span>{item.cobertura}%</span>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-900 print:border print:border-black">
                      <div
                        className="h-full rounded-full bg-cyan-300 print:bg-black"
                        style={{ width: `${Math.min(100, item.cobertura)}%` }}
                      />
                    </div>
                  </div>

                  {item.deficit > 0 ? (
                    <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/[0.07] p-4 text-sm print:border-black print:bg-white">
                      <p className="font-black text-amber-300 print:text-black">
                        Recomendação de remanejamento
                      </p>
                      <p className="mt-1 text-slate-300 print:text-black">
                        Direcionar pelo menos {item.deficit} servidor(es) com perfil compatível para esta área.
                      </p>
                    </div>
                  ) : null}

                  {item.observacoes ? (
                    <p className="mt-4 text-sm text-slate-400 print:text-black">
                      {item.observacoes}
                    </p>
                  ) : null}
                </article>
              ))}

              {!filtrados.length ? (
                <div className="rounded-2xl border border-slate-800 bg-[#061326] p-16 text-center text-slate-500 xl:col-span-2">
                  Nenhuma área estratégica cadastrada.
                </div>
              ) : null}
            </section>
          )}

          <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.05] p-5 print:hidden">
            <div className="flex items-start gap-3">
              <Route className="mt-1 h-5 w-5 text-cyan-300" />
              <div>
                <h2 className="font-black">Leitura estratégica</h2>
                <p className="mt-1 text-sm text-slate-400">
                  O painel cruza necessidades cadastradas com lotações ativas e afastamentos vigentes. Áreas com cobertura inferior a 50% são classificadas como críticas.
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

function Selo({ texto }: { texto: string }) {
  return (
    <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[10px] font-black uppercase text-cyan-300 print:border-black print:bg-white print:text-black">
      {texto}
    </span>
  );
}
