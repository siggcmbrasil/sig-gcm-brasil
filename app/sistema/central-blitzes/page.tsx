"use client";

import Link from "next/link";
import {
  Activity,
  CarFront,
  FileText,
  PlusCircle,
  RefreshCw,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigActionCard from "@/components/sig/SigActionCard";
import SigButton from "@/components/sig/SigButton";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigStatCard from "@/components/sig/SigStatCard";

import {
  lerMunicipioContextoLocal,
  obterMunicipioIdEfetivo,
} from "@/lib/contextoMunicipio";
import { supabase } from "@/lib/supabase";

type UsuarioLocal = {
  perfil?: string;
  municipio_id?: number;
};

type Operacao = {
  id: number;
  tipo: string | null;
  local: string | null;
  data: string | null;
  status: string | null;
  observacao: string | null;
};

const cards = [
  {
    titulo: "Nova Blitz",
    href: "/sistema/blitzes-barreiras/nova",
    descricao:
      "Cadastrar uma nova blitz ou barreira operacional.",
    icone: PlusCircle,
    detalhe: "Registrar operação",
  },
  {
    titulo: "Blitze e Barreiras",
    href: "/sistema/blitzes-barreiras",
    descricao:
      "Consultar e gerenciar as operações cadastradas.",
    icone: Shield,
    detalhe: "Abrir operações",
  },
  {
    titulo: "Relatório de Operações",
    href: "/sistema/blitzes-barreiras/relatorio",
    descricao:
      "Relatórios e indicadores das fiscalizações realizadas.",
    icone: FileText,
    detalhe: "Gerar relatório",
  },
];

function obterUsuarioLocal(): UsuarioLocal | null {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(
      localStorage.getItem("usuarioLogado") || "null"
    ) as UsuarioLocal | null;
  } catch {
    return null;
  }
}

function normalizar(valor: unknown) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function formatarData(valor: string | null) {
  if (!valor) return "Data não informada";

  const [ano, mes, dia] = valor.split("-");

  return ano && mes && dia
    ? `${dia}/${mes}/${ano}`
    : valor;
}

