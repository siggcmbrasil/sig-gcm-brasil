"use client";

import Link from "next/link";
import {
  CheckCircle2,
  FileText,
  Handshake,
  MapPin,
  QrCode,
  RefreshCw,
  School,
  ShieldCheck,
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

type VisitaRecente = {
  id: number;
  local_nome: string | null;
  ponto_nome: string | null;
  data: string | null;
  hora: string | null;
  status: string | null;
  validado_gps: boolean | null;
  validado_qrcode: boolean | null;
};

type TotaisVisitas = {
  visitas: number;
  pontos: number;
  comprovacoes: number;
  qrCode: number;
  gps: number;
};

const cards = [
  {
    titulo: "Visitas Preventivas",
    href: "/sistema/rondas",
    descricao:
      "Registrar e consultar visitas preventivas realizadas durante o patrulhamento.",
    icone: Handshake,
    detalhe: "Abrir visitas",
  },
  {
    titulo: "Pontos de Visita",
    href: "/sistema/visitas/pontos",
    descricao:
      "Cadastrar escolas, órgãos, comércios e locais de presença preventiva.",
    icone: School,
    detalhe: "Gerenciar pontos",
  },
  {
    titulo: "Histórico de Comprovações",
    href: "/sistema/visitas/historico",
    descricao:
      "Consultar visitas comprovadas por QR Code, GPS, data e equipe.",
    icone: FileText,
    detalhe: "Abrir histórico",
  },
  {
    titulo: "Ler QR Code",
    href: "/sistema/visitas/ler-qrcode",
    descricao:
      "Escanear o QR Code do local e confirmar a visita com geolocalização.",
    icone: QrCode,
    detalhe: "Ler QR Code",
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

function formatarData(data: string | null, hora: string | null) {
  if (!data) return hora || "Data não informada";

  const [ano, mes, dia] = data.split("-");
  const dataFormatada =
    ano && mes && dia ? `${dia}/${mes}/${ano}` : data;

  return hora ? `${dataFormatada} às ${hora}` : dataFormatada;
}

export default function CentralVisitasPage() {
  const [totais, setTotais] = useState<TotaisVisitas>({
    visitas: 0,
    pontos: 0,
    comprovacoes: 0,
    qrCode: 0,
    gps: 0,
  });

  const [recentes, setRecentes] = useState<VisitaRecente[]>([]);
  const [municipioNome, setMunicipioNome] = useState("Município");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function contarTabela(
    tabela: string,
    municipioId: number,
    filtros?: Array<{
      coluna: string;
      valor: string | number | boolean;
    }>
  ) {
    let consulta = supabase
      .from(tabela)
      .select("id", { count: "exact", head: true })
      .eq("municipio_id", municipioId);

    for (const filtro of filtros || []) {
      consulta = consulta.eq(filtro.coluna, filtro.valor);
    }

    const resposta = await consulta;

    if (resposta.error) {
      console.warn(
        `Falha parcial em ${tabela}:`,
        resposta.error.message
      );
      return 0;
    }

    return resposta.count || 0;
  }

  async function carregarRecentes(municipioId: number) {
    const tentativas = [
      {
        tabela: "visitas",
        campos:
          "id,local_nome,ponto_nome,data,hora,status,validado_gps,validado_qrcode",
      },
      {
        tabela: "visitas_checkins",
        campos:
          "id,local_nome,ponto_nome,data,hora,status,validado_gps,validado_qrcode",
      },
      {
        tabela: "rondas",
        campos:
          "id,local_nome,ponto_nome,data,hora,status,validado_gps,validado_qrcode",
      },
    ];

    for (const tentativa of tentativas) {
      const resposta = await supabase
        .from(tentativa.tabela)
        .select(tentativa.campos)
        .eq("municipio_id", municipioId)
        .order("id", { ascending: false })
        .limit(8);

      if (!resposta.error) {
        return (
          (resposta.data as unknown as VisitaRecente[] | null) || []
        );
      }

      console.warn(
        `Falha parcial em ${tentativa.tabela}:`,
        resposta.error.message
      );
    }

    return [];
  }

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

      const [
        visitas,
        pontos,
        comprovacoes,
        qrCode,
        gps,
        registrosRecentes,
      ] = await Promise.all([
        contarTabela("visitas", municipioId),
        contarTabela("pontos_visita", municipioId),
        contarTabela("visitas_checkins", municipioId),
        contarTabela("visitas_checkins", municipioId, [
          { coluna: "validado_qrcode", valor: true },
        ]),
        contarTabela("visitas_checkins", municipioId, [
          { coluna: "validado_gps", valor: true },
        ]),
        carregarRecentes(municipioId),
      ]);

      setMunicipioNome(
        String(
          municipioResposta.data?.nome ||
            contexto?.nome ||
            "Município"
        )
      );

      setTotais({
        visitas,
        pontos,
        comprovacoes,
        qrCode,
        gps,
      });

      setRecentes(registrosRecentes);
    } catch (error) {
      console.error(
        "Erro ao carregar Central de Visitas:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a Central de Visitas."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const validacoes = useMemo(
    () => totais.qrCode + totais.gps,
    [totais]
  );

  return (
    <ProtecaoModulo modulo="visitas">
      <main className="sig-page">
        <div className="sig-page-content">
          <SigPageHeader
            titulo="Central de Visitas Preventivas"
            subtitulo={`${municipioNome} • Presença preventiva, pontos de visita, QR Code, GPS e histórico.`}
            detalhe="Integração com patrulhamento"
            icone={Handshake}
            acoes={
              <>
                <Link href="/sistema/visitas/ler-qrcode">
                  <SigButton
                    type="primary"
                    icon={QrCode}
                    size="sm"
                  >
                    Ler QR Code
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
              titulo="Visitas"
              valor={totais.visitas}
              subtitulo="Registros cadastrados"
              icone={Handshake}
              destaque="cyan"
            />

            <SigStatCard
              titulo="Pontos de visita"
              valor={totais.pontos}
              subtitulo="Locais cadastrados"
              icone={School}
              destaque="blue"
            />

            <SigStatCard
              titulo="Comprovações"
              valor={totais.comprovacoes}
              subtitulo="Check-ins registrados"
              icone={CheckCircle2}
              destaque="green"
            />

            <SigStatCard
              titulo="QR Code"
              valor={totais.qrCode}
              subtitulo="Validações por leitura"
              icone={QrCode}
              destaque="amber"
            />

            <SigStatCard
              titulo="GPS"
              valor={totais.gps}
              subtitulo="Validações geográficas"
              icone={MapPin}
              destaque="red"
            />

            <SigStatCard
              titulo="Validações"
              valor={validacoes}
              subtitulo="QR Code + GPS"
              icone={ShieldCheck}
              destaque="slate"
            />
          </section>

          {carregando ? (
            <div className="sig-loading">
              <div>
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
                <p className="mt-4 text-slate-400">
                  Carregando visitas preventivas...
                </p>
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-12">
                <SigCard className="xl:col-span-7">
                  <CabecalhoSecao
                    titulo="Visitas recentes"
                    subtitulo="Últimos registros e comprovações"
                    icone={Handshake}
                  />

                  <div className="mt-5 space-y-3">
                    {recentes.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-500">
                        Nenhuma visita recente encontrada.
                      </div>
                    ) : (
                      recentes.map((visita) => (
                        <Link
                          key={visita.id}
                          href="/sistema/visitas/historico"
                          className="block rounded-2xl border border-slate-800 bg-slate-950/45 p-4 transition hover:border-cyan-400/25"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                              <p className="truncate font-black text-white">
                                {visita.local_nome ||
                                  visita.ponto_nome ||
                                  `Visita ${visita.id}`}
                              </p>

                              <p className="mt-1 text-sm text-slate-400">
                                {formatarData(
                                  visita.data,
                                  visita.hora
                                )}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {visita.validado_qrcode ? (
                                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-2.5 py-1 text-[10px] font-black text-cyan-300">
                                  QR CODE
                                </span>
                              ) : null}

                              {visita.validado_gps ? (
                                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-2.5 py-1 text-[10px] font-black text-emerald-300">
                                  GPS
                                </span>
                              ) : null}

                              <span className="rounded-full border border-slate-700 px-2.5 py-1 text-[10px] font-black uppercase text-slate-400">
                                {visita.status || "REGISTRADA"}
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
                    titulo="Validação da presença"
                    subtitulo="Segurança do registro preventivo"
                    icone={ShieldCheck}
                  />

                  <div className="mt-5 space-y-3">
                    <Regra texto="A visita deve permanecer vinculada ao patrulhamento em andamento." />
                    <Regra texto="O QR Code identifica o ponto institucional visitado." />
                    <Regra texto="O GPS confirma a presença dentro do raio configurado." />
                    <Regra texto="O histórico deve registrar equipe, horário, local e município." />
                  </div>
                </SigCard>
              </section>

              <section>
                <div className="mb-4">
                  <h2 className="text-2xl font-black text-white">
                    Ferramentas de Visitas
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Registre, comprove e consulte a presença preventiva.
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
  icone: typeof Handshake;
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
