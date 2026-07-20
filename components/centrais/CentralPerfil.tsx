"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Boxes,
  CalendarDays,
  CarFront,
  ClipboardCheck,
  Clock3,
  FileSearch,
  FileText,
  Gavel,
  GraduationCap,
  Landmark,
  MapPin,
  MessageCircle,
  PhoneCall,
  Radio,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Siren,
  UserCheck,
  Users,
} from "lucide-react";

type UsuarioLocal = {
  id?: string | number;
  nome?: string;
  perfil?: string;
  matricula?: string;
  municipio_nome?: string;
};

export type TipoCentral =
  | "GUARDA"
  | "COMANDO"
  | "CORREGEDORIA"
  | "ADMINISTRATIVA"
  | "DESENVOLVEDOR"
  | "CONSULTA";

type ItemCentral = {
  titulo: string;
  descricao: string;
  href: string;
  icone: LucideIcon;
  destaque?: "cyan" | "blue" | "green" | "amber" | "red" | "violet";
};

type GrupoCentral = {
  titulo: string;
  descricao: string;
  itens: ItemCentral[];
};

const CONFIGURACOES: Record<
  TipoCentral,
  {
    titulo: string;
    subtitulo: string;
    etiqueta: string;
    icone: LucideIcon;
    grupos: GrupoCentral[];
  }