export default function CentralBlitzesPage() {
  const [operacoes, setOperacoes] = useState<Operacao[]>([]);
  const [municipioNome, setMunicipioNome] =
    useState("Município");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");

    try {
      const usuario = obterUsuarioLocal();

      if (!usuario?.perfil) {
        throw new Error("Usuário não identificado.");
      }

      const contexto = lerMunicipioContextoLocal();

      const municipioId = obterMunicipioIdEfetivo({
        perfil: usuario.perfil,
        municipioIdUsuario: usuario.municipio_id,
      });

      if (!municipioId) {
        throw new Error("Município não identificado.");
      }

      const municipioResposta = await supabase
        .from("municipios")
        .select("nome")
        .eq("id", municipioId)
        .maybeSingle();

      if (municipioResposta.error) {
        console.warn(
          "Falha parcial em municipios:",
          municipioResposta.error.message
        );
      }

      const tentativas = [
        "blitzes_barreiras",
        "blitzes",
        "barreiras",
      ];

      let registros: Operacao[] = [];

      for (const tabela of tentativas) {
        const resposta = await supabase
          .from(tabela)
          .select("id,tipo,local,data,status,observacao")
          .eq("municipio_id", municipioId)
          .order("id", { ascending: false })
          .limit(100);

        if (!resposta.error) {
          registros = (resposta.data as Operacao[] | null) || [];
          break;
        }

        console.warn(
          `Falha parcial em ${tabela}:`,
          resposta.error.message
        );
      }

      setMunicipioNome(
        String(
          municipioResposta.data?.nome ||
            contexto?.nome ||
            "Município"
        )
      );

      setOperacoes(registros);
    } catch (error) {
      console.error(
        "Erro ao carregar Central de Blitze e Barreiras:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a Central de Blitze e Barreiras."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const metricas = useMemo(() => {
    const ativas = operacoes.filter((item) =>
      [
        "ATIVA",
        "ATIVO",
        "EM_ANDAMENTO",
        "EM_EXECUCAO",
      ].includes(normalizar(item.status))
    ).length;

    const finalizadas = operacoes.filter((item) =>
      [
        "FINALIZADA",
        "FINALIZADO",
        "CONCLUIDA",
        "CONCLUIDO",
        "ENCERRADA",
        "ENCERRADO",
      ].includes(normalizar(item.status))
    ).length;

    const blitzes = operacoes.filter((item) =>
      normalizar(item.tipo).includes("BLITZ")
    ).length;

    const barreiras = operacoes.filter((item) =>
      normalizar(item.tipo).includes("BARREIRA")
    ).length;

    const locais = new Set(
      operacoes
        .map((item) => item.local?.trim())
        .filter((item): item is string => Boolean(item))
    );

    return {
      total: operacoes.length,
      ativas,
      finalizadas,
      blitzes,
      barreiras,
      locais: locais.size,
    };
  }, [operacoes]);

  return (
    <ProtecaoModulo modulo="operacoes">
      <main className="sig-page">
        <div className="sig-page-content">
          <SigPageHeader
            titulo="Central de Blitze e Barreiras"
            subtitulo={`${municipioNome} • Fiscalizações, barreiras e operações preventivas.`}
            detalhe="Operações integradas"
            icone={Shield}
            acoes={
              <>
                <Link href="/sistema/blitzes-barreiras/nova">
                  <SigButton
                    type="primary"
                    icon={PlusCircle}
                    size="sm"
                  >
                    Nova operação
                  </SigButton>
                </Link>

                <SigButton
                  type="cyan"
                  icon={RefreshCw}
                  size="sm"
                  loading={carregando}
                  onClick={() => void carregar()}
                >
                  Atualizar
                </SigButton>
              </>
            }
          />

          {erro ? <div className="sig-error">{erro}</div> : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <SigStatCard
              titulo="Total de operações"
              valor={metricas.total}
              subtitulo="Registros carregados"
              icone={Shield}
              destaque="cyan"
            />

            <SigStatCard
              titulo="Em andamento"
              valor={metricas.ativas}
              subtitulo="Operações ativas"
              icone={Activity}
              destaque="amber"
            />

            <SigStatCard
              titulo="Finalizadas"
              valor={metricas.finalizadas}
              subtitulo="Operações concluídas"
              icone={ShieldCheck}
              destaque="green"
            />

            <SigStatCard
              titulo="Blitzes"
              valor={metricas.blitzes}
              subtitulo="Fiscalizações registradas"
              icone={CarFront}
              destaque="red"
            />

            <SigStatCard
              titulo="Barreiras"
              valor={metricas.barreiras}
              subtitulo="Pontos de bloqueio"
              icone={Users}
              destaque="blue"
            />

            <SigStatCard
              titulo="Locais"
              valor={metricas.locais}
              subtitulo="Áreas monitoradas"
              icone={FileText}
              destaque="slate"
            />
          </section>

          {carregando ? (
            <div className="sig-loading">
              <div>
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
                <p className="mt-4 text-slate-400">
                  Carregando operações...
                </p>
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-12">
                <SigCard className="xl:col-span-7">
                  <CabecalhoSecao
                    titulo="Operações recentes"
                    subtitulo="Últimas blitzes e barreiras registradas"
                    icone={Activity}
                  />

                  <div className="mt-5 space-y-3">
                    {operacoes.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-500">
                        Nenhuma operação encontrada.
                      </div>
                    ) : (
                      operacoes.slice(0, 8).map((operacao) => (
                        <Link
                          key={operacao.id}
                          href="/sistema/blitzes-barreiras"
                          className="block rounded-2xl border border-slate-800 bg-slate-950/45 p-4 transition hover:border-cyan-400/25"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                              <p className="truncate font-black text-white">
                                {operacao.tipo || "Operação"}
                              </p>

                              <p className="mt-1 truncate text-sm text-slate-400">
                                {operacao.local ||
                                  "Local não informado"}
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-3">
                              <span className="text-xs text-slate-500">
                                {formatarData(operacao.data)}
                              </span>

                              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-2.5 py-1 text-[10px] font-black uppercase text-cyan-300">
                                {operacao.status || "SEM STATUS"}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </SigCard>

                <SigCard className="xl:col-span-5" destaque>
                  <CabecalhoSecao
                    titulo="Integração operacional"
                    subtitulo="Operações conectadas ao restante do SIG"
                    icone={ShieldCheck}
                  />

                  <div className="mt-5 space-y-3">
                    <Regra texto="Blitzes e barreiras podem ser vinculadas a equipes, viaturas e locais." />
                    <Regra texto="Pessoas e veículos abordados alimentam o histórico operacional." />
                    <Regra texto="Resultados das operações integram relatórios e estatísticas." />
                    <Regra texto="Toda ação deve respeitar município, permissão e auditoria." />
                  </div>
                </SigCard>
              </section>

              <section>
                <div className="mb-4">
                  <h2 className="text-2xl font-black text-white">
                    Ferramentas de Operação
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Registre, acompanhe e analise blitzes e barreiras.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {cards.map((card) => (
                    <SigActionCard
                      key={card.href}
                      titulo={card.titulo}
                      descricao={card.descricao}
                      href={card.href}
                      icone={card.icone}
                      detalhe={card.detalhe}
                    />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function CabecalhoSecao({
  titulo,
  subtitulo,
  icone: Icone,
}: {
  titulo: string;
  subtitulo: string;
  icone: typeof Shield;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300">
        <Icone className="h-5 w-5" />
      </div>

      <div>
        <h2 className="font-black text-white">{titulo}</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {subtitulo}
        </p>
      </div>
    </div>
  );
}

function Regra({ texto }: { texto: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
      <span className="text-sm text-slate-300">{texto}</span>
    </div>
  );
}
