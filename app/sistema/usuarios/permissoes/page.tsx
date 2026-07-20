"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  CircleOff,
  Copy,
  Eye,
  Filter,
  Loader2,
  LockKeyhole,
  Pencil,
  PlusCircle,
  RefreshCw,
  Save,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  Undo2,
  UserCog,
  Users,
  X,
} from "lucide-react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import { registrarAuditoria } from "@/lib/auditoria";
import { supabase } from "@/lib/supabase";

const PERFIS = [
  { valor: "ADMIN", nome: "Administrador", nivel: 90 },
  { valor: "COMANDANTE", nome: "Comandante", nivel: 80 },
  { valor: "DIRETOR", nome: "Diretor", nivel: 70 },
  { valor: "CMT_GUARNICAO", nome: "Cmt. Guarnição", nivel: 60 },
  { valor: "PLANTONISTA", nome: "Plantonista", nivel: 50 },
  { valor: "GUARDA", nome: "Guarda", nivel: 40 },
  { valor: "CONSULTA", nome: "Consulta", nivel: 10 },
] as const;

const GRUPOS_MODULOS = [
  {
    titulo: "Centro de Comando",
    descricao: "Painéis, visão operacional e acompanhamento estratégico.",
    modulos: [
      "dashboard",
      "operacional",
      "central_comando",
      "mapa_operacional",
      "mancha_criminal",
    ],
  },
  {
    titulo: "Ocorrências e Atendimento",
    descricao: "Registros oficiais, chamados, abordagens e atendimento.",
    modulos: [
      "ocorrencias",
      "ocorrencias_nova",
      "ocorrencias_editar",
      "ocorrencias_pdf",
      "chamados",
      "pessoas_abordadas",
      "veiculos_abordados",
      "objetos",
      "locais",
    ],
  },
  {
    titulo: "Patrulhamento e Operações",
    descricao: "Rondas, rotas, visitas, apoios e operações planejadas.",
    modulos: [
      "patrulhamento",
      "rondas",
      "visitas",
      "apoios",
      "eventos",
      "operacoes",
      "pontos_municipio",
    ],
  },
  {
    titulo: "Efetivo, RH e Escalas",
    descricao: "Vida funcional, equipes, plantões, escalas e permutas.",
    modulos: [
      "guardas",
      "dossie_guarda",
      "rh",
      "documentos",
      "escalas",
      "guarnicoes",
      "permutas",
      "ferias_licencas",
      "registro_ponto",
      "saude_ocupacional",
      "saude_mental",
    ],
  },
  {
    titulo: "Frota, Armamento e Patrimônio",
    descricao: "Recursos materiais, cautelas, estoque e manutenção.",
    modulos: [
      "viaturas",
      "abastecimentos",
      "manutencoes",
      "checklist_viatura",
      "equipamentos",
      "armamentos",
      "cautelas",
      "patrimonio",
      "almoxarifado",
    ],
  },
  {
    titulo: "Documentos e Relatórios",
    descricao: "Documentos institucionais, legislação e exportações.",
    modulos: [
      "oficios",
      "legislacao",
      "documentos_institucionais",
      "livro_parte",
      "relatorios",
      "relatorio_diario",
      "relatorio_semanal",
      "relatorio_quinzenal",
      "relatorio_mensal",
      "relatorio_bimestral",
      "relatorio_trimestral",
      "relatorio_semestral",
      "relatorio_anual",
      "relatorio_personalizado",
      "exportar_pdf",
      "exportar_excel",
    ],
  },
  {
    titulo: "SIGIA e Inteligência",
    descricao: "Inteligência artificial, análise e base de conhecimento.",
    modulos: [
      "ia",
      "ia_operacional",
      "ia_juridica",
      "ia_legislacao",
      "sigia_documentos",
      "sigia_conhecimento",
      "sigia_creditos",
      "inteligencia",
    ],
  },
  {
    titulo: "Comunicação e Cidadão",
    descricao: "Avisos, mensagens, portal público e atendimento ao cidadão.",
    modulos: [
      "avisos",
      "notificacoes",
      "feed_sig",
      "blog_operacional",
      "mensagens",
      "push",
      "portal_cidadao",
      "ouvidoria",
      "protocolos",
    ],
  },
  {
    titulo: "Administração e Segurança",
    descricao: "Gestão de acesso, auditoria, municípios e configurações.",
    modulos: [
      "usuarios",
      "municipios",
      "administracao",
      "configuracoes",
      "permissoes",
      "auditoria",
      "backup",
      "restauracao",
      "planos",
      "assinaturas",
      "financeiro",
    ],
  },
  {
    titulo: "Áreas Especializadas",
    descricao: "Módulos institucionais com acesso específico ou sigiloso.",
    modulos: [
      "corregedoria",
      "transito",
      "defesa_civil",
      "ambiental",
      "escolar",
      "protecao_mulher",
      "videomonitoramento",
      "canil",
      "drones",
    ],
  },
  {
    titulo: "Integrações e Desenvolvimento",
    descricao: "APIs, migração, consultas globais e ferramentas técnicas.",
    modulos: [
      "api_publica",
      "integracoes",
      "consulta_global",
      "consulta_cpf",
      "consulta_placa",
      "importador_dados",
      "exportador_dados",
      "migracao_dados",
      "projetos",
      "desenvolvedor",
    ],
  },
] as const;