> = {
  GUARDA: {
    titulo: "Central do Guarda",
    subtitulo:
      "Acesso rápido às atividades pessoais, operacionais e ao plantão.",
    etiqueta: "ÁREA PESSOAL E OPERACIONAL",
    icone: Shield,
    grupos: [
      {
        titulo: "Meu serviço",
        descricao: "Rotinas diretamente ligadas ao plantão e à guarnição.",
        itens: [
          {
            titulo: "Plantões e escalas",
            descricao: "Consulte seu serviço, equipe e função.",
            href: "/sistema/escalas",
            icone: CalendarDays,
            destaque: "cyan",
          },
          {
            titulo: "Permutas",
            descricao: "Solicite, aceite ou acompanhe trocas de plantão.",
            href: "/sistema/escalas/permutas",
            icone: Clock3,
            destaque: "blue",
          },
          {
            titulo: "Chamados",
            descricao: "Atenda e acompanhe chamados operacionais.",
            href: "/sistema/chamados",
            icone: PhoneCall,
            destaque: "amber",
          },
          {
            titulo: "Ocorrências",
            descricao: "Registre e consulte ocorrências autorizadas.",
            href: "/sistema/central-ocorrencias",
            icone: Activity,
            destaque: "red",
          },
        ],
      },
      {
        titulo: "Atividade em campo",
        descricao: "Ferramentas para o serviço externo e registro de presença.",
        itens: [
          {
            titulo: "Patrulhamento",
            descricao: "Inicie e acompanhe seu patrulhamento.",
            href: "/sistema/patrulhamento",
            icone: Radio,
            destaque: "green",
          },
          {
            titulo: "Visitas",
            descricao: "Registre visitas e confirmações por QR Code.",
            href: "/sistema/visitas",
            icone: MapPin,
            destaque: "cyan",
          },
          {
            titulo: "Mapa operacional",
            descricao: "Visualize ocorrências e pontos operacionais.",
            href: "/sistema/mapa-operacional",
            icone: Landmark,
            destaque: "blue",
          },
          {
            titulo: "Notificações",
            descricao: "Veja avisos e orientações direcionadas a você.",
            href: "/sistema/notificacoes",
            icone: MessageCircle,
            destaque: "violet",
          },
        ],
      },
      {
        titulo: "Minha vida funcional",
        descricao: "Consulta de informações e documentos pessoais.",
        itens: [
          {
            titulo: "Meu perfil",
            descricao: "Consulte seus dados cadastrados no sistema.",
            href: "/sistema/perfil",
            icone: UserCheck,
            destaque: "cyan",
          },
          {
            titulo: "Ensino",
            descricao: "Acesse cursos, materiais e capacitações.",
            href: "/sistema/ensino",
            icone: GraduationCap,
            destaque: "green",
          },
          {
            titulo: "Legislação",
            descricao: "Consulte leis, normas e materiais jurídicos.",
            href: "/sistema/central-legislacao",
            icone: BookOpen,
            destaque: "blue",
          },
          {
            titulo: "Comunicação",
            descricao: "Acompanhe comunicados e informações institucionais.",
            href: "/sistema/comunicacao",
            icone: MessageCircle,
            destaque: "violet",
          },
        ],
      },
    ],
  },

  COMANDO: {
    titulo: "Central do Comando",
    subtitulo:
      "Visão gerencial do efetivo, serviço, ocorrências e recursos da corporação.",
    etiqueta: "GESTÃO E DECISÃO OPERACIONAL",
    icone: ShieldCheck,
    grupos: [
      {
        titulo: "Comando operacional",
        descricao: "Situação atual da corporação e resposta em campo.",
        itens: [
          {
            titulo: "Centro de Comando",
            descricao: "Abra o dashboard operacional completo.",
            href: "/sistema",
            icone: BarChart3,
            destaque: "cyan",
          },
          {
            titulo: "Ocorrências",
            descricao: "Acompanhe registros abertos, recentes e finalizados.",
            href: "/sistema/central-ocorrencias",
            icone: AlertTriangle,
            destaque: "red",
          },
          {
            titulo: "Chamados",
            descricao: "Supervisione a fila e o atendimento de chamados.",
            href: "/sistema/chamados",
            icone: PhoneCall,
            destaque: "amber",
          },
          {
            titulo: "Mapa operacional",
            descricao: "Visualize equipes, ocorrências e pontos do município.",
            href: "/sistema/mapa-operacional",
            icone: MapPin,
            destaque: "blue",
          },
        ],
      },
      {
        titulo: "Efetivo e serviço",
        descricao: "Planejamento do efetivo e acompanhamento das equipes.",
        itens: [
          {
            titulo: "RH",
            descricao: "Gerencie guardas e informações funcionais.",
            href: "/sistema/central-rh",
            icone: Users,
            destaque: "cyan",
          },
          {
            titulo: "Escalas",
            descricao: "Organize plantões, equipes e serviços.",
            href: "/sistema/escalas",
            icone: CalendarDays,
            destaque: "green",
          },
          {
            titulo: "Permutas",
            descricao: "Analise e decida solicitações de permuta.",
            href: "/sistema/escalas/permutas",
            icone: Clock3,
            destaque: "blue",
          },
          {
            titulo: "Relatórios",
            descricao: "Acesse relatórios gerenciais e operacionais.",
            href: "/sistema/central-relatorios",
            icone: FileText,
            destaque: "violet",
          },
        ],
      },
      {
        titulo: "Recursos da corporação",
        descricao: "Controle dos meios materiais e administrativos.",
        itens: [
          {
            titulo: "Frota",
            descricao: "Viaturas, manutenção, danos e checklists.",
            href: "/sistema/central-frota",
            icone: CarFront,
            destaque: "blue",
          },
          {
            titulo: "Armamento",
            descricao: "Controle de armamentos, cautelas e documentos.",
            href: "/sistema/armamentos",
            icone: ShieldAlert,
            destaque: "red",
          },
          {
            titulo: "Patrimônio",
            descricao: "Bens, movimentações e almoxarifado.",
            href: "/sistema/central-patrimonio",
            icone: Boxes,
            destaque: "amber",
          },
          {
            titulo: "Administrativa",
            descricao: "Ofícios, documentos e rotinas administrativas.",
            href: "/sistema/central-administrativa",
            icone: FileSearch,
            destaque: "cyan",
          },
        ],
      },
    ],
  },

  CORREGEDORIA: {
    titulo: "Central da Corregedoria",
    subtitulo:
      "Ambiente reservado para controle disciplinar, auditoria e integridade.",
    etiqueta: "ACESSO RESTRITO E AUDITADO",
    icone: Gavel,
    grupos: [
      {
        titulo: "Atuação correcional",
        descricao: "Acompanhamento de procedimentos e manifestações.",
        itens: [
          {
            titulo: "Corregedoria",
            descricao: "Abra a área principal de procedimentos correcionais.",
            href: "/sistema/corregedoria",
            icone: Gavel,
            destaque: "red",
          },
          {
            titulo: "Ouvidoria",
            descricao: "Consulte manifestações e encaminhamentos autorizados.",
            href: "/sistema/portal-cidadao/ouvidoria",
            icone: MessageCircle,
            destaque: "amber",
          },
          {
            titulo: "Denúncias",
            descricao: "Acompanhe denúncias e protocolos restritos.",
            href: "/sistema/portal-cidadao/denuncias",
            icone: ShieldAlert,
            destaque: "red",
          },
          {
            titulo: "Histórico funcional",
            descricao: "Consulte registros funcionais conforme permissão.",
            href: "/sistema/central-rh",
            icone: UserCheck,
            destaque: "blue",
          },
        ],
      },
      {
        titulo: "Fiscalização e controle",
        descricao: "Ferramentas de transparência, prova e rastreabilidade.",
        itens: [
          {
            titulo: "Auditoria",
            descricao: "Consulte ações sensíveis registradas pelo sistema.",
            href: "/sistema/auditoria",
            icone: ClipboardCheck,
            destaque: "cyan",
          },
          {
            titulo: "Ocorrências",
            descricao: "Consulte registros operacionais autorizados.",
            href: "/sistema/central-ocorrencias",
            icone: Activity,
            destaque: "blue",
          },
          {
            titulo: "Relatórios",
            descricao: "Gere relatórios correcionais e administrativos.",
            href: "/sistema/central-relatorios",
            icone: FileText,
            destaque: "violet",
          },
          {
            titulo: "Legislação",
            descricao: "Acesse normas disciplinares e legislação aplicável.",
            href: "/sistema/central-legislacao",
            icone: Scale,
            destaque: "green",
          },
        ],
      },
    ],
  },

  ADMINISTRATIVA: {
    titulo: "Central Administrativa",
    subtitulo:
      "Atalhos para gestão de pessoas, documentos, patrimônio e comunicação.",
    etiqueta: "GESTÃO ADMINISTRATIVA",
    icone: FileText,
    grupos: [
      {
        titulo: "Pessoas e expediente",
        descricao: "Rotinas administrativas e funcionais da corporação.",
        itens: [
          {
            titulo: "Recursos Humanos",
            descricao: "Cadastros, afastamentos, férias e vida funcional.",
            href: "/sistema/central-rh",
            icone: Users,
            destaque: "cyan",
          },
          {
            titulo: "Central administrativa",
            descricao: "Ofícios, documentos e organização institucional.",
            href: "/sistema/central-perfil-administrativo",
            icone: FileText,
            destaque: "blue",
          },
          {
            titulo: "Escalas",
            descricao: "Apoie o planejamento de escalas e equipes.",
            href: "/sistema/escalas",
            icone: CalendarDays,
            destaque: "green",
          },
          {
            titulo: "Comunicação",
            descricao: "Publique e acompanhe comunicados internos.",
            href: "/sistema/comunicacao",
            icone: MessageCircle,
            destaque: "violet",
          },
        ],
      },
      {
        titulo: "Bens e informações",
        descricao: "Controle documental, patrimonial e de apoio.",
        itens: [
          {
            titulo: "Patrimônio",
            descricao: "Cadastre e acompanhe bens e movimentações.",
            href: "/sistema/central-patrimonio",
            icone: Boxes,
            destaque: "amber",
          },
          {
            titulo: "Frota",
            descricao: "Acompanhe documentos e situação das viaturas.",
            href: "/sistema/central-frota",
            icone: CarFront,
            destaque: "blue",
          },
          {
            titulo: "Relatórios",
            descricao: "Emita relatórios administrativos e gerenciais.",
            href: "/sistema/central-relatorios",
            icone: BarChart3,
            destaque: "cyan",
          },
          {
            titulo: "Portal Cidadão",
            descricao: "Acompanhe serviços e solicitações do cidadão.",
            href: "/sistema/portal-cidadao",
            icone: Landmark,
            destaque: "green",
          },
        ],
      },
    ],
  },

  DESENVOLVEDOR: {
    titulo: "Central Geral do Desenvolvedor",
    subtitulo:
      "Acesso consolidado às centrais por perfil e aos módulos de administração técnica.",
    etiqueta: "VISÃO GLOBAL DO SISTEMA",
    icone: BadgeCheck,
    grupos: [
      {
        titulo: "Visualizar centrais",
        descricao: "Abra a experiência correspondente a cada área.",
        itens: [
          {
            titulo: "Central do Guarda",
            descricao: "Visualize a experiência operacional do guarda.",
            href: "/sistema/central-guarda",
            icone: Shield,
            destaque: "green",
          },
          {
            titulo: "Central do Comando",
            descricao: "Visualize a experiência gerencial do comando.",
            href: "/sistema/central-comando",
            icone: ShieldCheck,
            destaque: "cyan",
          },
          {
            titulo: "Central da Corregedoria",
            descricao: "Visualize a área reservada da corregedoria.",
            href: "/sistema/central-corregedoria",
            icone: Gavel,
            destaque: "red",
          },
          {
            titulo: "Central Administrativa",
            descricao: "Visualize a experiência da área administrativa.",
            href: "/sistema/central-administrativa",
            icone: FileText,
            destaque: "blue",
          },
        ],
      },
      {
        titulo: "Administração do sistema",
        descricao: "Configuração, usuários, permissões e controle técnico.",
        itens: [
          {
            titulo: "Desenvolvedor",
            descricao: "Abra a central técnica do SIG-GCM Brasil.",
            href: "/sistema/desenvolvedor",
            icone: BadgeCheck,
            destaque: "violet",
          },
          {
            titulo: "Usuários",
            descricao: "Gerencie usuários, perfis e acessos.",
            href: "/sistema/usuarios",
            icone: Users,
            destaque: "cyan",
          },
          {
            titulo: "Permissões",
            descricao: "Configure permissões por perfil e município.",
            href: "/sistema/usuarios/permissoes",
            icone: ShieldCheck,
            destaque: "amber",
          },
          {
            titulo: "Configurações",
            descricao: "Acesse configurações gerais da plataforma.",
            href: "/sistema/configuracoes",
            icone: FileSearch,
            destaque: "blue",
          },
        ],
      },
    ],
  },

  CONSULTA: {
    titulo: "Central de Consulta",
    subtitulo:
      "Acesso simplificado às informações liberadas para o seu perfil.",
    etiqueta: "ACESSO SOMENTE PARA CONSULTA",
    icone: FileSearch,
    grupos: [
      {
        titulo: "Consultas disponíveis",
        descricao: "Áreas informativas liberadas pelas permissões do município.",
        itens: [
          {
            titulo: "Centro de Comando",
            descricao: "Consulte a visão geral disponibilizada.",
            href: "/sistema",
            icone: BarChart3,
            destaque: "cyan",
          },
          {
            titulo: "Legislação",
            descricao: "Consulte leis e normas institucionais.",
            href: "/sistema/central-legislacao",
            icone: Scale,
            destaque: "blue",
          },
          {
            titulo: "Relatórios",
            descricao: "Consulte relatórios autorizados.",
            href: "/sistema/central-relatorios",
            icone: FileText,
            destaque: "green",
          },
          {
            titulo: "Comunicação",
            descricao: "Acompanhe avisos e comunicados públicos.",
            href: "/sistema/comunicacao",
            icone: MessageCircle,
            destaque: "violet",
          },
        ],
      },
    ],
  },
};

