"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  Boxes,
  Brain,
  Building2,
  CarFront,
  Code2,
  Cog,
  FileText,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  PhoneCall,
  Scale,
  Shield,
  ShieldCheck,
  Users,
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

const GRUPOS_MENU: GrupoMenuConfig[] = [
  {
    titulo: "Principal",
    itens: [
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

function rotaAtiva(
  pathname: string,
  item: ItemMenuConfig
) {
  if (item.href === "/sistema") {
    return pathname === "/sistema";
  }

  return item.rotasAtivas.some((rota) =>
    pathname.startsWith(rota)
  );
}

export default function Sidebar({
  usuario,
}: {
  usuario: UsuarioSidebar | null;
}) {
  const pathname = usePathname();

  const [aberto, setAberto] = useState(false);
  const [menuCompacto, setMenuCompacto] =
    useState(false);
  const [carregandoMenu, setCarregandoMenu] =
    useState(true);
  const [erroMenu, setErroMenu] = useState("");
  const [modulosPermitidos, setModulosPermitidos] =
    useState<Set<string>>(new Set());
  const [perfilServidor, setPerfilServidor] =
    useState("");
  const [municipioNome, setMunicipioNome] =
    useState("");
  const [brasaoMunicipio, setBrasaoMunicipio] =
    useState("/brasoes/sig-gcm-logo.png");

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

        const resposta = await fetch(
          "/api/permissoes/menu",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const retorno = await resposta
          .json()
          .catch(() => null);

        if (!ativo) {
          return;
        }

        if (!resposta.ok) {
          if (resposta.status === 401) {
            localStorage.removeItem(
              "usuarioLogado"
            );
            window.location.replace("/login");
            return;
          }

          setErroMenu(
            retorno?.erro ||
              "Não foi possível carregar o menu."
          );
          setModulosPermitidos(new Set());
          return;
        }

        setPerfilServidor(
          String(retorno?.perfil || "")
        );

        setMunicipioNome(
          String(
            retorno?.municipio_nome ||
              "Município"
          )
        );

        setBrasaoMunicipio(
          String(retorno?.brasao_gcm || "").trim() ||
            "/brasoes/sig-gcm-logo.png"
        );

        setModulosPermitidos(
          new Set(
            Array.isArray(retorno?.modulos)
              ? retorno.modulos.map((modulo: unknown) =>
                  String(modulo)
                    .trim()
                    .toLowerCase()
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
          setErroMenu(
            "Não foi possível carregar o menu."
          );
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
    const desenvolvedor =
      perfilServidor === "DESENVOLVEDOR";

    return GRUPOS_MENU.map((grupo) => ({
      ...grupo,
      itens: grupo.itens.filter(
        (item) =>
          desenvolvedor ||
          item.modulos.some((modulo) =>
            modulosPermitidos.has(modulo)
          )
      ),
    })).filter((grupo) => grupo.itens.length > 0);
  }, [modulosPermitidos, perfilServidor]);

  async function sair() {
    if (
      !confirm("Deseja realmente sair do sistema?")
    ) {
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

  const perfilExibido =
    perfilServidor || usuario?.perfil || "";

  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-800 bg-[#020b1c] p-4 md:hidden">
        <div className="flex items-center gap-3">
          <img
            src={brasaoMunicipio}
            onError={(event) => {
              event.currentTarget.src =
                "/brasoes/sig-gcm-logo.png";
            }}
            alt="Brasão GCM"
            className="h-16 w-16 object-contain"
          />

          <div>
            <h1 className="font-bold text-white">
              SIG-GCM
            </h1>

            <p className="text-xs text-slate-400">
              {municipioNome || "Município"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setAberto(!aberto)}
          className="rounded-xl bg-blue-700 px-4 py-3 font-bold text-white"
        >
          ☰ Menu
        </button>
      </div>

      {aberto ? (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={fecharMenu}
        />
      ) : null}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-80 flex-col
          border-r border-blue-900/40 bg-slate-950/80 text-white
          shadow-[0_0_30px_rgba(0,80,255,0.15)] backdrop-blur-xl
          transition-all duration-300 md:sticky
          ${menuCompacto ? "md:w-20" : "md:w-72"}
          ${
            aberto
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        <div className="hidden justify-end border-b border-slate-800 p-2 md:flex">
          <button
            type="button"
            onClick={() =>
              setMenuCompacto(!menuCompacto)
            }
            className="text-xl text-white hover:text-blue-400"
            title={
              menuCompacto
                ? "Expandir menu"
                : "Recolher menu"
            }
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {usuario ? (
          <div
            className={`border-b border-slate-800 bg-slate-950/40 p-5 ${
              menuCompacto ? "text-center" : ""
            }`}
          >
            <div className="flex flex-col items-center">
              <img
                src={brasaoMunicipio}
                onError={(event) => {
                  event.currentTarget.src =
                    "/brasoes/sig-gcm-logo.png";
                }}
                alt="Brasão GCM"
                className={
                  menuCompacto
                    ? "h-12 w-12 object-contain"
                    : "mb-4 h-40 w-40 object-contain"
                }
              />

              {!menuCompacto ? (
                <>
                  <p className="text-center text-lg font-black">
                    {usuario.nome}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Matrícula:{" "}
                    {usuario.matricula || "-"}
                  </p>

                  <p className="text-xs font-bold text-blue-400">
                    Perfil: {perfilExibido}
                  </p>
                </>
              ) : null}
            </div>
          </div>
        ) : null}

        <nav className="min-h-0 flex-1 overflow-y-auto p-0">
          {carregandoMenu ? (
            <div className="p-5 text-center text-sm text-slate-400">
              Carregando menu...
            </div>
          ) : erroMenu ? (
            <div className="m-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {erroMenu}
            </div>
          ) : gruposVisiveis.length === 0 ? (
            <div className="p-5 text-center text-sm text-slate-400">
              Nenhum módulo disponível para este
              perfil.
            </div>
          ) : (
            gruposVisiveis.map((grupo) => (
              <div key={grupo.titulo}>
                <GrupoMenu
                  titulo={grupo.titulo}
                  compacto={menuCompacto}
                />

                {grupo.itens.map((item) => (
                  <ItemMenu
                    key={item.href}
                    href={item.href}
                    icone={item.icone}
                    titulo={item.titulo}
                    fecharMenu={fecharMenu}
                    compacto={menuCompacto}
                    ativo={rotaAtiva(
                      pathname,
                      item
                    )}
                  />
                ))}
              </div>
            ))
          )}
        </nav>

        <div className="shrink-0 border-t border-slate-800 bg-slate-950 p-3">
          <div
            className={`mb-4 flex items-center gap-3 ${
              menuCompacto
                ? "justify-center"
                : ""
            }`}
          >
            <img
              src={brasaoMunicipio}
              onError={(event) => {
                event.currentTarget.src =
                  "/brasoes/sig-gcm-logo.png";
              }}
              alt="Brasão GCM"
              className="h-12 w-12 object-contain"
            />

            {!menuCompacto ? (
              <div>
                <p className="font-semibold">
                  SIG-GCM Brasil
                </p>

                <p className="text-xs text-slate-400">
                  {usuario?.nome}
                </p>

                <p className="text-xs text-blue-400">
                  {perfilExibido}
                </p>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={sair}
            className="w-full rounded-lg bg-red-700 px-3 py-3 text-base font-semibold hover:bg-red-800"
          >
            {menuCompacto ? (
              <LogOut className="mx-auto h-5 w-5" />
            ) : (
              "Sair do Sistema"
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

function GrupoMenu({
  titulo,
  compacto,
}: {
  titulo: string;
  compacto: boolean;
}) {
  if (compacto) {
    return (
      <div className="h-3 border-b border-slate-800" />
    );
  }

  return (
    <div className="border-b border-slate-800 bg-slate-900/60 px-5 py-3">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-400">
        {titulo}
      </p>
    </div>
  );
}

function ItemMenu({
  href,
  icone: Icone,
  titulo,
  fecharMenu,
  compacto,
  ativo,
}: {
  href: string;
  icone: LucideIcon;
  titulo: string;
  fecharMenu: () => void;
  compacto: boolean;
  ativo: boolean;
}) {
  return (
    <Link
      onClick={fecharMenu}
      href={href}
      className={`
        flex w-full items-center gap-4 border-b border-slate-800
        px-5 py-5 text-lg font-bold transition-all duration-200
        ${
          ativo
            ? "border-l-4 border-l-cyan-400 bg-blue-700/40 text-white"
            : "text-slate-200 hover:bg-blue-700/40 hover:text-white"
        }
        ${compacto ? "justify-center px-0" : ""}
      `}
      title={titulo}
    >
      <Icone
        className={`h-9 w-9 shrink-0 ${
          ativo
            ? "text-cyan-300"
            : "text-blue-400"
        }`}
      />

      {!compacto ? <span>{titulo}</span> : null}
    </Link>
  );
}
