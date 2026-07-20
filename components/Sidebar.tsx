"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Accessibility,
  Award,
  BadgeDollarSign,
  BarChart3,
  Boxes,
  Brain,
  HardHat,
  HandHeart,
  Building2,
  CarFront,
  CalendarDays,
  CalendarClock,
  Calculator,
  ClipboardList,
  Clock3,
  ChevronDown,
  ChevronRight,
  Code2,
  Cog,
  FileText,
  FileSpreadsheet,
  Fingerprint,
  FolderLock,
  GraduationCap,
  HeartPulse,
  Gauge,
  GitBranch,
  Landmark,
  MapPinned,
  LayoutDashboard,
  PanelsTopLeft,
  PackageCheck,
  LogOut,
  Map,
  Menu,
  MessageCircle,
  PhoneCall,
  Scale,
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Star,
  Target,
  TimerReset,
  UsersRound,
  TriangleAlert,
  TrafficCone,
  Layers3,
  Users,
  X,
  UserRoundCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { supabase } from "@/lib/supabase";

type Perfil =
  | "DESENVOLVEDOR"
  | "ADMIN"
  | "COMANDANTE"
  | "DIRETOR"
  | "CMT_GUARNICAO"
  | "PLANTONISTA"
  | "CORREGEDOR"
  | "GUARDA"
  | "CONSULTA";

type UsuarioSidebar = {
  id: string;
  nome: string;
  matricula?: string;
  email: string;
  perfil: Perfil;
  municipio_id?: number;
  foto_url?: string;
};

type ItemMenuConfig = {
  href: string;
  icone: LucideIcon;
  titulo: string;
  modulos: string[];
  rotasAtivas: string[];
};

type GrupoMenuConfig = {
  titulo: string;
  itens: ItemMenuConfig[];
};

const CHAVE_FAVORITOS = "sig_sidebar_favoritos";
const CHAVE_GRUPOS = "sig_sidebar_grupos";