type CampoPermissao =
  | "pode_ver"
  | "pode_criar"
  | "pode_editar"
  | "pode_excluir";

type Permissao = {
  id?: number;
  perfil: string;
  modulo: string;
  municipio_id?: number | null;
  pode_ver: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
};

type UsuarioLogado = {
  id: string;
  perfil: string;
  municipio_id?: number;
};

type Alteracoes = Record<string, Permissao>;

const CAMPOS: {
  campo: CampoPermissao;
  titulo: string;
  descricao: string;
  icone: typeof Eye;
  classe: string;
}[] = [
  {
    campo: "pode_ver",
    titulo: "Ver",
    descricao: "Acessar e consultar",
    icone: Eye,
    classe: "text-cyan-300",
  },
  {
    campo: "pode_criar",
    titulo: "Criar",
    descricao: "Inserir registros",
    icone: PlusCircle,
    classe: "text-emerald-300",
  },
  {
    campo: "pode_editar",
    titulo: "Editar",
    descricao: "Alterar registros",
    icone: Pencil,
    classe: "text-blue-300",
  },
  {
    campo: "pode_excluir",
    titulo: "Excluir",
    descricao: "Remover registros",
    icone: Trash2,
    classe: "text-rose-300",
  },
];

function usuarioLogado(): UsuarioLogado | null {
  try {
    const valor = localStorage.getItem("usuarioLogado");
    if (!valor) return null;

    const usuario = JSON.parse(valor) as Record<string, unknown>;
    if (!usuario.id || !usuario.perfil) return null;

    return {
      id: String(usuario.id),
      perfil: String(usuario.perfil).toUpperCase(),
      municipio_id: usuario.municipio_id
        ? Number(usuario.municipio_id)
        : undefined,
    };
  } catch {
    return null;
  }
}

function nomeModulo(modulo: string) {
  const especiais: Record<string, string> = {
    central_comando: "Central de Comando",
    mapa_operacional: "Mapa Operacional",
    mancha_criminal: "Mancha Criminal",
    ocorrencias_nova: "Nova Ocorrência",
    ocorrencias_editar: "Editar Ocorrência",
    ocorrencias_pdf: "PDF da Ocorrência",
    pessoas_abordadas: "Pessoas Abordadas",
    veiculos_abordados: "Veículos Abordados",
    pontos_municipio: "Pontos do Município",
    dossie_guarda: "Dossiê do Guarda",
    ferias_licencas: "Férias e Licenças",
    registro_ponto: "Registro de Ponto",
    saude_ocupacional: "Saúde Ocupacional",
    saude_mental: "Saúde Mental",
    checklist_viatura: "Checklist de Viatura",
    documentos_institucionais: "Documentos Institucionais",
    livro_parte: "Livro de Parte",
    relatorio_personalizado: "Relatório Personalizado",
    sigia_documentos: "SIGIA Documentos",
    sigia_conhecimento: "SIGIA Conhecimento",
    sigia_creditos: "Créditos SIGIA",
    portal_cidadao: "Portal do Cidadão",
    protecao_mulher: "Proteção à Mulher",
    api_publica: "API Pública",
    consulta_global: "Consulta Global",
    consulta_cpf: "Consulta CPF",
    consulta_placa: "Consulta de Placa",
    importador_dados: "Importador de Dados",
    exportador_dados: "Exportador de Dados",
    migracao_dados: "Migração de Dados",
  };

  return (
    especiais[modulo] ??
    modulo
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letra) => letra.toUpperCase())
  );
}

