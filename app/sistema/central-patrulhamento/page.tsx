"use client";

import Link from "next/link";
import {
  Activity,
  CarFront,
  ClipboardList,
  Clock3,
  History,
  Map,
  MapPin,
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
  montarUrlComMunicipioContexto,
} from "@/lib/contextoMunicipio";
import { supabase } from "@/lib/supabase";

type UsuarioLocal = {
  perfil?: string;
  municipio_id?: number;
};

type Permissoes = {
  pode_ver: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
};

type Patrulhamento = {
  id: number;
  municipio_id: number;
  data: string | null;
  hora: string | null;
  local: string | null;
  guarda: string | null;
  equipe: string | null;
  viatura: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  observacao: string | null;
  status: string | null;
  finalizado_em: string | null;
};

type RespostaPatrulhamento = {
  ok?: boolean;
  erro?: string;
  contexto?: {
    usuario_id: number;
    usuario_nome: string | null;
    perfil: string;
    municipio_id: number;
  };
  permissoes?: Permissoes;
  patrulhamentos?: Patrulhamento[];
};

const cards = [
  {
    titulo: "Novo Patrulhamento",
    descricao:
      "Inicie um patrulhamento com equipe, viatura e rastreamento GPS.",
    href: "/sistema/patrulhamento/novo",
    icone: Route,
    detalhe: "Iniciar patrulhamento",
    exigeCriar: true,
  },
  {
    titulo: "Histórico de Patrulhamentos",
    descricao:
      "Consulte patrulhamentos realizados, equipes, horários e situação.",
    href: "/sistema/patrulhamento",
    icone: History,
    detalhe: "Abrir histórico",
    exigeCriar: false,
  },
  {
    titulo: "Mapa de Patrulhamento",
    descricao:
      "Visualize rotas, posições registradas e deslocamentos operacionais.",
    href: "/sistema/patrulhamento/rotas",
    icone: Map,
    detalhe: "Abrir mapa",
    exigeCriar: false,
  },
  {
    titulo: "Rastreamento em Tempo Real",
    descricao:
      "Acompanhe equipes e viaturas com localização operacional.",
    href: "/sistema/localizacao",
    icone: Activity,
    detalhe: "Abrir rastreamento",
    exigeCriar: false,
  },
  {
    titulo: "Visitas e QR Code",
    descricao:
      "Registre presença preventiva, check-ins e pontos visitados.",
    href: "/sistema/patrulhamento/visitas",
    icone: ClipboardList,
    detalhe: "Abrir visitas",
    exigeCriar: false,
  },
  {
    titulo: "Gerar QR Code",
    descricao:
      "Cadastre pontos institucionais e gere QR Code para check-in.",
    href: "/sistema/patrulhamento/visitas/qrcode",
    icone: ClipboardList,
    detalhe: "Gerar QR Code",
    exigeCriar: true,
  },
];

function normalizarStatus(valor: unknown) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function formatarData(data: string | null, hora: string | null) {
  if (!data) return hora || "Data não informada";

  const [ano, mes, dia] = data.split("-");
  const dataFormatada =
    ano && mes && dia ? `${dia}/${mes}/${ano}` : data;

  return hora ? `${dataFormatada} às ${hora}` : dataFormatada;
}

function lerUsuarioLocal(): UsuarioLocal | null {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(
      localStorage.getItem("usuarioLogado") || "null"
    ) as UsuarioLocal | null;
  } catch {
    return null;
  }
}

