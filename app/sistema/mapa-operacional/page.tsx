"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  Crosshair,
  Eye,
  EyeOff,
  Map,
  RefreshCw,
  Shield,
  Siren,
  Truck,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import SigButton from "@/components/sig/SigButton";
import { obterMunicipioIdEfetivo } from "@/lib/contextoMunicipio";

const MapaOperacional = dynamic(
  () => import("@/components/MapaOperacional"),
  { ssr: false }
);

export default function MapaOperacionalPage() {
  const hoje = useMemo(() => {
    const tzoffset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzoffset).toISOString().split("T")[0];
  }, []);

  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [viaturas, setViaturas] = useState<any[]>([]);
  const [localizacoes, setLocalizacoes] = useState<any[]>([]);
  const [blitzes, setBlitzes] = useState<any[]>([]);
  const [barreiras, setBarreiras] = useState<any[]>([]);
  const [operacoesEspeciais, setOperacoesEspeciais] = useState<any[]>([]);
  const [alertasSOS, setAlertasSOS] = useState<any[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [dataFiltro, setDataFiltro] = useState(hoje);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState("");

  const [mostrar, setMostrar] = useState({
    ocorrencias: true,
    viaturas: true,
    gps: true,
    blitzes: true,
    barreiras: true,
    operacoes: true,
    sos: true,
  });

  function pegarUsuario() {
    if (
      typeof window === "undefined"
    ) {
      return null;
    }

    try {
      const salvo =
        localStorage.getItem(
          "usuarioLogado"
        );

      if (!salvo) {
        return null;
      }

      const usuario =
        JSON.parse(salvo);

      const municipioId =
        obterMunicipioIdEfetivo({
          perfil:
            usuario?.perfil,
          municipioIdUsuario:
            usuario?.municipio_id,
        });

      if (
        !usuario?.id ||
        !municipioId
      ) {
        return null;
      }

      return {
        ...usuario,
        municipio_id:
          municipioId,
      };
    } catch {
      return null;
    }
  }

  function filtrarPorData(lista: any[], campos: string[]) {
    if (!dataFiltro) return lista;

    return lista.filter((item) =>
      campos.some((campo) => {
        const valor = item?.[campo];
        if (!valor) return false;
        return String(valor).split("T")[0] === dataFiltro;
      })
    );
  }

  function filtrarGpsAtivo(lista: any[]) {
    const agora = Date.now();
    const limiteMinutos = 5;

    return lista.filter((item) => {
      const data = item.atualizado_em || item.created_at;
      if (!data) return false;

      const diferencaMinutos = (agora - new Date(data).getTime()) / 60000;
      return diferencaMinutos <= limiteMinutos;
    });
  }

async function carregarAlertasSOSMapa(
  municipioId: number
) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;

  if (sessionError || !accessToken) {
    return {
      data: [],
      error: new Error(
        "Sua sessão expirou. Entre novamente no sistema."
      ),
    };
  }

  try {
    const parametros = new URLSearchParams({
      municipio_id: String(municipioId),
    });

    const resposta = await fetch(
      `/api/sos/mapa?${parametros.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const corpo = await resposta
      .json()
      .catch(() => null);

    if (!resposta.ok || !corpo?.ok) {
      return {
        data: [],
        error: new Error(
          corpo?.erro ||
            "Não foi possível carregar os alertas SOS."
        ),
      };
    }

    return {
      data: Array.isArray(corpo.alertas)
        ? corpo.alertas
        : [],
      error: null,
    };
  } catch (error) {
    return {
      data: [],
      error:
        error instanceof Error
          ? error
          : new Error(
              "Erro ao carregar os alertas SOS."
            ),
    };
  }
}

  async function carregarDados() {
    const usuario = pegarUsuario();

    if (!usuario?.id || !usuario?.municipio_id) {
      setErro("Usuário ou município não identificado.");
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);
      setErro("");

      const municipioId = usuario.municipio_id;

      const [
        ocorrenciasRes,
        viaturasRes,
        gpsRes,
        blitzesRes,
        barreirasRes,
        operacoesRes,
        sosRes,
      ] = await Promise.all([
        supabase
          .from("ocorrencias")
          .select(`
            *,
            locais:local_id (
              id,
              nome,
              latitude,
              longitude
            )
          `)
          .eq("municipio_id", municipioId)
          .order("id", { ascending: false }),

        supabase
          .from("viaturas")
          .select("*")
          .eq("municipio_id", municipioId)
          .order("id", { ascending: false }),

        supabase
          .from("localizacoes_tempo_real")
          .select("*")
          .eq("municipio_id", municipioId)
          .order("atualizado_em", { ascending: false }),

        supabase
          .from("blitzes")
          .select("*")
          .eq("municipio_id", municipioId)
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .order("created_at", { ascending: false }),

        supabase
          .from("barreiras")
          .select("*")
          .eq("municipio_id", municipioId)
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .order("created_at", { ascending: false }),

        supabase
          .from("operacoes_especiais")
          .select("*")
          .eq("municipio_id", municipioId)
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .order("created_at", { ascending: false }),

        carregarAlertasSOSMapa(municipioId),
      ]);

      if (ocorrenciasRes.error) throw ocorrenciasRes.error;
      if (viaturasRes.error) throw viaturasRes.error;
      if (gpsRes.error) throw gpsRes.error;
      if (blitzesRes.error) throw blitzesRes.error;
      if (barreirasRes.error) throw barreirasRes.error;
      if (operacoesRes.error) throw operacoesRes.error;
      if (sosRes.error) throw sosRes.error;

      setOcorrencias(
        filtrarPorData(ocorrenciasRes.data || [], [
          "data",
          "criado_em",
          "created_at",
        ])
      );

      setViaturas(
        filtrarPorData(viaturasRes.data || [], [
          "updated_at",
          "atualizado_em",
          "criado_em",
          "created_at",
        ])
      );

      setLocalizacoes(
        filtrarGpsAtivo(
          filtrarPorData(gpsRes.data || [], ["atualizado_em", "created_at"])
        )
      );

      setBlitzes(
        filtrarPorData(blitzesRes.data || [], [
          "data",
          "created_at",
          "criado_em",
        ])
      );

      setBarreiras(
        filtrarPorData(barreirasRes.data || [], [
          "data",
          "created_at",
          "criado_em",
        ])
      );

      setOperacoesEspeciais(
        filtrarPorData(operacoesRes.data || [], [
          "data",
          "created_at",
          "criado_em",
        ])
      );

      setAlertasSOS(sosRes.data || []);
      setUltimaAtualizacao(new Date().toLocaleTimeString("pt-BR"));
    } catch (error) {
      console.error("Erro ao carregar mapa operacional:", error);
      setErro("Erro ao carregar dados do mapa operacional.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();

    const usuario = pegarUsuario();
    if (!usuario?.municipio_id) return;

    const canal = supabase
      .channel(`mapa-operacional-${usuario.municipio_id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ocorrencias",
          filter:
            `municipio_id=eq.${usuario.municipio_id}`,
        },
        carregarDados
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table:
            "localizacoes_tempo_real",
          filter:
            `municipio_id=eq.${usuario.municipio_id}`,
        },
        carregarDados
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "viaturas",
          filter:
            `municipio_id=eq.${usuario.municipio_id}`,
        },
        carregarDados
      )
      .subscribe();

    const intervalo = setInterval(carregarDados, 15000);

    return () => {
      clearInterval(intervalo);
      supabase.removeChannel(canal);
    };
  }, [dataFiltro]);

  const ocorrenciasVisiveis = mostrar.ocorrencias ? ocorrencias : [];
  const viaturasVisiveis = mostrar.viaturas ? viaturas : [];
  const gpsVisiveis = mostrar.gps ? localizacoes : [];
  const blitzesVisiveis = mostrar.blitzes ? blitzes : [];
  const barreirasVisiveis = mostrar.barreiras ? barreiras : [];
  const operacoesVisiveis = mostrar.operacoes ? operacoesEspeciais : [];
  const sosVisiveis = mostrar.sos ? alertasSOS : [];

  const ocorrenciasHoje = ocorrencias.filter(
    (o) => o.data?.split("T")[0] === hoje
  ).length;

  const abertas = ocorrencias.filter(
    (o) => o.status === "Aberta" || o.status === "ABERTA"
  ).length;

  const finalizadas = ocorrencias.filter(
    (o) => o.status === "Finalizada" || o.status === "FINALIZADA"
  ).length;

  const totalPontos =
    ocorrenciasVisiveis.length +
    viaturasVisiveis.length +
    gpsVisiveis.length +
    blitzesVisiveis.length +
    barreirasVisiveis.length +
    operacoesVisiveis.length +
    sosVisiveis.length;

  function alternarCamada(camada: keyof typeof mostrar) {
    setMostrar((atual) => ({
      ...atual,
      [camada]: !atual[camada],
    }));
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Mapa Operacional"
        subtitulo="Centro de comando em tempo real com ocorrências, GPS, viaturas, blitzes, barreiras, operações especiais e alertas SOS."
        icone={Map}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-9 gap-3">
        <CardInfo titulo="Pontos" valor={totalPontos} icone={Crosshair} />
        <CardInfo titulo="Ocorrências" valor={ocorrencias.length} icone={AlertTriangle} />
        <CardInfo titulo="Hoje" valor={ocorrenciasHoje} icone={CalendarDays} />
        <CardInfo titulo="Abertas" valor={abertas} icone={Siren} />
        <CardInfo titulo="Finalizadas" valor={finalizadas} icone={CheckCircle} />
        <CardInfo titulo="Viaturas" valor={viaturas.length} icone={Truck} />
        <CardInfo titulo="GPS ativo" valor={localizacoes.length} icone={Shield} />
        <CardInfo
          titulo="Operações"
          valor={operacoesEspeciais.length + blitzes.length + barreiras.length}
          icone={Map}
        />
        <CardInfo titulo="SOS" valor={alertasSOS.length} icone={Siren} />
      </div>

      <SigCard>
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-white">Filtros do mapa</h2>
            <p className="text-sm text-slate-400">
              Última atualização: {ultimaAtualizacao || "aguardando..."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              type="date"
              className="input-premium max-w-[220px]"
              value={dataFiltro}
              onChange={(e) => setDataFiltro(e.target.value)}
            />

            <SigButton type="green" onClick={() => setDataFiltro(hoje)}>
              Hoje
            </SigButton>

            <SigButton type="gray" onClick={() => setDataFiltro("")}>
              Todos
            </SigButton>

            <SigButton type="blue" onClick={carregarDados}>
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </SigButton>
          </div>
        </div>
      </SigCard>

      <SigCard>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3">
          <BotaoCamada ativo={mostrar.ocorrencias} titulo="Ocorrências" onClick={() => alternarCamada("ocorrencias")} />
          <BotaoCamada ativo={mostrar.viaturas} titulo="Viaturas" onClick={() => alternarCamada("viaturas")} />
          <BotaoCamada ativo={mostrar.gps} titulo="GPS" onClick={() => alternarCamada("gps")} />
          <BotaoCamada ativo={mostrar.blitzes} titulo="Blitzes" onClick={() => alternarCamada("blitzes")} />
          <BotaoCamada ativo={mostrar.barreiras} titulo="Barreiras" onClick={() => alternarCamada("barreiras")} />
          <BotaoCamada ativo={mostrar.operacoes} titulo="Operações" onClick={() => alternarCamada("operacoes")} />
          <BotaoCamada ativo={mostrar.sos} titulo="SOS" onClick={() => alternarCamada("sos")} />
        </div>
      </SigCard>

      {erro && (
        <div className="rounded-2xl border border-red-800 bg-red-950/60 p-4 text-red-300">
          {erro}
        </div>
      )}

      {carregando ? (
        <SigCard>
          <div className="h-[65vh] min-h-[420px] flex items-center justify-center text-slate-400">
            Carregando mapa operacional...
          </div>
        </SigCard>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <section className="xl:col-span-9">
            <SigCard className="p-3 h-[70vh] min-h-[460px] overflow-hidden">
              <MapaOperacional
                ocorrencias={ocorrenciasVisiveis}
                viaturas={viaturasVisiveis}
                localizacoes={gpsVisiveis}
                blitzes={blitzesVisiveis}
                barreiras={barreirasVisiveis}
                operacoesEspeciais={operacoesVisiveis}
                alertasSOS={sosVisiveis}
              />
            </SigCard>
          </section>

          <aside className="xl:col-span-3 space-y-4">
            <PainelLista
              titulo="🚨 SOS Ativos"
              vazio="Nenhum SOS ativo."
              itens={sosVisiveis}
            />

            <PainelLista
              titulo="🚧 Blitzes e Barreiras"
              vazio="Nenhuma blitz ou barreira com GPS."
              itens={[...blitzesVisiveis, ...barreirasVisiveis]}
            />

            <PainelLista
              titulo="⭐ Operações Especiais"
              vazio="Nenhuma operação especial com GPS."
              itens={operacoesVisiveis}
            />

            <PainelLista
              titulo="🚓 GPS Ativo"
              vazio="Nenhum GPS ativo nos últimos 5 minutos."
              itens={gpsVisiveis}
            />
          </aside>
        </div>
      )}
    </div>
  );
}

