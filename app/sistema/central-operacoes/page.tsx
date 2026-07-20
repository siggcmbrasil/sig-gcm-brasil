"use client";

import Link from "next/link";
import {
  Activity,
  CarFront,
  ClipboardList,
  FileText,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  Target,
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

type OperacaoEspecial = {
  id: number;
  nome: string | null;
  tipo: string | null;
  local: string | null;
  data: string | null;
  status: string | null;
  objetivo: string | null;
  equipe: string | null;
  viatura: string | null;
};

const cards = [
  {
    titulo: "Operações Especiais",
    href: "/sistema/operacoes-especiais",
    descricao:
      "Consultar e acompanhar operações planejadas, missões e ações especiais.",
    icone: ShieldCheck,
    detalhe: "Abrir operações",
  },
  {
    titulo: "Nova Operação",
    href: "/sistema/operacoes",
    descricao:
      "Cadastrar uma nova operação especial com objetivo, efetivo e viaturas.",
    icone: PlusCircle,
    detalhe: "Registrar operação",
  },
  {
    titulo: "Planejamento",
    href: "/sistema/ordens-servico",
    descricao:
      "Ordens de serviço, planejamento operacional e distribuição de missão.",
    icone: ClipboardList,
    detalhe: "Abrir planejamento",
  },
  {
    titulo: "Efetivo",
    href: "/sistema/guarnicoes",
    descricao:
      "Consultar guarnições e equipes disponíveis para as operações.",
    icone: Users,
    detalhe: "Abrir guarnições",
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

export default function CentralOperacoesPage() {
  const [operacoes, setOperacoes] = useState<OperacaoEspecial[]>([]);
  const [municipioNome, setMunicipioNome] = useState("Município");
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

      const [municipioResposta, operacoesResposta] =
        await Promise.all([
          supabase
            .from("municipios")
            .select("nome")
            .eq("id", municipioId)
            .maybeSingle(),

          supabase
            .from("operacoes_especiais")
            .select(
              "id,nome,tipo,local,data,status,objetivo,equipe,viatura"
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

      if (operacoesResposta.error) {
        throw operacoesResposta.error;
      }

      setMunicipioNome(
        String(
          municipioResposta.data?.nome ||
            contexto?.nome ||
            "Município"
        )
      );

      setOperacoes(
        (operacoesResposta.data as OperacaoEspecial[] | null) || []
      );
    } catch (error) {
      console.error(
        "Erro ao carregar Central de Operações:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a Central de Operações."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const metricas = useMemo(() => {
    const planejadas = operacoes.filter((item) =>
      ["PLANEJADA", "AGENDADA", "PENDENTE"].includes(
        normalizar(item.status)
      )
    ).length;

    const emAndamento = operacoes.filter((item) =>
      [
        "EM_ANDAMENTO",
        "EM_EXECUCAO",
        "ATIVA",
        "ATIVO",
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

    const equipes = new Set(
      operacoes
        .map((item) => item.equipe?.trim())
        .filter((item): item is string => Boolean(item))
    );

    const viaturas = new Set(
      operacoes
        .map((item) => item.viatura?.trim())
        .filter((item): item is string => Boolean(item))
    );

    return {
      total: operacoes.length,
      planejadas,
      emAndamento,
      finalizadas,
      equipes: equipes.size,
      viaturas: viaturas.size,
    };
  }, [operacoes]);

  return (
    <ProtecaoModulo modulo="operacoes">
      <main className="sig-page">
        <div className="sig-page-content">
          <SigPageHeader
            titulo="Central de Operações"
            subtitulo={`${municipioNome} • Planejamento, execução e controle de operações especiais.`}
            detalhe="Coordenação operacional"
            icone={ShieldCheck}
            acoes={
              <>
                <Link href="/sistema/operacoes">
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
              icone={ShieldCheck}
              destaque="cyan"
            />

            <SigStatCard
              titulo="Planejadas"
              valor={metricas.planejadas}
              subtitulo="Aguardando execução"
              icone={ClipboardList}
              destaque="amber"
            />

            <SigStatCard
              titulo="Em andamento"
              valor={metricas.emAndamento}
              subtitulo="Operações ativas"
              icone={Activity}
              destaque="red"
            />

            <SigStatCard
              titulo="Finalizadas"
              valor={metricas.finalizadas}
              subtitulo="Operações concluídas"
              icone={Target}
              destaque="green"
            />

            <SigStatCard
              titulo="Equipes empregadas"
              valor={metricas.equipes}
              subtitulo="Equipes identificadas"
              icone={Users}
              destaque="blue"
            />

            <SigStatCard
              titulo="Viaturas empregadas"
              valor={metricas.viaturas}
              subtitulo="Viaturas identificadas"
              icone={CarFront}
              destaque="slate"
            />
          </section>

          {carregando ? (
            <div className="sig-loading">
              <div>
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
                <p className="mt-4 text-slate-400">
                  Carregando operações especiais...
                </p>
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-12">
                <SigCard className="xl:col-span-7">
                  <CabecalhoSecao
                    titulo="Operações recentes"
                    subtitulo="Últimas ações planejadas e executadas"
                    icone={Activity}
                  />

                  <div className="mt-5 space-y-3">
                    {operacoes.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-500">
                        Nenhuma operação especial registrada.
                      </div>
                    ) : (
                      operacoes.slice(0, 8).map((operacao) => (
                        <Link
                          key={operacao.id}
                          href="/sistema/operacoes-especiais"
                          className="block rounded-2xl border border-slate-800 bg-slate-950/45 p-4 transition hover:border-cyan-400/25"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                              <p className="truncate font-black text-white">
                                {operacao.nome ||
                                  operacao.tipo ||
                                  `Operação ${operacao.id}`}
                              </p>

                              <p className="mt-1 truncate text-sm text-slate-400">
                                {operacao.local ||
                                  "Local não informado"}
                              </p>

                              {operacao.objetivo ? (
                                <p className="mt-2 line-clamp-2 text-xs text-slate-500">
                                  {operacao.objetivo}
                                </p>
                              ) : null}
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
                    titulo="Planejamento integrado"
                    subtitulo="Operações conectadas ao restante do SIG"
                    icone={ClipboardList}
                  />

                  <div className="mt-5 space-y-3">
                    <Regra texto="Toda operação deve possuir objetivo, local, período e responsável." />
                    <Regra texto="Efetivo e viaturas devem permanecer vinculados à missão." />
                    <Regra texto="Ordens de serviço devem integrar planejamento e execução." />
                    <Regra texto="Resultados devem alimentar relatórios, estatísticas e auditoria." />
                  </div>
                </SigCard>
              </section>

              <section>
                <div className="mb-4">
                  <h2 className="text-2xl font-black text-white">
                    Ferramentas de Operações
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Planeje, execute e acompanhe operações especiais.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
  icone: typeof ShieldCheck;
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