function vazio(perfil: string, modulo: string, municipioId?: number): Permissao {
  return {
    perfil,
    modulo,
    municipio_id: municipioId ?? null,
    pode_ver: false,
    pode_criar: false,
    pode_editar: false,
    pode_excluir: false,
  };
}

function normalizarDependencias(item: Permissao): Permissao {
  const proxima = { ...item };

  if (
    proxima.pode_criar ||
    proxima.pode_editar ||
    proxima.pode_excluir
  ) {
    proxima.pode_ver = true;
  }

  if (!proxima.pode_ver) {
    proxima.pode_criar = false;
    proxima.pode_editar = false;
    proxima.pode_excluir = false;
  }

  return proxima;
}

export default function PermissoesPage() {
  const [perfilSelecionado, setPerfilSelecionado] = useState("GUARDA");
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [alteracoes, setAlteracoes] = useState<Alteracoes>({});
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"TODOS" | "LIBERADOS" | "BLOQUEADOS">(
    "TODOS",
  );
  const [gruposAbertos, setGruposAbertos] = useState<Set<string>>(
    new Set(GRUPOS_MODULOS.map((grupo) => grupo.titulo)),
  );
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);

  const todosModulos = useMemo(
    () => Array.from(new Set(GRUPOS_MODULOS.flatMap((grupo) => [...grupo.modulos]))),
    [],
  );

  const mapaPermissoes = useMemo(() => {
    const mapa = new Map<string, Permissao>();

    for (const modulo of todosModulos) {
      mapa.set(modulo, vazio(perfilSelecionado, modulo, usuario?.municipio_id));
    }

    for (const item of permissoes) {
      mapa.set(item.modulo, item);
    }

    for (const [modulo, item] of Object.entries(alteracoes)) {
      mapa.set(modulo, item);
    }

    return mapa;
  }, [
    alteracoes,
    perfilSelecionado,
    permissoes,
    todosModulos,
    usuario?.municipio_id,
  ]);

  const gruposFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return GRUPOS_MODULOS.map((grupo) => {
      const modulos = grupo.modulos.filter((modulo) => {
        const permissao = mapaPermissoes.get(modulo);
        const liberado = Boolean(permissao?.pode_ver);

        const bateFiltro =
          filtro === "TODOS" ||
          (filtro === "LIBERADOS" && liberado) ||
          (filtro === "BLOQUEADOS" && !liberado);

        const bateBusca =
          !termo ||
          `${grupo.titulo} ${grupo.descricao} ${modulo} ${nomeModulo(modulo)}`
            .toLowerCase()
            .includes(termo);

        return bateFiltro && bateBusca;
      });

      return { ...grupo, modulos };
    }).filter((grupo) => grupo.modulos.length > 0);
  }, [busca, filtro, mapaPermissoes]);

  const totalLiberados = useMemo(
    () =>
      todosModulos.filter((modulo) => mapaPermissoes.get(modulo)?.pode_ver)
        .length,
    [mapaPermissoes, todosModulos],
  );

  const totalMarcadas = useMemo(
    () =>
      todosModulos.reduce((total, modulo) => {
        const item = mapaPermissoes.get(modulo);
        return (
          total +
          Number(item?.pode_ver) +
          Number(item?.pode_criar) +
          Number(item?.pode_editar) +
          Number(item?.pode_excluir)
        );
      }, 0),
    [mapaPermissoes, todosModulos],
  );

  const alteracoesPendentes = Object.keys(alteracoes).length;
  const perfilAtual = PERFIS.find(
    (perfil) => perfil.valor === perfilSelecionado,
  );

  useEffect(() => {
    const atual = usuarioLogado();
    setUsuario(atual);
  }, []);

  useEffect(() => {
    if (!usuario) return;
    void carregarPermissoes();
  }, [perfilSelecionado, usuario]);

  async function carregarPermissoes() {
    setCarregando(true);
    setErro("");
    setMensagem("");
    setAlteracoes({});

    let consulta = supabase
      .from("permissoes_perfis")
      .select(
        "id,perfil,modulo,municipio_id,pode_ver,pode_criar,pode_editar,pode_excluir",
      )
      .eq("perfil", perfilSelecionado)
      .order("modulo");

    if (
      usuario?.perfil !== "DESENVOLVEDOR" &&
      usuario?.municipio_id
    ) {
      consulta = consulta.eq("municipio_id", usuario.municipio_id);
    }

    const { data, error } = await consulta;

    if (error) {
      setErro(`Não foi possível carregar as permissões: ${error.message}`);
      setPermissoes([]);
      setCarregando(false);
      return;
    }

    setPermissoes((data ?? []) as Permissao[]);
    setCarregando(false);
  }

  function podeGerenciar() {
    return Boolean(
      usuario &&
        ["DESENVOLVEDOR", "ADMIN", "COMANDANTE"].includes(usuario.perfil),
    );
  }

  function alterarCampo(
    modulo: string,
    campo: CampoPermissao,
    valor: boolean,
  ) {
    if (!podeGerenciar()) {
      setErro("Seu perfil não pode alterar permissões.");
      return;
    }

    const atual =
      mapaPermissoes.get(modulo) ??
      vazio(perfilSelecionado, modulo, usuario?.municipio_id);

    const proxima = normalizarDependencias({
      ...atual,
      [campo]: valor,
    });

    setAlteracoes((anteriores) => ({
      ...anteriores,
      [modulo]: proxima,
    }));
    setMensagem("");
    setErro("");
  }

  function aplicarEmGrupo(
    modulos: readonly string[],
    campo: CampoPermissao,
    valor: boolean,
  ) {
    if (!podeGerenciar()) return;

    setAlteracoes((anteriores) => {
      const proximas = { ...anteriores };

      for (const modulo of modulos) {
        const atual =
          proximas[modulo] ??
          mapaPermissoes.get(modulo) ??
          vazio(perfilSelecionado, modulo, usuario?.municipio_id);

        proximas[modulo] = normalizarDependencias({
          ...atual,
          [campo]: valor,
        });
      }

      return proximas;
    });
  }

  function aplicarModelo(
    modelo: "LEITURA" | "OPERACIONAL" | "GESTAO" | "BLOQUEAR",
  ) {
    if (!podeGerenciar()) return;

    const proximas: Alteracoes = {};

    for (const modulo of todosModulos) {
      const atual =
        mapaPermissoes.get(modulo) ??
        vazio(perfilSelecionado, modulo, usuario?.municipio_id);

      if (modelo === "BLOQUEAR") {
        proximas[modulo] = normalizarDependencias({
          ...atual,
          pode_ver: false,
        });
      }

      if (modelo === "LEITURA") {
        proximas[modulo] = {
          ...atual,
          pode_ver: true,
          pode_criar: false,
          pode_editar: false,
          pode_excluir: false,
        };
      }

      if (modelo === "OPERACIONAL") {
        proximas[modulo] = {
          ...atual,
          pode_ver: true,
          pode_criar: true,
          pode_editar: true,
          pode_excluir: false,
        };
      }

      if (modelo === "GESTAO") {
        proximas[modulo] = {
          ...atual,
          pode_ver: true,
          pode_criar: true,
          pode_editar: true,
          pode_excluir: true,
        };
      }
    }

    setAlteracoes(proximas);
    setMensagem(
      "Modelo aplicado localmente. Revise as alterações antes de salvar.",
    );
  }

  function restaurar() {
    setAlteracoes({});
    setMensagem("Alterações pendentes descartadas.");
    setErro("");
  }

  async function salvarAlteracoes() {
    if (!usuario || !podeGerenciar()) {
      setErro("Você não possui autorização para salvar permissões.");
      return;
    }

    const itens = Object.values(alteracoes);
    if (itens.length === 0) {
      setMensagem("Não existem alterações pendentes.");
      return;
    }

    setSalvando(true);
    setErro("");
    setMensagem("");

    for (const item of itens) {
      const existente = permissoes.find(
        (permissao) => permissao.modulo === item.modulo,
      );

      if (existente?.id) {
        const { error } = await supabase
          .from("permissoes_perfis")
          .update({
            pode_ver: item.pode_ver,
            pode_criar: item.pode_criar,
            pode_editar: item.pode_editar,
            pode_excluir: item.pode_excluir,
            atualizado_em: new Date().toISOString(),
          })
          .eq("id", existente.id);

        if (error) {
          setErro(
            `Erro ao salvar ${nomeModulo(item.modulo)}: ${error.message}`,
          );
          setSalvando(false);
          return;
        }
      } else {
        const { error } = await supabase
          .from("permissoes_perfis")
          .insert({
            perfil: perfilSelecionado,
            modulo: item.modulo,
            municipio_id:
              usuario.perfil === "DESENVOLVEDOR"
                ? item.municipio_id ?? usuario.municipio_id ?? null
                : usuario.municipio_id ?? null,
            pode_ver: item.pode_ver,
            pode_criar: item.pode_criar,
            pode_editar: item.pode_editar,
            pode_excluir: item.pode_excluir,
          });

        if (error) {
          setErro(
            `Erro ao criar ${nomeModulo(item.modulo)}: ${error.message}`,
          );
          setSalvando(false);
          return;
        }
      }
    }

    await registrarAuditoria({
      modulo: "Permissões",
      acao: "ALTERAR_PERMISSOES_EM_LOTE",
      descricao: `Atualizou ${itens.length} módulos para o perfil ${perfilSelecionado}.`,
      tabela: "permissoes_perfis",
      detalhes: {
        perfil_alterado: perfilSelecionado,
        quantidade_modulos: itens.length,
        modulos: itens.map((item) => item.modulo),
        usuario_id: usuario.id,
        municipio_id: usuario.municipio_id ?? null,
      },
    });

    setMensagem(
      `${itens.length} módulo(s) atualizado(s) com sucesso.`,
    );
    setSalvando(false);
    await carregarPermissoes();
  }

  function alternarGrupo(titulo: string) {
    setGruposAbertos((anteriores) => {
      const proximo = new Set(anteriores);
      if (proximo.has(titulo)) proximo.delete(titulo);
      else proximo.add(titulo);
      return proximo;
    });
  }

  return (
    <ProtecaoModulo modulo="permissoes">
      <main className="min-h-screen bg-[#020817] p-4 pb-28 text-white md:p-6">
        <div className="mx-auto max-w-[1800px] space-y-5">
          <SigPageHeader
            titulo="Central Avançada de Permissões"
            subtitulo="Controle por perfil, módulo, ação e município, com edição em lote e auditoria."
            icone={LockKeyhole}
          />

          <section className="overflow-hidden rounded-[30px] border border-cyan-400/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.16),transparent_34%),linear-gradient(135deg,#07152e,#020817)] p-6">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10">
                  <UserCog className="h-8 w-8 text-cyan-300" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[.22em] text-cyan-300">
                    Governança de acesso
                  </p>
                  <h1 className="mt-1 text-2xl font-black md:text-3xl">
                    Matriz institucional de permissões
                  </h1>
                  <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
                    Defina exatamente o que cada perfil pode visualizar, criar,
                    editar ou excluir. Alterações são agrupadas antes do
                    salvamento e registradas na auditoria.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void carregarPermissoes()}
                  disabled={carregando || salvando}
                  className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[.04] px-4 font-black text-slate-200 transition hover:bg-white/[.08] disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-5 w-5 ${carregando ? "animate-spin" : ""}`}
                  />
                  Atualizar
                </button>

                <button
                  type="button"
                  onClick={restaurar}
                  disabled={!alteracoesPendentes || salvando}
                  className="inline-flex h-12 items-center gap-2 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 font-black text-amber-200 disabled:opacity-40"
                >
                  <Undo2 className="h-5 w-5" />
                  Descartar
                </button>

                <button
                  type="button"
                  onClick={() => void salvarAlteracoes()}
                  disabled={
                    !alteracoesPendentes || salvando || !podeGerenciar()
                  }
                  className="inline-flex h-12 items-center gap-2 rounded-2xl bg-cyan-400 px-5 font-black text-[#03111f] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {salvando ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                  Salvar alterações
                </button>
              </div>
            </div>
          </section>

          {erro ? (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm font-bold text-rose-200">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              {erro}
            </div>
          ) : null}

          {mensagem ? (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm font-bold text-emerald-200">
              <Check className="mt-0.5 h-5 w-5 shrink-0" />
              {mensagem}
            </div>
          ) : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ResumoCard
              titulo="Perfil selecionado"
              valor={perfilAtual?.nome ?? perfilSelecionado}
              detalhe={`Nível ${perfilAtual?.nivel ?? 0}`}
              icone={Users}
            />
            <ResumoCard
              titulo="Módulos liberados"
              valor={totalLiberados}
              detalhe={`${todosModulos.length} módulos mapeados`}
              icone={ShieldCheck}
            />
            <ResumoCard
              titulo="Permissões ativas"
              valor={totalMarcadas}
              detalhe="Ver, criar, editar e excluir"
              icone={Shield}
            />
            <ResumoCard
              titulo="Alterações pendentes"
              valor={alteracoesPendentes}
              detalhe={
                alteracoesPendentes
                  ? "Aguardando salvamento"
                  : "Tudo sincronizado"
              }
              icone={alteracoesPendentes ? AlertTriangle : Check}
            />
          </section>

          <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
            <aside className="space-y-5">
              <SigCard>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">
                      Perfil em edição
                    </p>
                    <h2 className="mt-1 text-xl font-black">
                      Escolha o nível de acesso
                    </h2>
                  </div>

                  <div className="grid gap-2">
                    {PERFIS.map((perfil) => {
                      const ativo = perfilSelecionado === perfil.valor;

                      return (
                        <button
                          key={perfil.valor}
                          type="button"
                          onClick={() => {
                            if (
                              alteracoesPendentes &&
                              !window.confirm(
                                "Descartar alterações pendentes e trocar o perfil?",
                              )
                            ) {
                              return;
                            }

                            setPerfilSelecionado(perfil.valor);
                          }}
                          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                            ativo
                              ? "border-cyan-400/40 bg-cyan-400/10"
                              : "border-white/10 bg-[#020817] hover:border-white/20"
                          }`}
                        >
                          <div>
                            <p
                              className={`font-black ${
                                ativo ? "text-cyan-200" : "text-slate-200"
                              }`}
                            >
                              {perfil.nome}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {perfil.valor}
                            </p>
                          </div>
                          <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-black text-slate-400">
                            {perfil.nivel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </SigCard>

              <SigCard>
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-300" />
                    <h2 className="font-black">Modelos rápidos</h2>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Aplique um modelo em todos os módulos e revise antes de
                    salvar.
                  </p>

                  <div className="mt-4 grid gap-2">
                    <ModeloButton
                      titulo="Somente leitura"
                      descricao="Libera apenas visualização"
                      icone={Eye}
                      onClick={() => aplicarModelo("LEITURA")}
                    />
                    <ModeloButton
                      titulo="Operacional"
                      descricao="Ver, criar e editar"
                      icone={Pencil}
                      onClick={() => aplicarModelo("OPERACIONAL")}
                    />
                    <ModeloButton
                      titulo="Gestão completa"
                      descricao="Todas as ações"
                      icone={ShieldCheck}
                      onClick={() => aplicarModelo("GESTAO")}
                    />
                    <ModeloButton
                      titulo="Bloquear tudo"
                      descricao="Remove todos os acessos"
                      icone={CircleOff}
                      onClick={() => aplicarModelo("BLOQUEAR")}
                      perigo
                    />
                  </div>
                </div>
              </SigCard>
            </aside>

            <div className="space-y-5">
              <section className="rounded-3xl border border-white/10 bg-[#071225] p-4">
                <div className="flex flex-col gap-3 lg:flex-row">
                  <label className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    <input
                      value={busca}
                      onChange={(event) => setBusca(event.target.value)}
                      placeholder="Pesquisar módulo ou grupo..."
                      className="h-12 w-full rounded-2xl border border-white/10 bg-[#020817] pl-12 pr-4 text-sm outline-none transition focus:border-cyan-400/40"
                    />
                  </label>

                  <div className="flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-[#020817] px-3">
                    <Filter className="h-4 w-4 text-slate-500" />
                    {(["TODOS", "LIBERADOS", "BLOQUEADOS"] as const).map(
                      (item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setFiltro(item)}
                          className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                            filtro === item
                              ? "bg-cyan-400 text-slate-950"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {item === "TODOS"
                            ? "Todos"
                            : item === "LIBERADOS"
                              ? "Liberados"
                              : "Bloqueados"}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </section>

              {carregando ? (
                <SigCard>
                  <div className="flex min-h-72 items-center justify-center gap-3 text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
                    Carregando matriz de permissões...
                  </div>
                </SigCard>
              ) : gruposFiltrados.length === 0 ? (
                <SigCard>
                  <div className="flex min-h-60 flex-col items-center justify-center text-center">
                    <Search className="h-10 w-10 text-slate-600" />
                    <p className="mt-4 font-black">Nenhum módulo encontrado</p>
                    <p className="mt-2 text-sm text-slate-500">
                      Altere a pesquisa ou o filtro selecionado.
                    </p>
                  </div>
                </SigCard>
              ) : (
                gruposFiltrados.map((grupo) => {
                  const aberto = gruposAbertos.has(grupo.titulo);
                  const liberadosGrupo = grupo.modulos.filter(
                    (modulo) => mapaPermissoes.get(modulo)?.pode_ver,
                  ).length;

                  return (
                    <section
                      key={grupo.titulo}
                      className="overflow-hidden rounded-3xl border border-white/10 bg-[#071225]"
                    >
                      <button
                        type="button"
                        onClick={() => alternarGrupo(grupo.titulo)}
                        className="flex w-full items-center justify-between gap-4 border-b border-white/10 p-5 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                            {aberto ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <h2 className="font-black">{grupo.titulo}</h2>
                            <p className="mt-1 text-sm text-slate-500">
                              {grupo.descricao}
                            </p>
                          </div>
                        </div>

                        <span className="shrink-0 rounded-full border border-white/10 bg-[#020817] px-3 py-1.5 text-xs font-black text-slate-400">
                          {liberadosGrupo}/{grupo.modulos.length}
                        </span>
                      </button>

                      {aberto ? (
                        <>
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px]">
                              <thead className="border-b border-white/10 bg-white/[.025]">
                                <tr>
                                  <th className="sticky left-0 z-10 min-w-72 bg-[#09162a] px-5 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-500">
                                    Módulo
                                  </th>
                                  {CAMPOS.map((item) => {
                                    const Icone = item.icone;
                                    return (
                                      <th
                                        key={item.campo}
                                        className="min-w-32 px-3 py-4 text-center"
                                      >
                                        <div
                                          className={`flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider ${item.classe}`}
                                        >
                                          <Icone className="h-4 w-4" />
                                          {item.titulo}
                                        </div>
                                        <p className="mt-1 text-[10px] font-medium normal-case text-slate-600">
                                          {item.descricao}
                                        </p>
                                      </th>
                                    );
                                  })}
                                </tr>
                              </thead>

                              <tbody className="divide-y divide-white/[.07]">
                                {grupo.modulos.map((modulo) => {
                                  const permissao =
                                    mapaPermissoes.get(modulo) ??
                                    vazio(
                                      perfilSelecionado,
                                      modulo,
                                      usuario?.municipio_id,
                                    );
                                  const alterado = Boolean(alteracoes[modulo]);

                                  return (
                                    <tr
                                      key={modulo}
                                      className={`transition hover:bg-white/[.025] ${
                                        alterado ? "bg-amber-400/[.035]" : ""
                                      }`}
                                    >
                                      <td className="sticky left-0 z-10 bg-[#071225] px-5 py-4">
                                        <div className="flex items-center gap-3">
                                          <div
                                            className={`h-2.5 w-2.5 rounded-full ${
                                              permissao.pode_ver
                                                ? "bg-emerald-400"
                                                : "bg-slate-700"
                                            }`}
                                          />
                                          <div>
                                            <p className="font-black text-slate-100">
                                              {nomeModulo(modulo)}
                                            </p>
                                            <div className="mt-1 flex items-center gap-2">
                                              <p className="font-mono text-[10px] text-slate-600">
                                                {modulo}
                                              </p>
                                              {alterado ? (
                                                <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[9px] font-black uppercase text-amber-300">
                                                  Alterado
                                                </span>
                                              ) : null}
                                            </div>
                                          </div>
                                        </div>
                                      </td>

                                      {CAMPOS.map((item) => (
                                        <td
                                          key={item.campo}
                                          className="px-3 py-4 text-center"
                                        >
                                          <PermissaoToggle
                                            checked={permissao[item.campo]}
                                            disabled={!podeGerenciar() || salvando}
                                            titulo={`${item.titulo}: ${nomeModulo(modulo)}`}
                                            onChange={(valor) =>
                                              alterarCampo(
                                                modulo,
                                                item.campo,
                                                valor,
                                              )
                                            }
                                          />
                                        </td>
                                      ))}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-white/[.02] px-5 py-4">
                            <p className="text-xs font-bold text-slate-500">
                              Aplicar em todos os módulos deste grupo:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {CAMPOS.map((item) => (
                                <div
                                  key={item.campo}
                                  className="flex overflow-hidden rounded-xl border border-white/10"
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      aplicarEmGrupo(
                                        grupo.modulos,
                                        item.campo,
                                        true,
                                      )
                                    }
                                    className="bg-emerald-400/10 px-2.5 py-2 text-[10px] font-black text-emerald-300 hover:bg-emerald-400/20"
                                  >
                                    {item.titulo} ✓
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      aplicarEmGrupo(
                                        grupo.modulos,
                                        item.campo,
                                        false,
                                      )
                                    }
                                    className="border-l border-white/10 bg-rose-400/10 px-2.5 py-2 text-[10px] font-black text-rose-300 hover:bg-rose-400/20"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : null}
                    </section>
                  );
                })
              )}
            </div>
          </section>

          <section className="flex items-start gap-3 rounded-3xl border border-amber-400/20 bg-amber-400/[.06] p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <div>
              <p className="font-black text-amber-200">
                Princípio do menor privilégio
              </p>
              <p className="mt-1 text-sm leading-6 text-amber-100/70">
                Libere somente os recursos necessários à função. Ao ativar
                criar, editar ou excluir, a permissão de visualização é
                habilitada automaticamente. Ao bloquear a visualização, as
                demais ações também são removidas.
              </p>
            </div>
          </section>
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function PermissaoToggle({
  checked,
  disabled,
  titulo,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  titulo: string;
  onChange: (valor: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={titulo}
      title={titulo}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full border transition ${
        checked
          ? "border-cyan-300/40 bg-cyan-400"
          : "border-white/15 bg-slate-800"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-900 shadow transition ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      >
        {checked ? <Check className="h-3.5 w-3.5" /> : null}
      </span>
    </button>
  );
}

function ResumoCard({
  titulo,
  valor,
  detalhe,
  icone: Icone,
}: {
  titulo: string;
  valor: string | number;
  detalhe: string;
  icone: typeof Shield;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#071225] p-5">
      <div className="flex items-center justify-between">
        <Icone className="h-5 w-5 text-cyan-300" />
        <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,.8)]" />
      </div>
      <p className="mt-5 text-2xl font-black">{valor}</p>
      <p className="mt-1 text-sm font-black text-slate-200">{titulo}</p>
      <p className="mt-1 text-xs text-slate-500">{detalhe}</p>
    </div>
  );
}

function ModeloButton({
  titulo,
  descricao,
  icone: Icone,
  onClick,
  perigo = false,
}: {
  titulo: string;
  descricao: string;
  icone: typeof Eye;
  onClick: () => void;
  perigo?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
        perigo
          ? "border-rose-400/15 bg-rose-400/[.05] hover:border-rose-400/30"
          : "border-white/10 bg-[#020817] hover:border-cyan-400/25"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          perigo
            ? "bg-rose-400/10 text-rose-300"
            : "bg-cyan-400/10 text-cyan-300"
        }`}
      >
        <Icone className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-black">{titulo}</p>
        <p className="mt-0.5 text-xs text-slate-500">{descricao}</p>
      </div>
    </button>
  );
}
