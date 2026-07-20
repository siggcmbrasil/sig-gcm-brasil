"use client";

import Link from "next/link";
import {
  Accessibility,
  Award,
  BadgeDollarSign,
  Bell,
  Brain,
  HardHat,
  HandHeart,
  Building2,
  CreditCard,
  Clock3,
  CalendarDays,
  CalendarClock,
  Calculator,
  FileSpreadsheet,
  BarChart3,
  Fingerprint,
  GraduationCap,
  UserRoundCheck,
  HeartPulse,
  Gauge,
  GitBranch,
  Landmark,
  MapPinned,
  Map,
  PackageCheck,
  RefreshCw,
  Settings,
  Shield,
  ShieldAlert,
  Target,
  TimerReset,
  UsersRound,
  TriangleAlert,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigActionCard from "@/components/sig/SigActionCard";
import SigButton from "@/components/sig/SigButton";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigStatCard from "@/components/sig/SigStatCard";
import { supabase } from "@/lib/supabase";

type UsuarioLocal = {
  perfil?: string;
};

type Totais = {
  municipios: number;
  usuarios: number;
  planos: number;
  creditosIa: number;
  avisos: number;
  notificacoes: number;
};

const grupos = [
  {
    titulo: "Gestão Global do SIG",
    descricao:
      "Administração dos municípios, usuários e acessos da plataforma.",
    itens: [
      {
        titulo: "Municípios",
        icone: Building2,
        href: "/sistema/municipios",
        descricao:
          "Criar, configurar e administrar os municípios cadastrados no SIG-GCM Brasil.",
        detalhe: "Gerenciar municípios",
      },
      {
        titulo: "Dimensionamento do Efetivo",
        icone: Calculator,
        href: "/sistema/dimensionamento-efetivo",
        descricao:
          "Projetar concursos, convocações, aposentadorias, custos e recomposição do quadro.",
        detalhe: "Abrir dimensionamento",
      },
      {
        titulo: "Mapa Estratégico do Efetivo",
        icone: Map,
        href: "/sistema/mapa-estrategico-efetivo",
        descricao:
          "Analisar cobertura, déficit por área, afastamentos e prioridades operacionais.",
        detalhe: "Abrir mapa estratégico",
      },
      {
        titulo: "Quadro de Vagas e Lotação",
        icone: MapPinned,
        href: "/sistema/quadro-vagas",
        descricao:
          "Controlar vagas previstas, ocupação, déficit, excedente e movimentações do efetivo.",
        detalhe: "Abrir quadro de lotação",
      },
      {
        titulo: "Controle de EPI e EPC",
        icone: PackageCheck,
        href: "/sistema/epi-epc",
        descricao: "Gerenciar catálogo, estoque, CA, validade, entregas, devoluções e termos.",
        detalhe: "Abrir EPI e EPC",
      },
      {
        titulo: "Acidentes e CAT",
        icone: TriangleAlert,
        href: "/sistema/acidentes-cat",
        descricao: "Registrar acidentes, incidentes, quase acidentes, CAT, investigações e medidas corretivas.",
        detalhe: "Abrir acidentes e CAT",
      },
      {
        titulo: "Segurança do Trabalho",
        icone: HardHat,
        href: "/sistema/seguranca-trabalho",
        descricao:
          "Gerenciar riscos ocupacionais, inspeções, acidentes, CAT, EPI e planos preventivos.",
        detalhe: "Abrir segurança do trabalho",
      },
      {
        titulo: "Saúde Mental e Apoio Psicossocial",
        icone: Brain,
        href: "/sistema/saude-mental",
        descricao:
          "Acompanhar acolhimentos, encaminhamentos, ocorrências críticas, campanhas e qualidade de vida.",
        detalhe: "Abrir saúde mental",
      },
      {
        titulo: "Previdência e Aposentadoria",
        icone: TimerReset,
        href: "/sistema/previdencia-aposentadoria",
        descricao:
          "Controlar tempo de serviço, averbações, certidões, simulações e processos previdenciários.",
        detalhe: "Abrir previdência",
      },
      {
        titulo: "Pensionistas e Dependentes",
        icone: UsersRound,
        href: "/sistema/pensionistas-dependentes",
        descricao:
          "Gerenciar vínculos familiares, pensionistas, dependentes, documentos, vigências e benefícios.",
        detalhe: "Abrir pensionistas e dependentes",
      },
      {
        titulo: "Benefícios do Servidor",
        icone: BadgeDollarSign,
        href: "/sistema/beneficios-servidor",
        descricao:
          "Controlar auxílios, solicitações, análise, vigência, pagamentos, renovação e histórico.",
        detalhe: "Abrir benefícios",
      },
      {
        titulo: "Assistência Social",
        icone: HandHeart,
        href: "/sistema/assistencia-social",
        descricao:
          "Acompanhar atendimentos sociais, visitas, encaminhamentos, benefícios e apoio familiar.",
        detalhe: "Abrir assistência social",
      },
      {
        titulo: "Readaptação Funcional",
        icone: Accessibility,
        href: "/sistema/readaptacao-funcional",
        descricao:
          "Controlar limitações, atividades compatíveis, setor de destino, reavaliações e retorno ao trabalho.",
        detalhe: "Abrir readaptação funcional",
      },
      {
        titulo: "Saúde Ocupacional",
        icone: HeartPulse,
        href: "/sistema/saude-ocupacional",
        descricao:
          "Controlar exames, aptidão funcional, restrições, afastamentos, ASO e readaptações.",
        detalhe: "Abrir saúde ocupacional",
      },
      {
        titulo: "Estágio Probatório",
        icone: UserRoundCheck,
        href: "/sistema/estagio-probatorio",
        descricao:
          "Acompanhar avaliações, prazos, suspensões, recursos, efetivação e exoneração.",
        detalhe: "Abrir estágio probatório",
      },
      {
        titulo: "Plano de Carreira",
        icone: GitBranch,
        href: "/sistema/plano-carreira",
        descricao: "Gerenciar cargos, critérios, promoções, progressões, comissões e homologações.",
        detalhe: "Abrir plano de carreira",
      },
      {
        titulo: "Competências e Habilidades",
        icone: Gauge,
        href: "/sistema/competencias",
        descricao:
          "Mapear níveis, lacunas, evidências e desenvolvimento profissional do efetivo.",
        detalhe: "Abrir matriz de competências",
      },
      {
        titulo: "Treinamentos Obrigatórios",
        icone: ShieldAlert,
        href: "/sistema/treinamentos-obrigatorios",
        descricao:
          "Controlar exigências, reciclagens, pendências, vencimentos e dispensas.",
        detalhe: "Abrir conformidade profissional",
      },
      {
        titulo: "Cursos e Capacitações",
        icone: GraduationCap,
        href: "/sistema/capacitacoes",
        descricao:
          "Gerenciar catálogo, turmas, inscrições, frequência, notas e certificados.",
        detalhe: "Abrir formação profissional",
      },
      {
        titulo: "Plano de Desenvolvimento Individual",
        icone: Target,
        href: "/sistema/pdi",
        descricao:
          "Definir metas, competências, cursos, prazos e acompanhar evolução funcional.",
        detalhe: "Abrir planos individuais",
      },
      {
        titulo: "Avaliação de Desempenho",
        icone: Award,
        href: "/sistema/avaliacoes-desempenho",
        descricao:
          "Avaliar competências, registrar ciência e acompanhar planos de melhoria.",
        detalhe: "Abrir avaliações funcionais",
      },
      {
        titulo: "Frequência e Produtividade",
        icone: BarChart3,
        href: "/sistema/relatorios/frequencia-produtividade",
        descricao:
          "Cruzar frequência, ocorrências, patrulhamentos, visitas e escalas extras.",
        detalhe: "Abrir relatório gerencial",
      },
      {
        titulo: "Folha de Ponto",
        icone: FileSpreadsheet,
        href: "/sistema/folha-ponto",
        descricao:
          "Gerar espelhos mensais, fechar competências, assinar e exportar frequência.",
        detalhe: "Abrir folhas de ponto",
      },
      {
        titulo: "Ponto Eletrônico",
        icone: Fingerprint,
        href: "/sistema/ponto-eletronico/gestao",
        descricao:
          "Controlar jornadas, atrasos, justificativas e frequência dos servidores.",
        detalhe: "Abrir gestão de frequência",
      },
      {
        titulo: "Escalas Extraordinárias",
        icone: CalendarClock,
        href: "/sistema/escalas/extras",
        descricao:
          "Criar eventos, convocar efetivo, registrar presença e gerar horas extras.",
        detalhe: "Abrir escalas extraordinárias",
      },
      {
        titulo: "Férias e Licenças",
        icone: CalendarDays,
        href: "/sistema/escalas/ferias-licencas",
        descricao:
          "Programar férias, licenças, afastamentos e bloqueios de escala.",
        detalhe: "Abrir gestão de afastamentos",
      },
      {
        titulo: "Banco de Horas",
        icone: Clock3,
        href: "/sistema/banco-horas",
        descricao:
          "Controlar créditos, débitos, compensações e solicitações dos servidores.",
        detalhe: "Abrir banco de horas",
      },
      {
        titulo: "Usuários",
        icone: Users,
        href: "/sistema/usuarios",
        descricao:
          "Aprovar acessos, ajustar perfis e gerenciar usuários da plataforma.",
        detalhe: "Gerenciar usuários",
      },
      {
        titulo: "Permissões Globais",
        icone: Shield,
        href: "/sistema/usuarios/permissoes",
        descricao:
          "Controlar perfis, permissões e acessos aos módulos do sistema.",
        detalhe: "Gerenciar permissões",
      },
    ],
  },
  {
    titulo: "Planos e Plataforma",
    descricao:
      "Controle comercial, créditos de IA e parâmetros globais.",
    itens: [
      {
        titulo: "Planos e Assinaturas",
        icone: CreditCard,
        href: "/sistema/planos-assinaturas",
        descricao:
          "Controlar planos, vencimentos, limites e situação dos municípios.",
        detalhe: "Abrir planos",
      },
      {
        titulo: "Créditos IA",
        icone: Brain,
        href: "/sistema/ia-creditos",
        descricao:
          "Gerenciar créditos, consumo e limites da inteligência artificial.",
        detalhe: "Gerenciar créditos",
      },
      {
        titulo: "Configurações Globais",
        icone: Settings,
        href: "/sistema/configuracoes",
        descricao:
          "Parâmetros gerais da plataforma SIG-GCM Brasil.",
        detalhe: "Abrir configurações",
      },
    ],
  },
  {
    titulo: "Institucional e Comunicação",
    descricao:
      "Identidade institucional e comunicação com os municípios.",
    itens: [
      {
        titulo: "Dados Institucionais",
        icone: Landmark,
        href: "/sistema/administracao/institucional",
        descricao:
          "Brasões, comandante, dados oficiais e identidade institucional.",
        detalhe: "Abrir dados oficiais",
      },
      {
        titulo: "Avisos Globais",
        icone: Bell,
        href: "/sistema/avisos",
        descricao:
          "Comunicados oficiais enviados aos municípios e usuários.",
        detalhe: "Gerenciar avisos",
      },
      {
        titulo: "Notificações",
        icone: Bell,
        href: "/sistema/notificacoes",
        descricao:
          "Alertas, notificações internas e comunicação institucional.",
        detalhe: "Abrir notificações",
      },
    ],
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

export default function CentralAdministrativaPage() {
  const [totais, setTotais] = useState<Totais>({
    municipios: 0,
    usuarios: 0,
    planos: 0,
    creditosIa: 0,
    avisos: 0,
    notificacoes: 0,
  });

  const [perfil, setPerfil] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");

    try {
      const usuario = obterUsuarioLocal();
      const perfilAtual = String(usuario?.perfil || "").toUpperCase();

      if (!perfilAtual) {
        throw new Error("Usuário não identificado.");
      }

      setPerfil(perfilAtual);

      const [
        municipiosResposta,
        usuariosResposta,
        planosResposta,
        creditosResposta,
        avisosResposta,
        notificacoesResposta,
      ] = await Promise.all([
        supabase
          .from("municipios")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("usuarios")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("planos_assinaturas")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("ia_creditos_municipio")
          .select("municipio_id", { count: "exact", head: true }),

        supabase
          .from("avisos")
          .select("id", { count: "exact", head: true }),

        supabase
          .from("notificacoes")
          .select("id", { count: "exact", head: true }),
      ]);

      const falhas = [
        { origem: "municipios", erro: municipiosResposta.error },
        { origem: "usuarios", erro: usuariosResposta.error },
        { origem: "planos_assinaturas", erro: planosResposta.error },
        { origem: "ia_creditos_municipio", erro: creditosResposta.error },
        { origem: "avisos", erro: avisosResposta.error },
        { origem: "notificacoes", erro: notificacoesResposta.error },
      ].filter((item) => Boolean(item.erro));

      for (const falha of falhas) {
        console.warn(
          `Falha parcial em ${falha.origem}:`,
          falha.erro?.message
        );
      }

      setTotais({
        municipios: municipiosResposta.count || 0,
        usuarios: usuariosResposta.count || 0,
        planos: planosResposta.count || 0,
        creditosIa: creditosResposta.count || 0,
        avisos: avisosResposta.count || 0,
        notificacoes: notificacoesResposta.count || 0,
      });
    } catch (error) {
      console.error(
        "Erro ao carregar Central Administrativa:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a Central Administrativa."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const totalBase = useMemo(
    () => totais.municipios + totais.usuarios,
    [totais]
  );

  return (
    <ProtecaoModulo modulo="central_administrativa">
      <main className="sig-page">
        <div className="sig-page-content">
          <SigPageHeader
            titulo="Central Administrativa"
            subtitulo="Gestão global da plataforma SIG-GCM Brasil: municípios, usuários, planos, créditos IA e configurações institucionais."
            detalhe="Administração global"
            icone={Settings}
            acoes={
              <SigButton
                type="cyan"
                icon={RefreshCw}
                size="sm"
                loading={carregando}
                onClick={() => void carregar()}
              >
                Atualizar
              </SigButton>
            }
          />

          {erro ? <div className="sig-error">{erro}</div> : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-7">
            <SigStatCard
              titulo="Municípios"
              valor={totais.municipios}
              subtitulo="Cadastrados na plataforma"
              icone={Building2}
              destaque="cyan"
            />

            <SigStatCard
              titulo="Usuários"
              valor={totais.usuarios}
              subtitulo="Contas cadastradas"
              icone={Users}
              destaque="green"
            />

            <SigStatCard
              titulo="Planos"
              valor={totais.planos}
              subtitulo="Registros comerciais"
              icone={CreditCard}
              destaque="blue"
            />

            <SigStatCard
              titulo="Créditos IA"
              valor={totais.creditosIa}
              subtitulo="Municípios com saldo"
              icone={Brain}
              destaque="amber"
            />

            <SigStatCard
              titulo="Avisos"
              valor={totais.avisos}
              subtitulo="Comunicados cadastrados"
              icone={Bell}
              destaque="slate"
            />

            <SigStatCard
              titulo="Notificações"
              valor={totais.notificacoes}
              subtitulo="Registros globais"
              icone={Bell}
              destaque="red"
            />

            <SigStatCard
              titulo="Base principal"
              valor={totalBase}
              subtitulo="Municípios + usuários"
              icone={Shield}
              destaque="cyan"
            />
          </section>

          {carregando ? (
            <div className="sig-loading">
              <div>
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
                <p className="mt-4 text-slate-400">
                  Carregando dados globais...
                </p>
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-12">
                <SigCard className="xl:col-span-7">
                  <CabecalhoSecao
                    titulo="Saúde da plataforma"
                    subtitulo="Resumo da estrutura global do SIG"
                    icone={Shield}
                  />

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <Painel
                      titulo="Municípios ativos na base"
                      valor={totais.municipios}
                    />

                    <Painel
                      titulo="Usuários cadastrados"
                      valor={totais.usuarios}
                    />

                    <Painel
                      titulo="Registros de planos"
                      valor={totais.planos}
                    />

                    <Painel
                      titulo="Municípios com créditos IA"
                      valor={totais.creditosIa}
                    />
                  </div>
                </SigCard>

                <SigCard className="xl:col-span-5" destaque>
                  <CabecalhoSecao
                    titulo="Controle global"
                    subtitulo="Regras essenciais da administração"
                    icone={Settings}
                  />

                  <div className="mt-5 space-y-3">
                    <Regra texto="A Central Administrativa é destinada à gestão global da plataforma." />
                    <Regra texto="Municípios permanecem isolados por municipio_id." />
                    <Regra texto="Alterações sensíveis devem gerar auditoria." />
                    <Regra texto={`Perfil atual: ${perfil || "não identificado"}.`} />
                  </div>
                </SigCard>
              </section>

              {grupos.map((grupo) => (
                <section key={grupo.titulo}>
                  <div className="mb-4">
                    <h2 className="text-2xl font-black text-white">
                      {grupo.titulo}
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      {grupo.descricao}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {grupo.itens.map((item) => (
                      <SigActionCard
                        key={item.href}
                        titulo={item.titulo}
                        descricao={item.descricao}
                        href={item.href}
                        icone={item.icone}
                        detalhe={item.detalhe}
                      />
                    ))}
                  </div>
                </section>
              ))}
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
  icone: typeof Settings;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300">
        <Icone className="h-5 w-5" />
      </div>

      <div>
        <h2 className="font-black text-white">{titulo}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{subtitulo}</p>
      </div>
    </div>
  );
}

function Painel({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
      <p className="text-sm text-slate-400">{titulo}</p>
      <p className="mt-2 text-3xl font-black text-white">{valor}</p>
    </div>
  );
}

function Regra({ texto }: { texto: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3">
      <Shield className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
      <span className="text-sm text-slate-300">{texto}</span>
    </div>
  );
}
