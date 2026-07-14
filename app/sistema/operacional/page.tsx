"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  CarFront,
  Handshake,
  MapPinned,
  PhoneCall,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigActionCard from "@/components/sig/SigActionCard";
import SigButton from "@/components/sig/SigButton";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigStatCard from "@/components/sig/SigStatCard";

import { supabase } from "@/lib/supabase";
import {
  lerMunicipioContextoLocal,
  obterMunicipioIdEfetivo,
} from "@/lib/contextoMunicipio";

type CardOperacional = {
  titulo: string;
  icone: typeof Shield;
  href: string;
  descricao: string;
  modulos: string[];
  detalhe?: string;
};

type UsuarioLocal = {
  id?: string | number;
  perfil?: string;
  municipio_id?: number;
};

type EscalaServico = {
  id: number;
  equipe: string | null;
  guarda_nome: string | null;
  funcao: string | null;
};

type Ocorrencia = {
  id: number;
  tipo: string | null;
  local: string | null;
  status: string | null;
  hora: string | null;
};

type Chamado = {
  id: number;
  tipo: string | null;
  local: string | null;
  status: string | null;
};

type Permuta = {
  id: number;
  status: string | null;
};

type Viatura = {
  id: number;
  prefixo: string | null;
  modelo: string | null;
  status: string | null;
};

type DadosOperacionais = {
  ocorrencias: Ocorrencia[];
  chamados: Chamado[];
  escalaHoje: EscalaServico[];
  permutas: Permuta[];
  viaturas: Viatura[];
};

const dadosIniciais: DadosOperacionais = {
  ocorrencias: [],
  chamados: [],
  escalaHoje: [],
  permutas: [],
  viaturas: [],
};

const cards: CardOperacional[] = [
  {
    titulo: "Central de Patrulhamento",
    icone: CarFront,
    href: "/sistema/central-patrulhamento",
    descricao:
      "Patrulhamentos, GPS, rotas, histórico, rastreamento e equipes em campo.",
    modulos: ["patrulhamento"],
    detalhe: "Acompanhar operação",
  },
  {
    titulo: "Visitas Preventivas",
    icone: Handshake,
    href: "/sistema/patrulhamento/visitas",
    descricao:
      "Pontos visitados, QR Code, check-in, presença preventiva e histórico.",
    modulos: ["visitas"],
    detalhe: "Gerenciar visitas",
  },
  {
    titulo: "Consultas Operacionais",
    icone: Search,
    href: "/sistema/consultas",
    descricao:
      "Consulta de pessoas, veículos e informações de interesse operacional.",
    modulos: [
      "consulta_global",
      "consulta_cpf",
      "consulta_placa",
    ],
    detalhe: "Realizar consulta",
  },
  {
    titulo: "Central de Abordagens",
    icone: Users,
    href: "/sistema/abordagens",
    descricao:
      "Pessoas, veículos, consultas, alertas e histórico de abordagens.",
    modulos: [
      "pessoas_abordadas",
      "veiculos_abordados",
    ],
    detalhe: "Abrir abordagens",
  },
  {
    titulo: "Operações Integradas",
    icone: ShieldCheck,
    href: "/sistema/operacoes",
    descricao:
      "Blitze, barreiras, operações especiais, escoltas e apoios.",
    modulos: ["operacoes"],
    detalhe: "Gerenciar operações",
  },
  {
    titulo: "Mapa Operacional",
    icone: MapPinned,
    href: "/sistema/mapa-operacional",
    descricao:
      "Visualização integrada de ocorrências, equipes, viaturas e pontos críticos.",
    modulos: ["operacional"],
    detalhe: "Abrir mapa",
  },
  {
    titulo: "Ocorrências",
    icone: Activity,
    href: "/sistema/central-ocorrencias",
    descricao:
      "Registro, acompanhamento e consulta de ocorrências operacionais.",
    modulos: ["ocorrencias"],
    detalhe: "Abrir ocorrências",
  },
  {
    titulo: "Chamados",
    icone: PhoneCall,
    href: "/sistema/chamados",
    descricao:
      "Recebimento, despacho, atendimento e encerramento de chamados.",
    modulos: ["chamados"],
    detalhe: "Abrir chamados",
  },
];

