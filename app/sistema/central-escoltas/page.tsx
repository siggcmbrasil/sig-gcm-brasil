"use client";

import Link from "next/link";
import {
  Activity,
  CarFront,
  CheckCircle2,
  FileText,
  PlusCircle,
  RefreshCw,
  Route,
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

type Escolta = {
  id: number;
  tipo: string | null;
  origem: string | null;
  destino: string | null;
  data: string | null;
  status: string | null;
  viatura: string | null;
  responsavel: string | null;
};

const cards = [
  {
    titulo: "Nova Escolta",
    href: "/sistema/escoltas/nova",
    descricao:
      "Cadastrar uma nova escolta ou deslocamento oficial.",
    icone: PlusCircle,
    detalhe: "Registrar escolta",
  },
  {
    titulo: "Escoltas",
    href: "/sistema/escoltas",
    descricao:
      "Consultar, acompanhar e gerenciar escoltas registradas.",
    icone: CarFront,
    detalhe: "Abrir escoltas",
  },
  {
    titulo: "Relatório de Escoltas",
    href: "/sistema/escoltas/relatorio",
    descricao:
      "Emitir relatórios de escoltas e deslocamentos realizados.",
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

export default function CentralEscoltasPage() {
  const [escoltas, setEscoltas] = useState<Escolta[]>([]);
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

      const [municipioResposta, escoltasResposta] =
        await Promise.all([
          supabase
            .from("municipios")
            .select("nome")
            .eq("id", municipioId)
            .maybeSingle(),

          supabase
            .from("escoltas")
            .select(
              "id,tipo,origem,destino,data,status,viatura,responsavel"
            )
            .eq("municipio_id", municipioId)
            .order("id", { ascending: false })
            .limit(100),
        ]);

      if (municipioResposta.error) {
        console.warn(
          "Falha parcial em municipios:",
          municipioResposta.error.message
        );
      }

      if (escoltasResposta.error) {
        throw escoltasResposta.error;
      }

      setMunicipioNome(
        String(
          municipioResposta.data?.nome ||
            contexto?.nome ||
            "Município"
        )
      );

      setEscoltas(
        (escoltasResposta.data as Escolta[] | null) || []
      );
    } catch (error) {
      console.error(
        "Erro ao carregar Central de Escoltas:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a Central de Escoltas."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const metricas = useMemo(() => {
    const emAndamento = escoltas.filter((item) =>
      [
        "EM_ANDAMENTO",
        "EM_DESLOCAMENTO",
        "ATIVA",
        "ATIVO",
      ].includes(normalizar(item.status))
    ).length;

    const finalizadas = escoltas.filter((item) =>
      [
        "FINALIZADA",
        "FINALIZADO",
        "CONCLUIDA",
        "CONCLUIDO",
        "ENCERRADA",
        "ENCERRADO",
      ].includes(normalizar(item.status))
    ).length;

    const viaturas = new Set(
      escoltas
        .map((item) => item.viatura?.trim())
        .filter((item): item is string => Boolean(item))
    );

    const responsaveis = new Set(
      escoltas
        .map((item) => item.responsavel?.trim())
        .filter((item): item is string => Boolean(item))
    );

    const tipos = new Set(
      escoltas
        .map((item) => item.tipo?.trim())
        .filter((item): item is string => Boolean(item))
    );

    return {
      total: escoltas.length,
      emAndamento,
      finalizadas,
      viaturas: viaturas.size,
      responsaveis: responsaveis.size,
      tipos: tipos.size,
    };
  }, [escoltas]);

  return (
    <ProtecaoModulo modulo="operacoes">
      <main className="sig-page">
        <div className="sig-page-content">
          <SigPageHeader
            titulo="Central de Escoltas"
            subtitulo={`${municipioNome} • Escoltas, deslocamentos oficiais, equipes e viaturas.`}
            detalhe="Operação integrada"
            icone={CarFront}
            acoes={
              <>
                <Link href="/sistema/escoltas/nova">
                  <SigButton
                    type="primary"
                    icon={PlusCircle}
                    size="sm"
                  >
                    Nova escolta
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
              titulo="Total de escoltas"
              valor={metricas.total}
              subtitulo="Registros carregados"
              icone={CarFront}
              destaque="cyan"
            />

            <SigStatCard
              titulo="Em andamento"
              valor={metricas.emAndamento}
              subtitulo="Deslocamentos ativos"
              icone={Activity}
              destaque="amber"
            />

            <SigStatCard
              titulo="Finalizadas"
              valor={metricas.finalizadas}
              subtitulo="Escoltas concluídas"
              icone={CheckCircle2}
              destaque="green"
            />

            <SigStatCard
              titulo="Viaturas empregadas"
              valor={metricas.viaturas}
              subtitulo="Viaturas identificadas"
              icone={CarFront}
              destaque="blue"
            />

            <SigStatCard
              titulo="Responsáveis"
              valor={metricas.responsaveis}
              subtitulo="Agentes identificados"
              icone={Users}
              destaque="red"
            />

            <SigStatCard
              titulo="Tipos de escolta"
              valor={metricas.tipos}
              subtitulo="Modalidades registradas"
              icone={Route}
              destaque="slate"
            />
          </section>

          {carregando ? (
            <div className="sig-loading">
              <div>
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
                <p className="mt-4 text-slate-400">
                  Carregando escoltas...
                </p>
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-12">
                <SigCard className="xl:col-span-7">
                  <CabecalhoSecao
                    titulo="Escoltas recentes"
                    subtitulo="Últimos deslocamentos registrados"
                    icone={Activity}
                  />

                  <div className="mt-5 space-y-3">
                    {escoltas.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-500">
                        Nenhuma escolta registrada.
                      </div>
                    ) : (
                      escoltas.slice(0, 8).map((escolta) => (
                        <Link
                          key={escolta.id}
                          href="/sistema/escoltas"
                          className="block rounded-2xl border border-slate-800 bg-slate-950/45 p-4 transition hover:border-cyan-400/25"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                              <p className="truncate font-black text-white">
                                {escolta.tipo || "Escolta"}
                              </p>

                              <p className="mt-1 truncate text-sm text-slate-400">
                                {escolta.origem ||
                                  "Origem não informada"}
                                {" → "}
                                {escolta.destino ||
                                  "Destino não informado"}
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-3">
                              <span className="text-xs text-slate-500">
                                {formatarData(escolta.data)}
                              </span>

                              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-2.5 py-1 text-[10px] font-black uppercase text-cyan-300">
                                {escolta.status || "SEM STATUS"}
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
                    subtitulo="Escoltas conectadas ao restante do SIG"
                    icone={ShieldCheck}
                  />

                  <div className="mt-5 space-y-3">
                    <Regra texto="Escoltas podem ser vinculadas a equipes, viaturas e responsáveis." />
                    <Regra texto="Origem, destino e trajeto devem permanecer registrados." />
                    <Regra texto="Os dados alimentam relatórios e estatísticas operacionais." />
                    <Regra texto="Ações sensíveis devem respeitar município, permissão e auditoria." />
                  </div>
                </SigCard>
              </section>

              <section>
                <div className="mb-4">
                  <h2 className="text-2xl font-black text-white">
                    Ferramentas de Escolta
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Registre, acompanhe e emita relatórios das escoltas.
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
  icone: typeof CarFront;
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