function CardInfo({
  titulo,
  valor,
  icone: Icone,
}: {
  titulo: string;
  valor: number;
  icone: any;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          {titulo}
        </p>
        <Icone className="w-5 h-5 text-slate-400" />
      </div>

      <h3 className="mt-3 text-3xl font-black text-white">{valor}</h3>
    </div>
  );
}

function BotaoCamada({
  ativo,
  titulo,
  onClick,
}: {
  ativo: boolean;
  titulo: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-sm font-bold flex items-center justify-center gap-2 ${
        ativo
          ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
          : "border-slate-800 bg-slate-950/60 text-slate-500"
      }`}
    >
      {ativo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      {titulo}
    </button>
  );
}

function PainelLista({
  titulo,
  vazio,
  itens,
}: {
  titulo: string;
  vazio: string;
  itens: any[];
}) {
  return (
    <SigCard>
      <h2 className="font-black mb-4 text-white">{titulo}</h2>

      <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
        {itens.length === 0 ? (
          <p className="text-slate-400 text-sm">{vazio}</p>
        ) : (
          itens.slice(0, 8).map((item) => (
            <div
              key={`${item.id}-${item.nome || item.prefixo || item.nome_usuario || "registro"}`}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
            >
              <p className="font-bold text-white">
                {item.nome || item.prefixo || item.nome_usuario || "Registro"}
              </p>

              <p className="text-sm text-slate-400">
                {item.local || item.observacao || item.status || "Local não informado"}
              </p>

              <p className="text-xs text-slate-500 mt-1">
                {item.status || "Sem status"}
              </p>
            </div>
          ))
        )}
      </div>
    </SigCard>
  );
}