export default function CentralPatrulhamentoPage() {
  const [patrulhamentos, setPatrulhamentos] = useState<
    Patrulhamento[]
  >([]);
  const [permissoes, setPermissoes] =
    useState<Permissoes | null>(null);
  const [municipioNome, setMunicipioNome] =
    useState("Município");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");

    try {
      const usuario = lerUsuarioLocal();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;

      if (!token) {
        localStorage.removeItem("usuarioLogado");
        window.location.replace("/login");
        return;
      }

      const url = montarUrlComMunicipioContexto({
        url: "/api/patrulhamento",
        perfil: usuario?.perfil,
        municipioIdUsuario: usuario?.municipio_id,
      });

      const resposta = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const dados = (await resposta
        .json()
        .catch(() => null)) as RespostaPatrulhamento | null;

      if (resposta.status === 401) {
        localStorage.removeItem("usuarioLogado");
        window.location.replace("/login");
        return;
      }

      if (!resposta.ok || !dados?.ok) {
        throw new Error(
          dados?.erro ||
            "Não foi possível carregar a Central de Patrulhamento."
        );
      }

      setPatrulhamentos(
        Array.isArray(dados.patrulhamentos)
          ? dados.patrulhamentos
          : []
      );

      setPermissoes(dados.permissoes || null);

      const municipioId = dados.contexto?.municipio_id;

      if (municipioId) {
        const { data: municipio } = await supabase
          .from("municipios")
          .select("nome")
          .eq("id", municipioId)
          .maybeSingle();

        setMunicipioNome(
          String(municipio?.nome || "Município")
        );
      }
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a Central de Patrulhamento."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();

    const intervalo = window.setInterval(() => {
      void carregar();
    }, 30000);

    return () => window.clearInterval(intervalo);
  }, []);

  const metricas = useMemo(() => {
    const ativos = patrulhamentos.filter((item) =>
      [
        "ATIVO",
        "EM_ANDAMENTO",
        "EM PATRULHAMENTO",
        "PATRULHANDO",
      ].includes(normalizarStatus(item.status))
    );

    const pausados = patrulhamentos.filter(
      (item) => normalizarStatus(item.status) === "PAUSADO"
    );

    const equipes = new Set(
      ativos
        .map((item) => item.equipe?.trim())
        .filter((item): item is string => Boolean(item))
    );

    const viaturas = new Set(
      ativos
        .map((item) => item.viatura?.trim())
        .filter((item): item is string => Boolean(item))
    );

    const comGps = ativos.filter(
      (item) =>
        item.latitude !== null &&
        item.longitude !== null
    ).length;

    return {
      ativos: ativos.length,
      pausados: pausados.length,
      equipes: equipes.size,
      viaturas: viaturas.size,
      comGps,
      total: patrulhamentos.length,
    };
  }, [patrulhamentos]);

  const emCampo = useMemo(
    () =>
      patrulhamentos
        .filter((item) =>
          [
            "ATIVO",
            "EM_ANDAMENTO",
            "EM PATRULHAMENTO",
            "PATRULHANDO",
            "PAUSADO",
          ].includes(normalizarStatus(item.status))
        )
        .slice(0, 8),
    [patrulhamentos]
  );

  const cardsPermitidos = useMemo(
    () =>
      cards.filter(
        (card) =>
          !card.exigeCriar ||
          permissoes?.pode_criar === true
      ),
    [permissoes]
  );

  return (
    <ProtecaoModulo modulo="patrulhamento">
      <main className="sig-page">
        <div className="sig-page-content">
          <SigPageHeader
            titulo="Central de Patrulhamento"
            subtitulo={`${municipioNome} • Patrulhamentos, equipes, GPS, rotas, histórico e visitas preventivas.`}
            detalhe="Monitoramento operacional"
            icone={CarFront}
            acoes={
              <>
                {permissoes?.pode_criar ? (
                  <Link href="/sistema/patrulhamento/novo">
                    <SigButton
                      type="primary"
                      icon={Route}
                      size="sm"
                    >
                      Novo patrulhamento
                    </SigButton>
                  </Link>
                ) : null}

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
              titulo="Patrulhamentos ativos"
              valor={metricas.ativos}
              subtitulo="Em deslocamento"
              icone={Activity}
              destaque="green"
            />

            <SigStatCard
              titulo="Patrulhamentos pausados"
              valor={metricas.pausados}
              subtitulo="Aguardando retomada"
              icone={Clock3}
              destaque="amber"
            />

            <SigStatCard
              titulo="Equipes em campo"
              valor={metricas.equipes}
              subtitulo="Equipes identificadas"
              icone={Users}
              destaque="cyan"
            />

            <SigStatCard
              titulo="Viaturas em operação"
              valor={metricas.viaturas}
              subtitulo="Viaturas identificadas"
              icone={CarFront}
              destaque="blue"
            />

            <SigStatCard
              titulo="GPS registrado"
              valor={metricas.comGps}
              subtitulo="Patrulhamentos ativos"
              icone={MapPin}
              destaque="cyan"
            />

            <SigStatCard
              titulo="Histórico carregado"
              valor={metricas.total}
              subtitulo="Registros recentes"
              icone={History}
              destaque="slate"
            />
          </section>

          {carregando ? (
            <div className="sig-loading">
              <div>
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
                <p className="mt-4 text-slate-400">
                  Carregando patrulhamentos...
                </p>
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-12">
                <SigCard className="xl:col-span-8">
                  <CabecalhoSecao
                    titulo="Equipes em campo"
                    subtitulo="Patrulhamentos ativos e pausados"
                    icone={ShieldCheck}
                  />

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {emCampo.length === 0 ? (
                      <div className="col-span-full rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-500">
                        Nenhum patrulhamento ativo neste momento.
                      </div>
                    ) : (
                      emCampo.map((item) => {
                        const status = normalizarStatus(
                          item.status
                        );

                        const ativo = status !== "PAUSADO";

                        return (
                          <Link
                            key={item.id}
                            href={`/sistema/patrulhamento/${item.id}`}
                            className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4 transition hover:border-cyan-400/25"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="truncate font-black text-white">
                                  {item.equipe ||
                                    item.guarda ||
                                    `Patrulhamento ${item.id}`}
                                </h3>

                                <p className="mt-1 truncate text-sm text-slate-400">
                                  {item.viatura ||
                                    "Viatura não informada"}
                                </p>
                              </div>

                              <span
                                className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black ${
                                  ativo
                                    ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                                    : "border-amber-400/25 bg-amber-400/10 text-amber-300"
                                }`}
                              >
                                {item.status || "SEM STATUS"}
                              </span>
                            </div>

                            <div className="mt-4 space-y-2 text-xs text-slate-500">
                              <p>
                                Local:{" "}
                                {item.local ||
                                  "Não informado"}
                              </p>
                              <p>
                                Início:{" "}
                                {formatarData(
                                  item.data,
                                  item.hora
                                )}
                              </p>
                              <p>
                                GPS:{" "}
                                {item.latitude !== null &&
                                item.longitude !== null
                                  ? "Registrado"
                                  : "Sem posição"}
                              </p>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </SigCard>

                <SigCard className="xl:col-span-4">
                  <CabecalhoSecao
                    titulo="Situação operacional"
                    subtitulo="Resumo do monitoramento"
                    icone={Activity}
                  />

                  <div className="mt-5 space-y-3">
                    <Resumo
                      titulo="Patrulhamentos em movimento"
                      valor={metricas.ativos}
                      destaque="green"
                    />

                    <Resumo
                      titulo="Patrulhamentos pausados"
                      valor={metricas.pausados}
                      destaque="amber"
                    />

                    <Resumo
                      titulo="Equipes com posição GPS"
                      valor={metricas.comGps}
                      destaque="cyan"
                    />

                    <Link
                      href="/sistema/patrulhamento/rotas"
                      className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] px-4 text-sm font-black text-cyan-200 transition hover:bg-cyan-400/10"
                    >
                      <Map className="h-4 w-4" />
                      Abrir mapa de patrulhamento
                    </Link>
                  </div>
                </SigCard>
              </section>

              <section>
                <div className="mb-4">
                  <h2 className="text-2xl font-black text-white">
                    Ferramentas de Patrulhamento
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Acesse os recursos disponíveis para seu perfil.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {cardsPermitidos.map((card) => (
                    <SigActionCard
                      key={`${card.href}-${card.titulo}`}
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

function Resumo({
  titulo,
  valor,
  destaque,
}: {
  titulo: string;
  valor: number;
  destaque: "green" | "amber" | "cyan";
}) {
  const classes = {
    green:
      "border-emerald-400/15 bg-emerald-400/[0.05] text-emerald-200",
    amber:
      "border-amber-400/15 bg-amber-400/[0.05] text-amber-200",
    cyan:
      "border-cyan-400/15 bg-cyan-400/[0.05] text-cyan-200",
  };

  return (
    <div
      className={`flex items-center justify-between rounded-2xl border p-4 ${classes[destaque]}`}
    >
      <span className="text-sm font-bold">
        {titulo}
      </span>

      <strong className="text-2xl">
        {valor}
      </strong>
    </div>
  );
}
