"use client";

import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  ClipboardList,
  FileText,
  PhoneCall,
  PlusCircle,
  RefreshCw,
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

type Apoio = {
  id: number;
  tipo: string | null;
  local: string | null;
  data: string | null;
  responsavel: string | null;
  status: string | null;
};

const cards = [
  {
    titulo: "Novo Apoio",
    href: "/sistema/apoios/novo",
    descricao:
      "Cadastrar novo apoio operacional, institucional ou administrativo.",
    icone: PlusCircle,
    detalhe: "Registrar apoio",
  },
  {
    titulo: "Apoios",
    href: "/sistema/apoios",
    descricao:
      "Consultar, acompanhar e gerenciar todos os apoios registrados.",
    icone: PhoneCall,
    detalhe: "Abrir apoios",
  },
  {
    titulo: "Relatório de Apoios",
    href: "/sistema/apoios/relatorio",
    descricao:
      "Emitir relatórios dos apoios realizados por período, tipo e situação.",
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

export default function CentralApoiosPage() {
  const [apoios, setApoios] = useState<Apoio[]>([]);
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

      const [municipioResposta, apoiosResposta] =
        await Promise.all([
          supabase
            .from("municipios")
            .select("nome")
            .eq("id", municipioId)
            .maybeSingle(),

          supabase
            .from("apoios")
            .select(
              "id,tipo,local,data,responsavel,status"
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

      if (apoiosResposta.error) {
        throw apoiosResposta.error;
      }

      setMunicipioNome(
        String(
          municipioResposta.data?.nome ||
            contexto?.nome ||
            "Município"
        )
      );

      setApoios(
        (apoiosResposta.data as Apoio[] | null) || []
      );
    } catch (error) {
      console.error(
        "Erro ao carregar Central de Apoios:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a Central de Apoios."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const metricas = useMemo(() => {
    const emAndamento = apoios.filter((item) =>
      [
        "ABERTO",
        "PENDENTE",
        "EM_ANDAMENTO",
        "EM_ATENDIMENTO",
      ].includes(normalizar(item.status))
    ).length;

    const finalizados = apoios.filter((item) =>
      [
        "FINALIZADO",
        "FINALIZADA",
        "CONCLUIDO",
        "CONCLUIDA",
        "ENCERRADO",
        "ENCERRADA",
      ].includes(normalizar(item.status))
    ).length;

    const operacionais = apoios.filter((item) =>
      normalizar(item.tipo).includes("OPERACIONAL")
    ).length;

    const institucionais = apoios.filter((item) =>
      normalizar(item.tipo).includes("INSTITUCIONAL")
    ).length;

    const administrativos = apoios.filter((item) =>
      normalizar(item.tipo).includes("ADMINISTRATIVO")
    ).length;

    return {
      total: apoios.length,
      emAndamento,
      finalizados,
      operacionais,
      institucionais,
      administrativos,
    };
  }, [apoios]);

  return (
    <ProtecaoModulo modulo="apoios">
      <main className="sig-page">
        <div className="sig-page-content">
          <SigPageHeader
            titulo="Central de Apoios"
            subtitulo={`${municipioNome} • Apoios operacionais, institucionais e administrativos.`}
            detalhe="Gestão integrada de apoios"
            icone={PhoneCall}
            acoes={
              <>
                <Link href="/sistema/apoios/novo">
                  <SigButton
                    type="primary"
                    icon={PlusCircle}
                    size="sm"
                  >
                    Novo apoio
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
              titulo="Total de apoios"
              valor={metricas.total}
              subtitulo="Registros carregados"
              icone={PhoneCall}
              destaque="cyan"
            />

            <SigStatCard
              titulo="Em andamento"
              valor={metricas.emAndamento}
              subtitulo="Dependem de acompanhamento"
              icone={Activity}
              destaque="amber"
            />

            <SigStatCard
              titulo="Finalizados"
              valor={metricas.finalizados}
              subtitulo="Apoios concluídos"
              icone={CheckCircle2}
              destaque="green"
            />

            <SigStatCard
              titulo="Operacionais"
              valor={metricas.operacionais}
              subtitulo="Apoios em serviço"
              icone={ShieldCheck}
              destaque="red"
            />

            <SigStatCard
              titulo="Institucionais"
              valor={metricas.institucionais}
              subtitulo="Ações institucionais"
              icone={FileText}
              destaque="blue"
            />

            <SigStatCard
              titulo="Administrativos"
              valor={metricas.administrativos}
              subtitulo="Demandas administrativas"
              icone={ClipboardList}
              destaque="slate"
            />
          </section>

          {carregando ? (
            <div className="sig-loading">
              <div>
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
                <p className="mt-4 text-slate-400">
                  Carregando apoios...
                </p>
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-12">
                <SigCard className="xl:col-span-7">
                  <CabecalhoSecao
                    titulo="Apoios recentes"
                    subtitulo="Últimos registros do município"
                    icone={Activity}
                  />

                  <div className="mt-5 space-y-3">
                    {apoios.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-500">
                        Nenhum apoio registrado.
                      </div>
                    ) : (
                      apoios.slice(0, 8).map((apoio) => (
                        <Link
                          key={apoio.id}
                          href="/sistema/apoios"
                          className="block rounded-2xl border border-slate-800 bg-slate-950/45 p-4 transition hover:border-cyan-400/25"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                              <p className="truncate font-black text-white">
                                {apoio.tipo || "Apoio"}
                              </p>

                              <p className="mt-1 truncate text-sm text-slate-400">
                                {apoio.local ||
                                  "Local não informado"}
                                {apoio.responsavel
                                  ? ` • ${apoio.responsavel}`
                                  : ""}
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-3">
                              <span className="text-xs text-slate-500">
                                {formatarData(apoio.data)}
                              </span>

                              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-2.5 py-1 text-[10px] font-black uppercase text-cyan-300">
                                {apoio.status || "SEM STATUS"}
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
                    subtitulo="Apoios conectados ao restante do SIG"
                    icone={ShieldCheck}
                  />

                  <div className="mt-5 space-y-3">
                    <Regra texto="Apoios podem ser vinculados a equipes, viaturas e responsáveis." />
                    <Regra texto="Os registros alimentam relatórios e estatísticas operacionais." />
                    <Regra texto="Cada ação deve respeitar o município ativo." />
                    <Regra texto="Alterações sensíveis devem manter auditoria." />
                  </div>
                </SigCard>
              </section>

              <section>
                <div className="mb-4">
                  <h2 className="text-2xl font-black text-white">
                    Ferramentas de Apoio
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Registre, consulte e emita relatórios dos apoios.
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
  icone: typeof PhoneCall;
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