const ESTILOS = {
  cyan: "border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300",
  blue: "border-blue-400/20 bg-blue-400/[0.06] text-blue-300",
  green: "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300",
  amber: "border-amber-400/20 bg-amber-400/[0.06] text-amber-300",
  red: "border-rose-400/20 bg-rose-400/[0.06] text-rose-300",
  violet: "border-violet-400/20 bg-violet-400/[0.06] text-violet-300",
};

function lerUsuario(): UsuarioLocal {
  if (typeof window === "undefined") return {};

  try {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  } catch {
    return {};
  }
}

export default function CentralPerfil({ tipo }: { tipo: TipoCentral }) {
  const configuracao = CONFIGURACOES[tipo];
  const IconePrincipal = configuracao.icone;
  const [usuario, setUsuario] = useState<UsuarioLocal>({});

  useEffect(() => {
    setUsuario(lerUsuario());
  }, []);

  const saudacao = useMemo(() => {
    const nome = String(usuario.nome || "Usuário").trim();
    const primeiroNome = nome.split(/\s+/)[0] || "Usuário";
    return primeiroNome;
  }, [usuario.nome]);

  return (
    <main className="min-h-screen bg-[#020b1c] px-4 py-5 text-white lg:px-7 lg:py-7">
      <div className="mx-auto w-full max-w-[1700px] space-y-6">
        <header className="overflow-hidden rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-[#06162d] via-[#041126] to-[#020b1c] shadow-2xl shadow-black/20">
          <div className="border-b border-white/5 px-5 py-5 lg:px-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300">
                  <IconePrincipal className="h-7 w-7" />
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-300">
                    {configuracao.etiqueta}
                  </p>
                  <h1 className="mt-1 text-2xl font-black tracking-tight text-white lg:text-3xl">
                    {configuracao.titulo}
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
                    {configuracao.subtitulo}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                <p className="text-xs text-slate-500">Sessão atual</p>
                <p className="mt-1 font-black text-white">Olá, {saudacao}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-cyan-300">
                  {usuario.perfil || tipo}
                  {usuario.matricula ? ` • ${usuario.matricula}` : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-px bg-white/5 sm:grid-cols-3">
            <ResumoTopo
              titulo="Central personalizada"
              descricao="Atalhos organizados para sua função"
              icone={BadgeCheck}
            />
            <ResumoTopo
              titulo="Permissões preservadas"
              descricao="Cada página continua validando seu acesso"
              icone={ShieldCheck}
            />
            <ResumoTopo
              titulo="Sistema original mantido"
              descricao="Nenhum módulo existente foi removido"
              icone={ClipboardCheck}
            />
          </div>
        </header>

        {configuracao.grupos.map((grupo) => (
          <section key={grupo.titulo} className="space-y-4">
            <div>
              <h2 className="text-lg font-black text-white">{grupo.titulo}</h2>
              <p className="mt-1 text-sm text-slate-500">{grupo.descricao}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {grupo.itens.map((item) => (
                <CardCentral key={`${grupo.titulo}-${item.href}-${item.titulo}`} item={item} />
              ))}
            </div>
          </section>
        ))}

        <div className="rounded-2xl border border-slate-800 bg-slate-950/35 px-5 py-4 text-sm text-slate-400">
          Esta central apenas organiza os acessos. As permissões, auditorias e
          regras dos módulos existentes continuam sendo aplicadas normalmente.
        </div>
      </div>
    </main>
  );
}

function ResumoTopo({
  titulo,
  descricao,
  icone: Icone,
}: {
  titulo: string;
  descricao: string;
  icone: LucideIcon;
}) {
  return (
    <div className="flex items-center gap-3 bg-[#041126] px-5 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06] text-cyan-300">
        <Icone className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="font-black text-white">{titulo}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
          {descricao}
        </p>
      </div>
    </div>
  );
}

function CardCentral({ item }: { item: ItemCentral }) {
  const Icone = item.icone;
  const destaque = item.destaque || "cyan";

  return (
    <Link
      href={item.href}
      className="group flex min-h-[165px] flex-col rounded-2xl border border-slate-800 bg-[#061326]/75 p-5 transition duration-200 hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-[#081a33]"
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${ESTILOS[destaque]}`}
        >
          <Icone className="h-6 w-6" />
        </div>
        <ArrowRight className="h-5 w-5 text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-300" />
      </div>

      <div className="mt-5">
        <h3 className="font-black text-white">{item.titulo}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          {item.descricao}
        </p>
      </div>
    </Link>
  );
}