function statusNormalizado(valor: unknown) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function dataBahia() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bahia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function obterUsuarioLocal(): UsuarioLocal | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return JSON.parse(
      localStorage.getItem("usuarioLogado") || "null"
    ) as UsuarioLocal | null;
  } catch {
    return null;
  }
}

export default function OperacionalPage() {
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [perfil, setPerfil] = useState("");
  const [municipioNome, setMunicipioNome] = useState("");
  const [modulosPermitidos, setModulosPermitidos] =
    useState<Set<string>>(new Set());
  const [dados, setDados] =
    useState<DadosOperacionais>(dadosIniciais);

  async function carregarTudo() {
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

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;

      if (!token) {
        localStorage.removeItem("usuarioLogado");
        window.location.replace("/login");
        return;
      }

      const respostaPermissoes = await fetch(
        "/api/permissoes/menu",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const retornoPermissoes = await respostaPermissoes
        .json()
        .catch(() => null);

      if (!respostaPermissoes.ok) {
        throw new Error(
          retornoPermissoes?.erro ||
            "Não foi possível carregar as permissões."
        );
      }

      const hoje = dataBahia();

      const [
        ocorrenciasResposta,
        chamadosResposta,
        escalaResposta,
        permutasResposta,
        viaturasResposta,
      ] = await Promise.all([
        supabase
          .from("ocorrencias")
          .select("id,tipo,local,status,hora")
          .eq("municipio_id", municipioId)
          .order("id", { ascending: false })
          .limit(20),

        supabase
          .from("chamados")
          .select("id,tipo,local,status")
          .eq("municipio_id", municipioId)
          .order("id", { ascending: false })
          .limit(20),

        supabase
          .from("escalas_servico")
          .select("id,equipe,guarda_nome,funcao")
          .eq("municipio_id", municipioId)
          .eq("data_servico", hoje)
          .order("equipe")
          .order("guarda_nome"),

        supabase
          .from("permutas_plantao")
          .select("id,status")
          .eq("municipio_id", municipioId)
          .order("id", { ascending: false })
          .limit(50),

        supabase
          .from("viaturas")
          .select("id,prefixo,modelo,status")
          .eq("municipio_id", municipioId)
          .order("prefixo")
          .limit(100),
      ]);

      const erros = [
        ocorrenciasResposta.error,
        chamadosResposta.error,
        escalaResposta.error,
        permutasResposta.error,
        viaturasResposta.error,
      ].filter(Boolean);

      if (erros.length > 0) {
        console.error(
          "Falhas parciais na Central Operacional:",
          erros
        );
      }

      setPerfil(
        String(retornoPermissoes?.perfil || "").toUpperCase()
      );

      setMunicipioNome(
        String(
          retornoPermissoes?.municipio_nome ||
            contexto?.nome ||
            "Município"
        )
      );

      setModulosPermitidos(
        new Set(
          Array.isArray(retornoPermissoes?.modulos)
            ? retornoPermissoes.modulos.map(
                (modulo: unknown) =>
                  String(modulo)
                    .trim()
                    .toLowerCase()
              )
            : []
        )
      );

      setDados({
        ocorrencias:
          (ocorrenciasResposta.data as Ocorrencia[] | null) ||
          [],
        chamados:
          (chamadosResposta.data as Chamado[] | null) ||
          [],
        escalaHoje:
          (escalaResposta.data as EscalaServico[] | null) ||
          [],
        permutas:
          (permutasResposta.data as Permuta[] | null) ||
          [],
        viaturas:
          (viaturasResposta.data as Viatura[] | null) ||
          [],
      });
    } catch (error) {
      console.error(
        "Erro ao carregar Central Operacional:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a Central Operacional."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarTudo();
  }, []);

  const cardsFiltrados = useMemo(() => {
    if (perfil === "DESENVOLVEDOR") {
      return cards;
    }

    return cards.filter((card) =>
      card.modulos.some((modulo) =>
        modulosPermitidos.has(modulo)
      )
    );
  }, [perfil, modulosPermitidos]);

  const metricas = useMemo(() => {
    const ocorrenciasPendentes =
      dados.ocorrencias.filter((item) => {
        const status = statusNormalizado(item.status);

        return ![
          "FINALIZADA",
          "ENCERRADA",
          "ARQUIVADA",
        ].includes(status);
      }).length;

    const chamadosAbertos =
      dados.chamados.filter((item) => {
        const status = statusNormalizado(item.status);

        return ![
          "FINALIZADO",
          "ENCERRADO",
          "CANCELADO",
        ].includes(status);
      }).length;

    const viaturasOperacionais =
      dados.viaturas.filter((item) =>
        [
          "ATIVA",
          "EM_SERVICO",
          "OPERACIONAL",
          "DISPONIVEL",
        ].includes(statusNormalizado(item.status))
      ).length;

    const permutasPendentes =
      dados.permutas.filter((item) =>
        [
          "AGUARDANDO_SUBSTITUTO",
          "ACEITA_PELO_SUBSTITUTO",
        ].includes(statusNormalizado(item.status))
      ).length;

    const equipes = new Set(
      dados.escalaHoje
        .map((item) => item.equipe?.trim())
        .filter((item): item is string => Boolean(item))
    );

    return {
      ocorrenciasPendentes,
      chamadosAbertos,
      viaturasOperacionais,
      permutasPendentes,
      guardasEscalados: dados.escalaHoje.length,
      equipesAtivas: equipes.size,
    };
  }, [dados]);

  const equipesHoje = useMemo(() => {
    const grupos = new Map<
      string,
      EscalaServico[]
    >();

    for (const item of dados.escalaHoje) {
      const equipe =
        item.equipe?.trim() ||
        "Equipe não informada";

      const atual = grupos.get(equipe) || [];
      atual.push(item);
      grupos.set(equipe, atual);
    }

    return Array.from(grupos.entries());
  }, [dados.escalaHoje]);

  return (
    <ProtecaoModulo modulo="operacional">
      <main className="sig-page">
        <div className="sig-page-content">
          <SigPageHeader
            titulo="Centro Operacional"
            subtitulo={`${municipioNome} • Execução operacional integrada, equipes, ocorrências, chamados, viaturas e operações.`}
            detalhe="Operação em tempo real"
            icone={Shield}
            acoes={
              <SigButton
                type="cyan"
                icon={RefreshCw}
                size="sm"
                loading={carregando}
                onClick={() => void carregarTudo()}
              >
                Atualizar
              </SigButton>
            }
          />

          {erro ? (
            <div className="sig-error">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <Link href="/sistema/central-ocorrencias">
              <SigStatCard
                titulo="Ocorrências pendentes"
                valor={metricas.ocorrenciasPendentes}
                subtitulo="Aguardando conclusão"
                icone={AlertTriangle}
                destaque="red"
              />
            </Link>

            <Link href="/sistema/chamados">
              <SigStatCard
                titulo="Chamados abertos"
                valor={metricas.chamadosAbertos}
                subtitulo="Aguardando atendimento"
                icone={PhoneCall}
                destaque="amber"
              />
            </Link>

            <Link href="/sistema/escalas">
              <SigStatCard
                titulo="Equipes em serviço"
                valor={metricas.equipesAtivas}
                subtitulo={`${metricas.guardasEscalados} guardas escalados`}
                icone={Users}
                destaque="green"
              />
            </Link>

            <Link href="/sistema/central-frota">
              <SigStatCard
                titulo="Viaturas operacionais"
                valor={metricas.viaturasOperacionais}
                subtitulo={`${dados.viaturas.length} cadastradas`}
                icone={CarFront}
                destaque="blue"
              />
            </Link>

            <Link href="/sistema/escalas/permutas">
              <SigStatCard
                titulo="Permutas pendentes"
                valor={metricas.permutasPendentes}
                subtitulo="Dependem de ação"
                icone={Activity}
                destaque="cyan"
              />
            </Link>

            <Link href="/sistema/mapa-operacional">
              <SigStatCard
                titulo="Mapa operacional"
                valor="AO VIVO"
                subtitulo="Visualização integrada"
                icone={MapPinned}
                destaque="cyan"
              />
            </Link>
          </section>

          {carregando ? (
            <div className="sig-loading">
              <div>
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />

                <p className="mt-4 text-slate-400">
                  Carregando situação operacional...
                </p>
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-12">
                <SigCard className="xl:col-span-7">
                  <CabecalhoSecao
                    titulo="Guarnições de serviço"
                    subtitulo="Efetivo identificado pela escala operacional de hoje"
                    icone={ShieldCheck}
                  />

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {equipesHoje.length === 0 ? (
                      <div className="col-span-full rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-500">
                        Nenhuma equipe escalada para hoje.
                      </div>
                    ) : (
                      equipesHoje.map(
                        ([equipe, membros]) => (
                          <article
                            key={equipe}
                            className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <h3 className="font-black text-cyan-300">
                                {equipe}
                              </h3>

                              <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black text-emerald-300">
                                EM SERVIÇO
                              </span>
                            </div>

                            <div className="mt-4 space-y-2">
                              {membros.map((membro) => (
                                <div
                                  key={membro.id}
                                  className="flex items-center justify-between gap-3 text-sm"
                                >
                                  <span className="truncate text-slate-300">
                                    {membro.guarda_nome ||
                                      "Guarda não identificado"}
                                  </span>

                                  <span className="shrink-0 text-xs text-slate-500">
                                    {membro.funcao ||
                                      "Sem função"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </article>
                        )
                      )
                    )}
                  </div>
                </SigCard>

                <SigCard className="xl:col-span-5">
                  <CabecalhoSecao
                    titulo="Situação imediata"
                    subtitulo="Ocorrências e chamados mais recentes"
                    icone={Activity}
                  />

                  <div className="mt-5 space-y-3">
                    {[
                      ...dados.ocorrencias
                        .slice(0, 3)
                        .map((item) => ({
                          id: `oc-${item.id}`,
                          titulo:
                            item.tipo ||
                            "Ocorrência",
                          detalhe:
                            item.local ||
                            "Local não informado",
                          href: `/sistema/ocorrencias/${item.id}`,
                          status:
                            item.status ||
                            "PENDENTE",
                          tipo: "ocorrencia",
                        })),
                      ...dados.chamados
                        .slice(0, 3)
                        .map((item) => ({
                          id: `ch-${item.id}`,
                          titulo:
                            item.tipo ||
                            "Chamado",
                          detalhe:
                            item.local ||
                            "Local não informado",
                          href: "/sistema/chamados",
                          status:
                            item.status ||
                            "PENDENTE",
                          tipo: "chamado",
                        })),
                    ]
                      .slice(0, 6)
                      .map((item) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          className="block rounded-2xl border border-slate-800 bg-slate-950/45 p-4 transition hover:border-cyan-400/25"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06] text-cyan-300">
                              {item.tipo ===
                              "ocorrencia" ? (
                                <AlertTriangle className="h-5 w-5" />
                              ) : (
                                <PhoneCall className="h-5 w-5" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate font-black text-white">
                                {item.titulo}
                              </p>

                              <p className="mt-1 truncate text-sm text-slate-400">
                                {item.detalhe}
                              </p>
                            </div>

                            <span className="shrink-0 text-[10px] font-black uppercase text-slate-500">
                              {statusNormalizado(
                                item.status
                              ).replaceAll("_", " ")}
                            </span>
                          </div>
                        </Link>
                      ))}

                    {dados.ocorrencias.length === 0 &&
                    dados.chamados.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-500">
                        Nenhuma atividade operacional recente.
                      </div>
                    ) : null}
                  </div>
                </SigCard>
              </section>

              <section>
                <div className="mb-4">
                  <h2 className="text-2xl font-black text-white">
                    Módulos operacionais
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Acesse as ferramentas disponíveis para o seu perfil.
                  </p>
                </div>

                {cardsFiltrados.length === 0 ? (
                  <div className="sig-empty">
                    Nenhum módulo interno foi liberado para este perfil.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {cardsFiltrados.map((card) => (
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
                )}
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
        <h2 className="font-black text-white">
          {titulo}
        </h2>

        <p className="mt-0.5 text-xs text-slate-500">
          {subtitulo}
        </p>
      </div>
    </div>
  );
}