const GRUPOS_MENU: GrupoMenuConfig[] = [
  {
    titulo: "Principal",
    itens: [
      {
        href: "/sistema/minha-central",
        icone: PanelsTopLeft,
        titulo: "Minha Central",
        modulos: ["minha_central"],
        rotasAtivas: [
          "/sistema/minha-central",
          "/sistema/central-guarda",
          "/sistema/central-comando",
          "/sistema/central-corregedoria",
          "/sistema/central-perfil-administrativo",
          "/sistema/central-perfis",
          "/sistema/central-consulta",
        ],
      },
      {
        href: "/sistema/meu-plantao",
        icone: CalendarDays,
        titulo: "Meu Plantão",
        modulos: ["meu_plantao"],
        rotasAtivas: ["/sistema/meu-plantao"],
      },
      {
        href: "/sistema",
        icone: LayoutDashboard,
        titulo: "Centro de Comando",
        modulos: ["dashboard"],
        rotasAtivas: ["/sistema"],
      },
    ],
  },
  {
    titulo: "Operacional",
    itens: [
      {
        href: "/sistema/central-ocorrencias",
        icone: Activity,
        titulo: "Ocorrências",
        modulos: ["ocorrencias"],
        rotasAtivas: [
          "/sistema/central-ocorrencias",
          "/sistema/ocorrencias",
        ],
      },
      {
        href: "/sistema/chamados",
        icone: PhoneCall,
        titulo: "Chamados",
        modulos: ["chamados"],
        rotasAtivas: ["/sistema/chamados"],
      },
      {
        href: "/sistema/operacional",
        icone: Shield,
        titulo: "Centro Operacional",
        modulos: ["operacional"],
        rotasAtivas: [
          "/sistema/operacional",
          "/sistema/patrulhamento",
          "/sistema/abordagens",
          "/sistema/operacoes",
          "/sistema/apoios",
          "/sistema/eventos-operacionais",
          "/sistema/barreiras",
        ],
      },
      {
        href: "/sistema/central-inteligencia",
        icone: Brain,
        titulo: "Inteligência",
        modulos: ["estatisticas"],
        rotasAtivas: [
          "/sistema/central-inteligencia",
          "/sistema/inteligencia",
          "/sistema/estatisticas",
          "/sistema/sigia",
          "/sistema/ia-",
        ],
      },
    ],
  },
  {
    titulo: "Gestão da Guarda",
    itens: [
      {
        href: "/sistema/escalas/permutas",
        icone: Activity,
        titulo: "Permutas",
        modulos: ["permutas"],
        rotasAtivas: ["/sistema/escalas/permutas"],
      },
      {
        href: "/sistema/ordens-servico",
        icone: ClipboardList,
        titulo: "Ordens de Serviço",
        modulos: ["ordens_servico", "escalas", "operacional"],
        rotasAtivas: ["/sistema/ordens-servico"],
      },
      {
        href: "/sistema/corregedoria/processos",
        icone: FolderLock,
        titulo: "Sindicâncias e PAD",
        modulos: ["corregedoria", "sindicancias_pad"],
        rotasAtivas: ["/sistema/corregedoria/processos"],
      },
      {
        href: "/sistema/banco-horas",
        icone: Clock3,
        titulo: "Banco de Horas",
        modulos: ["guardas", "banco_horas"],
        rotasAtivas: ["/sistema/banco-horas", "/sistema/guardas"],
      },
      {
        href: "/sistema/escalas/ferias-licencas",
        icone: CalendarDays,
        titulo: "Férias e Licenças",
        modulos: ["escalas", "guardas"],
        rotasAtivas: ["/sistema/escalas/ferias-licencas", "/sistema/guardas"],
      },
      {
        href: "/sistema/escalas/extras",
        icone: CalendarClock,
        titulo: "Escalas Extraordinárias",
        modulos: ["escalas", "escalas_extras", "operacional"],
        rotasAtivas: ["/sistema/escalas/extras"],
      },
      {
        href: "/sistema/ponto-eletronico",
        icone: Fingerprint,
        titulo: "Ponto Eletrônico",
        modulos: ["guardas", "escalas", "ponto_eletronico"],
        rotasAtivas: ["/sistema/ponto-eletronico"],
      },
      {
        href: "/sistema/folha-ponto",
        icone: FileSpreadsheet,
        titulo: "Folha de Ponto",
        modulos: ["guardas", "escalas", "ponto_eletronico"],
        rotasAtivas: ["/sistema/folha-ponto"],
      },
      {
        href: "/sistema/avaliacoes-desempenho",
        icone: Award,
        titulo: "Avaliação de Desempenho",
        modulos: ["guardas", "avaliacoes_desempenho"],
        rotasAtivas: ["/sistema/avaliacoes-desempenho"],
      },
      {
        href: "/sistema/pdi",
        icone: Target,
        titulo: "Plano de Desenvolvimento",
        modulos: ["guardas", "pdi"],
        rotasAtivas: ["/sistema/pdi"],
      },
      {
        href: "/sistema/capacitacoes",
        icone: GraduationCap,
        titulo: "Cursos e Capacitações",
        modulos: ["guardas", "capacitacoes"],
        rotasAtivas: ["/sistema/capacitacoes"],
      },
      {
        href: "/sistema/treinamentos-obrigatorios",
        icone: ShieldAlert,
        titulo: "Treinamentos Obrigatórios",
        modulos: ["guardas", "capacitacoes", "treinamentos_obrigatorios"],
        rotasAtivas: ["/sistema/treinamentos-obrigatorios"],
      },
      {
        href: "/sistema/dimensionamento-efetivo",
        icone: Calculator,
        titulo: "Dimensionamento do Efetivo",
        modulos: ["guardas", "quadro_vagas", "lotacao", "escalas"],
        rotasAtivas: ["/sistema/dimensionamento-efetivo"],
      },
      {
        href: "/sistema/mapa-estrategico-efetivo",
        icone: Map,
        titulo: "Mapa Estratégico do Efetivo",
        modulos: ["guardas", "escalas", "quadro_vagas", "lotacao"],
        rotasAtivas: ["/sistema/mapa-estrategico-efetivo"],
      },
      {
        href: "/sistema/quadro-vagas",
        icone: MapPinned,
        titulo: "Quadro de Vagas e Lotação",
        modulos: ["guardas", "quadro_vagas", "lotacao"],
        rotasAtivas: ["/sistema/quadro-vagas"],
      },
      {
        href: "/sistema/epi-epc",
        icone: PackageCheck,
        titulo: "EPI e EPC",
        modulos: ["patrimonio", "guardas", "seguranca_trabalho"],
        rotasAtivas: ["/sistema/epi-epc"],
      },
      {
        href: "/sistema/acidentes-cat",
        icone: TriangleAlert,
        titulo: "Acidentes e CAT",
        modulos: ["guardas", "seguranca_trabalho"],
        rotasAtivas: ["/sistema/acidentes-cat"],
      },
      {
        href: "/sistema/seguranca-trabalho",
        icone: HardHat,
        titulo: "Segurança do Trabalho",
        modulos: ["guardas", "patrimonio", "frota", "treinamentos"],
        rotasAtivas: ["/sistema/seguranca-trabalho"],
      },
      {
        href: "/sistema/saude-mental",
        icone: Brain,
        titulo: "Saúde Mental",
        modulos: ["guardas", "avaliacoes", "ferias_licencas"],
        rotasAtivas: ["/sistema/saude-mental"],
      },
      {
        href: "/sistema/previdencia-aposentadoria",
        icone: TimerReset,
        titulo: "Previdência e Aposentadoria",
        modulos: ["guardas", "beneficios_servidor"],
        rotasAtivas: ["/sistema/previdencia-aposentadoria"],
      },
      {
        href: "/sistema/pensionistas-dependentes",
        icone: UsersRound,
        titulo: "Pensionistas e Dependentes",
        modulos: ["guardas", "beneficios_servidor", "assistencia_social"],
        rotasAtivas: ["/sistema/pensionistas-dependentes"],
      },
      {
        href: "/sistema/beneficios-servidor",
        icone: BadgeDollarSign,
        titulo: "Benefícios do Servidor",
        modulos: ["guardas", "assistencia_social"],
        rotasAtivas: ["/sistema/beneficios-servidor"],
      },
      {
        href: "/sistema/assistencia-social",
        icone: HandHeart,
        titulo: "Assistência Social",
        modulos: ["guardas", "saude_ocupacional", "saude_mental"],
        rotasAtivas: ["/sistema/assistencia-social"],
      },
      {
        href: "/sistema/readaptacao-funcional",
        icone: Accessibility,
        titulo: "Readaptação Funcional",
        modulos: ["guardas", "saude_ocupacional", "ferias_licencas"],
        rotasAtivas: ["/sistema/readaptacao-funcional"],
      },
      {
        href: "/sistema/saude-ocupacional",
        icone: HeartPulse,
        titulo: "Saúde Ocupacional",
        modulos: ["guardas", "ferias_licencas", "avaliacoes"],
        rotasAtivas: ["/sistema/saude-ocupacional"],
      },
      {
        href: "/sistema/estagio-probatorio",
        icone: UserRoundCheck,
        titulo: "Estágio Probatório",
        modulos: ["guardas", "avaliacoes", "pdi", "plano_carreira"],
        rotasAtivas: ["/sistema/estagio-probatorio"],
      },
      {
        href: "/sistema/plano-carreira",
        icone: GitBranch,
        titulo: "Plano de Carreira",
        modulos: ["guardas", "plano_carreira"],
        rotasAtivas: ["/sistema/plano-carreira"],
      },
      {
        href: "/sistema/competencias",
        icone: Gauge,
        titulo: "Competências e Habilidades",
        modulos: ["guardas", "competencias"],
        rotasAtivas: ["/sistema/competencias"],
      },
      {
        href: "/sistema/central-rh",
        icone: Users,
        titulo: "RH",
        modulos: ["guardas"],
        rotasAtivas: [
          "/sistema/central-rh",
          "/sistema/rh",
          "/sistema/guardas",
          "/sistema/escalas",
          "/sistema/advertencias",
          "/sistema/ferias-licencas",
          "/sistema/banco-horas",
        ],
      },
      {
        href: "/sistema/central-frota",
        icone: CarFront,
        titulo: "Frota",
        modulos: ["frota"],
        rotasAtivas: [
          "/sistema/central-frota",
          "/sistema/frota",
          "/sistema/viaturas",
          "/sistema/abastecimentos",
        ],
      },
      {
        href: "/sistema/armamentos",
        icone: ShieldCheck,
        titulo: "Armamento",
        modulos: ["armamentos"],
        rotasAtivas: [
          "/sistema/armamentos",
          "/sistema/gestao-armamento",
        ],
      },
      {
        href: "/sistema/central-patrimonio",
        icone: Boxes,
        titulo: "Patrimônio",
        modulos: ["patrimonio"],
        rotasAtivas: [
          "/sistema/central-patrimonio",
          "/sistema/patrimonio",
          "/sistema/almoxarifado",
        ],
      },
    ],
  },
  {
    titulo: "Jurídico e Documentos",
    itens: [
      {
        href: "/sistema/central-legislacao",
        icone: Scale,
        titulo: "Central de Legislação",
        modulos: ["legislacao"],
        rotasAtivas: [
          "/sistema/central-legislacao",
          "/sistema/legislacao",
          "/sistema/ia-juridica",
        ],
      },
      {
        href: "/sistema/central-relatorios",
        icone: FileText,
        titulo: "Relatórios",
        modulos: ["relatorios"],
        rotasAtivas: [
          "/sistema/central-relatorios",
          "/sistema/relatorios",
        ],
      },
      {
        href: "/sistema/relatorios/frequencia-produtividade",
        icone: BarChart3,
        titulo: "Frequência e Produtividade",
        modulos: ["relatorios", "guardas", "ponto_eletronico"],
        rotasAtivas: [
          "/sistema/relatorios/frequencia-produtividade",
        ],
      },
    ],
  },
  {
    titulo: "Comunicação e Cidadão",
    itens: [
      {
        href: "/sistema/portal-cidadao",
        icone: Landmark,
        titulo: "Portal Cidadão",
        modulos: ["portal_cidadao"],
        rotasAtivas: [
          "/sistema/portal-cidadao",
          "/sistema/central-cidadao",
        ],
      },

{
  href: "/sistema/central-feeds",
  icone: MessageCircle,
  titulo: "Central de Feeds",
  modulos: ["avisos"],
  rotasAtivas: [
    "/sistema/central-feeds",
    "/sistema/feed-sig",
    "/sistema/feed-brasil",
    "/sistema/blog-operacional",
    "/sistema/avisos",
    "/sistema/notificacoes",
    "/sistema/agenda-institucional",
    "/sistema/atualizacoes",
  ],
},

      {
        href: "/sistema/comunicacao",
        icone: MessageCircle,
        titulo: "Comunicação",
        modulos: ["avisos"],
        rotasAtivas: [
          "/sistema/comunicacao",
          "/sistema/central-comunicacao",
          "/sistema/chat",
          "/sistema/avisos",
          "/sistema/notificacoes",
          "/sistema/blog-operacional",
          "/sistema/agenda-institucional",
          "/sistema/feed-sig",
        ],
      },
    ],
  },
  {
    titulo: "Módulos Estratégicos",
    itens: [
      {
        href: "/sistema/central-modulos",
        icone: Layers3,
        titulo: "Central de Módulos",
        modulos: ["dashboard", "operacional"],
        rotasAtivas: [
          "/sistema/central-modulos",
          "/sistema/ambiental",
          "/sistema/ronda-escolar",
          "/sistema/violencia-domestica",
          "/sistema/videomonitoramento",
          "/sistema/defesa-civil",
          "/sistema/canil",
          "/sistema/drones",
          "/sistema/eventos-publicos",
        ],
      },
      {
        href: "/sistema/transito",
        icone: TrafficCone,
        titulo: "SIG Trânsito",
        modulos: ["operacional", "transito"],
        rotasAtivas: ["/sistema/transito"],
      },
    ],
  },
  {
    titulo: "Administração",
    itens: [
      {
        href: "/sistema/central-administrativa",
        icone: Building2,
        titulo: "Central Administrativa",
        modulos: ["central_administrativa"],
        rotasAtivas: [
          "/sistema/central-administrativa",
          "/sistema/oficios",
          "/sistema/exportador-dados",
        ],
      },
      {
        href: "/sistema/administracao",
        icone: ShieldCheck,
        titulo: "Administração",
        modulos: ["administracao"],
        rotasAtivas: ["/sistema/administracao"],
      },
      {
        href: "/sistema/configuracoes",
        icone: Cog,
        titulo: "Configurações",
        modulos: ["configuracoes"],
        rotasAtivas: ["/sistema/configuracoes"],
      },
      {
        href: "/sistema/desenvolvedor",
        icone: Code2,
        titulo: "Desenvolvedor",
        modulos: ["desenvolvedor"],
        rotasAtivas: ["/sistema/desenvolvedor"],
      },
    ],
  },
];

