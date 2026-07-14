"use client";

import Link from "next/link";
import {
  BarChart3,
  ClipboardList,
  Download,
  FileSpreadsheet,
  FileText,
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

type TotaisRelatorios = {
  ocorrencias: number;
  patrulhamentos: number;
  guardas: number;
  viaturas: number;
};

const cards = [
  {
    titulo: "Relatório de Plantão",
    icone: ClipboardList,
    href: "/sistema/relatorio-plantao",
    descricao:
      "Consolide ocorrências, chamados, equipes, viaturas e fatos do plantão.",
    detalhe: "Gerar relatório",
  },
  {
    titulo: "Relatórios Gerenciais",
    icone: BarChart3,
    href: "/sistema/relatorios",
    descricao:
      "Relatórios por módulo, período, situação, equipe e município.",
    detalhe: "Abrir relatórios",
  },
  {
    titulo: "Estatísticas",
    icone: FileSpreadsheet,
    href: "/sistema/estatisticas",
    descricao:
      "Indicadores operacionais, comparativos e séries históricas.",
    detalhe: "Abrir estatísticas",
  },
  {
    titulo: "Exportação de Dados",
    icone: Download,
    href: "/sistema/exportador-dados",
    descricao:
      "Exporte dados autorizados para conferência, análise e prestação de contas.",
    detalhe: "Abrir exportador",
  },
];

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

export default function CentralRelatoriosPage() {
  const [totais, setTotais] = useState<TotaisRelatorios>({
    ocorrencias: 0,
    patrulhamentos: 0,
    guardas: 0,
    viaturas: 0,
  });

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

      const [
        municipioResposta,
        ocorrenciasResposta,
        patrulhamentosResposta,
        guardasResposta,
        viaturasResposta,
      ] = await Promise.all([
        supabase
          .from("municipios")
          .select("nome")
          .eq("id", municipioId)
          .maybeSingle(),

        supabase
          .from("ocorrencias")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("municipio_id", municipioId),

        supabase
          .from("patrulhamentos")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("municipio_id", municipioId),

        supabase
          .from("guardas")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("municipio_id", municipioId),

        supabase
          .from("viaturas")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("municipio_id", municipioId),
      ]);

      if (municipioResposta.error) {
        console.warn(
          "Falha parcial em municipios:",
          municipioResposta.error.message
        );
      }

      const falhas = [
        {
          origem: "ocorrencias",
          erro: ocorrenciasResposta.error,
        },
        {
          origem: "patrulhamentos",
          erro: patrulhamentosResposta.error,
        },
        {
          origem: "guardas",
          erro: guardasResposta.error,
        },
        {
          origem: "viaturas",
          erro: viaturasResposta.error,
        },
      ].filter((item) => Boolean(item.erro));

      for (const falha of falhas) {
        console.warn(
          `Falha parcial em ${falha.origem}:`,
          falha.erro?.message
        );
      }

      setMunicipioNome(
        String(
          municipioResposta.data?.nome ||
            contexto?.nome ||
            "Município"
        )
      );

      setTotais({
        ocorrencias: ocorrenciasResposta.count || 0,
        patrulhamentos:
          patrulhamentosResposta.count || 0,
        guardas: guardasResposta.count || 0,
        viaturas: viaturasResposta.count || 0,
      });
    } catch (error) {
      console.error(
        "Erro ao carregar Central de Relatórios:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a Central de Relatórios."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const totalBase = useMemo(
    () =>
      totais.ocorrencias +
      totais.patrulhamentos +
      totais.guardas +
      totais.viaturas,
    [totais]
  );

  return (
    <ProtecaoModulo modulo="relatorios">
      <main className="sig-page">
        <div className="sig-page-content">
          <SigPageHeader
            titulo="Central de Relatórios"
            subtitulo={`${municipioNome} • Relatórios operacionais, gerenciais, estatísticas e exportações.`}
            detalhe="Informação e prestação de contas"
            icone={FileText}
            acoes={
              <>
                <Link href="/sistema/relatorio-plantao">
                  <SigButton
                    type="primary"
                    icon={ClipboardList}
                    size="sm"
                  >
                    Relatório de plantão
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

          {erro ? (
            <div className="sig-error">
              {erro}
            </div>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <SigStatCard
              titulo="Ocorrências"
              valor={totais.ocorrencias}
              subtitulo="Registros disponíveis"
              icone={ShieldCheck}
              destaque="red"
            />

            <SigStatCard
              titulo="Patrulhamentos"
              valor={totais.patrulhamentos}
              subtitulo="Histórico operacional"
              icone={BarChart3}
              destaque="cyan"
            />

            <SigStatCard
              titulo="Guardas"
              valor={totais.guardas}
              subtitulo="Efetivo cadastrado"
              icone={FileText}
              destaque="green"
            />

            <SigStatCard
              titulo="Viaturas"
              valor={totais.viaturas}
              subtitulo="Frota cadastrada"
              icone={FileSpreadsheet}
              destaque="blue"
            />

            <SigStatCard
              titulo="Base consolidada"
              valor={totalBase}
              subtitulo="Registros principais"
              icone={Download}
              destaque="slate"
            />
          </section>

          {carregando ? (
            <div className="sig-loading">
              <div>
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />

                <p className="mt-4 text-slate-400">
                  Carregando indicadores...
                </p>
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-12">
                <SigCard className="xl:col-span-7">
                  <CabecalhoSecao
                    titulo="Cobertura dos relatórios"
                    subtitulo="Fontes integradas à central"
                    icone={BarChart3}
                  />

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <FonteRelatorio
                      titulo="Operacional"
                      descricao="Ocorrências, chamados, patrulhamentos, visitas e abordagens."
                    />

                    <FonteRelatorio
                      titulo="Recursos Humanos"
                      descricao="Efetivo, escalas, atestados, férias, licenças e banco de horas."
                    />

                    <FonteRelatorio
                      titulo="Frota"
                      descricao="Viaturas, abastecimentos, manutenção, pneus, checklists e danos."
                    />

                    <FonteRelatorio
                      titulo="Administrativo"
                      descricao="Ofícios, patrimônio, armamento, auditoria e documentos."
                    />
                  </div>
                </SigCard>

                <SigCard className="xl:col-span-5" destaque>
                  <CabecalhoSecao
                    titulo="Períodos disponíveis"
                    subtitulo="Padrão único de consolidação"
                    icone={FileText}
                  />

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {[
                      "Diário",
                      "Semanal",
                      "Quinzenal",
                      "Mensal",
                      "Bimestral",
                      "Trimestral",
                      "Semestral",
                      "Anual",
                    ].map((periodo) => (
                      <div
                        key={periodo}
                        className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-center text-sm font-black text-slate-300"
                      >
                        {periodo}
                      </div>
                    ))}
                  </div>
                </SigCard>
              </section>

              <section>
                <div className="mb-4">
                  <h2 className="text-2xl font-black text-white">
                    Ferramentas de Relatórios
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Gere, consulte e exporte informações do sistema.
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
  icone: typeof FileText;
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

function FonteRelatorio({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
      <h3 className="font-black text-white">
        {titulo}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        {descricao}
      </p>
    </div>
  );
}