function rotaAtiva(pathname: string, item: ItemMenuConfig) {
  if (item.href === "/sistema") {
    return pathname === "/sistema";
  }

  return item.rotasAtivas.some((rota) =>
    pathname.startsWith(rota)
  );
}

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join("");
}

export default function Sidebar({
  usuario,
}: {
  usuario: UsuarioSidebar | null;
}) {
  const pathname = usePathname();

  const [aberto, setAberto] = useState(false);
  const [menuCompacto, setMenuCompacto] = useState(false);
  const [carregandoMenu, setCarregandoMenu] = useState(true);
  const [erroMenu, setErroMenu] = useState("");
  const [modulosPermitidos, setModulosPermitidos] =
    useState<Set<string>>(new Set());
  const [perfilServidor, setPerfilServidor] = useState("");
  const [municipioNome, setMunicipioNome] = useState("");
  const [brasaoMunicipio, setBrasaoMunicipio] = useState(
    "/brasoes/sig-gcm-logo.png"
  );
  const [busca, setBusca] = useState("");
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set());
  const [gruposAbertos, setGruposAbertos] = useState<Set<string>>(
    new Set(["Principal", "Operacional"])
  );

  useEffect(() => {
    try {
      const favoritosSalvos = JSON.parse(
        localStorage.getItem(CHAVE_FAVORITOS) || "[]"
      ) as string[];

      const gruposSalvos = JSON.parse(
        localStorage.getItem(CHAVE_GRUPOS) || "[]"
      ) as string[];

      setFavoritos(new Set(favoritosSalvos));

      if (gruposSalvos.length > 0) {
        setGruposAbertos(new Set(gruposSalvos));
      }
    } catch {
      setFavoritos(new Set());
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    const controller = new AbortController();

    async function carregarMenu() {
      setCarregandoMenu(true);
      setErroMenu("");

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const token = session?.access_token;

        if (!token) {
          localStorage.removeItem("usuarioLogado");
          window.location.replace("/login");
          return;
        }

        const resposta = await fetch("/api/permissoes/menu", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
          signal: controller.signal,
        });

        const retorno = await resposta.json().catch(() => null);

        if (!ativo) return;

        if (!resposta.ok) {
          if (resposta.status === 401) {
            localStorage.removeItem("usuarioLogado");
            window.location.replace("/login");
            return;
          }

          setErroMenu(
            retorno?.erro || "Não foi possível carregar o menu."
          );
          setModulosPermitidos(new Set());
          return;
        }

        setPerfilServidor(String(retorno?.perfil || ""));
        setMunicipioNome(
          String(retorno?.municipio_nome || "Município")
        );
        setBrasaoMunicipio(
          String(retorno?.brasao_gcm || "").trim() ||
            "/brasoes/sig-gcm-logo.png"
        );
        setModulosPermitidos(
          new Set(
            Array.isArray(retorno?.modulos)
              ? retorno.modulos.map((modulo: unknown) =>
                  String(modulo).trim().toLowerCase()
                )
              : []
          )
        );
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Erro ao carregar permissões do menu:",
          error
        );

        if (ativo) {
          setErroMenu("Não foi possível carregar o menu.");
          setModulosPermitidos(new Set());
        }
      } finally {
        if (ativo) {
          setCarregandoMenu(false);
        }
      }
    }

    void carregarMenu();

    return () => {
      ativo = false;
      controller.abort();
    };
  }, [usuario?.id]);

  const gruposVisiveis = useMemo(() => {
    const desenvolvedor = perfilServidor === "DESENVOLVEDOR";
    const termo = busca.trim().toLowerCase();

    return GRUPOS_MENU.map((grupo) => ({
      ...grupo,
      itens: grupo.itens.filter((item) => {
        const permitido =
          (item.href === "/sistema/minha-central" || item.href === "/sistema/meu-plantao") ||
          desenvolvedor ||
          item.modulos.some((modulo) =>
            modulosPermitidos.has(modulo)
          );

        const correspondeBusca =
          !termo ||
          item.titulo.toLowerCase().includes(termo) ||
          grupo.titulo.toLowerCase().includes(termo);

        return permitido && correspondeBusca;
      }),
    })).filter((grupo) => grupo.itens.length > 0);
  }, [busca, modulosPermitidos, perfilServidor]);

  const itensFavoritos = useMemo(() => {
    return gruposVisiveis
      .flatMap((grupo) => grupo.itens)
      .filter((item) => favoritos.has(item.href));
  }, [favoritos, gruposVisiveis]);

  useEffect(() => {
    const grupoAtivo = GRUPOS_MENU.find((grupo) =>
      grupo.itens.some((item) => rotaAtiva(pathname, item))
    );

    if (!grupoAtivo) return;

    setGruposAbertos((atual) => {
      if (atual.has(grupoAtivo.titulo)) return atual;

      const novo = new Set(atual);
      novo.add(grupoAtivo.titulo);
      return novo;
    });
  }, [pathname]);

  async function sair() {
    if (!confirm("Deseja realmente sair do sistema?")) {
      return;
    }

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro ao sair:", error);
    }

    localStorage.removeItem("usuarioLogado");
    sessionStorage.clear();
    window.location.replace("/login");
  }

  function fecharMenu() {
    setAberto(false);
  }

  function alternarFavorito(href: string) {
    setFavoritos((atual) => {
      const novo = new Set(atual);

      if (novo.has(href)) {
        novo.delete(href);
      } else {
        novo.add(href);
      }

      localStorage.setItem(
        CHAVE_FAVORITOS,
        JSON.stringify(Array.from(novo))
      );

      return novo;
    });
  }

  function alternarGrupo(titulo: string) {
    setGruposAbertos((atual) => {
      const novo = new Set(atual);

      if (novo.has(titulo)) {
        novo.delete(titulo);
      } else {
        novo.add(titulo);
      }

      localStorage.setItem(
        CHAVE_GRUPOS,
        JSON.stringify(Array.from(novo))
      );

      return novo;
    });
  }

  const perfilExibido =
    perfilServidor || usuario?.perfil || "";

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-cyan-400/10 bg-[#020b1c]/95 px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={brasaoMunicipio}
            onError={(event) => {
              event.currentTarget.src =
                "/brasoes/sig-gcm-logo.png";
            }}
            alt="Brasão GCM"
            className="h-12 w-12 shrink-0 object-contain"
          />

          <div className="min-w-0">
            <h1 className="truncate font-black text-white">
              SIG-GCM Brasil
            </h1>
            <p className="truncate text-xs text-slate-400">
              {municipioNome || "Município"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setAberto(!aberto)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
          aria-label={aberto ? "Fechar menu" : "Abrir menu"}
        >
          {aberto ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {aberto ? (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={fecharMenu}
        />
      ) : null}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen flex-col
          border-r border-cyan-400/10 bg-[#020b1c]/95 text-white
          shadow-[0_0_50px_rgba(2,132,199,0.10)] backdrop-blur-xl
          transition-all duration-300 md:sticky
          ${menuCompacto ? "md:w-20" : "w-[88vw] max-w-80 md:w-72"}
          ${
            aberto
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        <div className="flex items-center justify-between border-b border-slate-800/80 px-3 py-3">
          {!menuCompacto ? (
            <div className="flex min-w-0 items-center gap-3">
              <img
                src={brasaoMunicipio}
                onError={(event) => {
                  event.currentTarget.src =
                    "/brasoes/sig-gcm-logo.png";
                }}
                alt="Brasão GCM"
                className="h-11 w-11 shrink-0 object-contain"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-black">
                  SIG-GCM Brasil
                </p>
                <p className="truncate text-xs text-slate-500">
                  {municipioNome || "Município"}
                </p>
              </div>
            </div>
          ) : (
            <img
              src={brasaoMunicipio}
              onError={(event) => {
                event.currentTarget.src =
                  "/brasoes/sig-gcm-logo.png";
              }}
              alt="Brasão GCM"
              className="mx-auto h-10 w-10 object-contain"
            />
          )}

          <button
            type="button"
            onClick={() => setMenuCompacto(!menuCompacto)}
            className="hidden rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white md:inline-flex"
            title={
              menuCompacto ? "Expandir menu" : "Recolher menu"
            }
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {usuario ? (
          <div
            className={`border-b border-slate-800/80 bg-slate-950/30 p-4 ${
              menuCompacto ? "px-2" : ""
            }`}
          >
            <div
              className={`flex items-center gap-3 ${
                menuCompacto ? "justify-center" : ""
              }`}
            >
              {usuario.foto_url ? (
                <img
                  src={usuario.foto_url}
                  alt={usuario.nome}
                  className="h-11 w-11 shrink-0 rounded-xl border border-cyan-400/20 object-cover"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 font-black text-cyan-200">
                  {iniciais(usuario.nome)}
                </div>
              )}

              {!menuCompacto ? (
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.8)]" />
                    <p className="truncate text-sm font-black">
                      {usuario.nome}
                    </p>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {perfilExibido}
                    {usuario.matricula
                      ? ` • ${usuario.matricula}`
                      : ""}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {!menuCompacto ? (
          <div className="border-b border-slate-800/80 p-3">
            <div className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-950/70 px-3">
              <Search className="h-4 w-4 shrink-0 text-slate-500" />
              <input
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Pesquisar módulo..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
              />
              {busca ? (
                <button
                  type="button"
                  onClick={() => setBusca("")}
                  className="text-slate-500 hover:text-white"
                  aria-label="Limpar pesquisa"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
          {carregandoMenu ? (
            <div className="p-5 text-center text-sm text-slate-400">
              Carregando menu...
            </div>
          ) : erroMenu ? (
            <div className="m-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {erroMenu}
            </div>
          ) : gruposVisiveis.length === 0 ? (
            <div className="p-5 text-center text-sm text-slate-400">
              Nenhum módulo disponível para este perfil.
            </div>
          ) : (
            <>
              {itensFavoritos.length > 0 && !busca ? (
                <div className="mb-3">
                  <GrupoTitulo
                    titulo="Favoritos"
                    compacto={menuCompacto}
                    aberto
                    fixo
                  />

                  <div className="mt-1 space-y-1">
                    {itensFavoritos.map((item) => (
                      <ItemMenu
                        key={`favorito-${item.href}`}
                        item={item}
                        fecharMenu={fecharMenu}
                        compacto={menuCompacto}
                        ativo={rotaAtiva(pathname, item)}
                        favorito
                        alternarFavorito={alternarFavorito}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {gruposVisiveis.map((grupo) => {
                const abertoGrupo =
                  Boolean(busca) ||
                  gruposAbertos.has(grupo.titulo);

                return (
                  <div key={grupo.titulo} className="mb-2">
                    <button
                      type="button"
                      onClick={() =>
                        !menuCompacto &&
                        alternarGrupo(grupo.titulo)
                      }
                      className="w-full"
                    >
                      <GrupoTitulo
                        titulo={grupo.titulo}
                        compacto={menuCompacto}
                        aberto={abertoGrupo}
                      />
                    </button>

                    {abertoGrupo ? (
                      <div className="mt-1 space-y-1">
                        {grupo.itens.map((item) => (
                          <ItemMenu
                            key={item.href}
                            item={item}
                            fecharMenu={fecharMenu}
                            compacto={menuCompacto}
                            ativo={rotaAtiva(pathname, item)}
                            favorito={favoritos.has(item.href)}
                            alternarFavorito={alternarFavorito}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </>
          )}
        </nav>

        <div className="shrink-0 border-t border-slate-800/80 bg-slate-950/50 p-3">
          {!menuCompacto ? (
            <div className="mb-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Versão</span>
                <strong className="text-slate-300">1.0 Final</strong>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-500">Ambiente</span>
                <strong className="text-emerald-300">Operacional</strong>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={sair}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 font-black text-red-200 transition hover:bg-red-500/20"
          >
            <LogOut className="h-5 w-5" />
            {!menuCompacto ? "Sair do sistema" : null}
          </button>
        </div>
      </aside>
    </>
  );
}

function GrupoTitulo({
  titulo,
  compacto,
  aberto,
  fixo = false,
}: {
  titulo: string;
  compacto: boolean;
  aberto: boolean;
  fixo?: boolean;
}) {
  if (compacto) {
    return (
      <div className="mx-auto my-2 h-px w-8 bg-slate-800" />
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-slate-900/70">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
        {titulo}
      </p>

      {fixo ? (
        <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
      ) : aberto ? (
        <ChevronDown className="h-4 w-4 text-slate-600" />
      ) : (
        <ChevronRight className="h-4 w-4 text-slate-600" />
      )}
    </div>
  );
}

function ItemMenu({
  item,
  fecharMenu,
  compacto,
  ativo,
  favorito,
  alternarFavorito,
}: {
  item: ItemMenuConfig;
  fecharMenu: () => void;
  compacto: boolean;
  ativo: boolean;
  favorito: boolean;
  alternarFavorito: (href: string) => void;
}) {
  const Icone = item.icone;

  return (
    <div className="group relative">
      <Link
        onClick={fecharMenu}
        href={item.href}
        className={`
          relative flex min-h-12 w-full items-center gap-3 overflow-hidden
          rounded-xl border px-3 text-sm font-bold transition-all duration-200
          ${
            ativo
              ? "border-cyan-400/25 bg-cyan-400/10 text-white shadow-[inset_3px_0_0_#22d3ee,0_0_22px_rgba(34,211,238,.06)]"
              : "border-transparent text-slate-300 hover:border-slate-700/70 hover:bg-slate-900/80 hover:text-white"
          }
          ${compacto ? "justify-center px-0" : ""}
        `}
        title={item.titulo}
      >
        <Icone
          className={`h-5 w-5 shrink-0 ${
            ativo ? "text-cyan-300" : "text-blue-400"
          }`}
        />

        {!compacto ? (
          <>
            <span className="min-w-0 flex-1 truncate">
              {item.titulo}
            </span>

            {ativo ? (
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.9)]" />
            ) : null}
          </>
        ) : null}
      </Link>

      {!compacto ? (
        <button
          type="button"
          onClick={() => alternarFavorito(item.href)}
          className={`absolute right-8 top-1/2 -translate-y-1/2 rounded-md p-1 opacity-0 transition group-hover:opacity-100 ${
            favorito
              ? "text-amber-300 opacity-100"
              : "text-slate-600 hover:text-amber-300"
          }`}
          title={
            favorito
              ? "Remover dos favoritos"
              : "Adicionar aos favoritos"
          }
          aria-label={
            favorito
              ? "Remover dos favoritos"
              : "Adicionar aos favoritos"
          }
        >
          <Star
            className={`h-4 w-4 ${
              favorito ? "fill-current" : ""
            }`}
          />
        </button>
      ) : null}
    </div>
  );
}