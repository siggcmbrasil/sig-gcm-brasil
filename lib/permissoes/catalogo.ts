export const HIERARQUIA_PERFIS = {
  DESENVOLVEDOR: 100,
  ADMIN: 90,
  COMANDANTE: 80,
  DIRETOR: 70,
  CMT_GUARNICAO: 60,
  PLANTONISTA: 50,
  GUARDA: 40,
  CONSULTA: 10,
} as const;

export type Perfil = keyof typeof HIERARQUIA_PERFIS;

export const PERFIS_EDITAVEIS: Perfil[] = [
  "ADMIN",
  "COMANDANTE",
  "DIRETOR",
  "CMT_GUARNICAO",
  "PLANTONISTA",
  "GUARDA",
  "CONSULTA",
];

export type CampoPermissao =
  | "pode_ver"
  | "pode_criar"
  | "pode_editar"
  | "pode_excluir";

export const CAMPOS_PERMISSAO: CampoPermissao[] = [
  "pode_ver",
  "pode_criar",
  "pode_editar",
  "pode_excluir",
];

export const GRUPOS_MODULOS = [
  {
    titulo: "Centro de Comando",
    descricao: "Acesso principal, painel e visão operacional.",
    modulos: [
      "dashboard",
      "operacional",
      "mapa_operacional",
      "mancha_criminal",
    ],
  },
  {
    titulo: "Ocorrências e Atendimento",
    descricao:
      "Ocorrências, chamados, abordagens e registros de campo.",
    modulos: [
      "ocorrencias",
      "ocorrencias_nova",
      "ocorrencias_editar",
      "ocorrencias_pdf",
      "chamados",
      "pessoas_abordadas",
      "veiculos_abordados",
    ],
  },
  {
    titulo: "Patrulhamento",
    descricao: "Rotas, visitas, apoios e operações.",
    modulos: [
      "patrulhamento",
      "rondas",
      "visitas",
      "apoios",
      "eventos",
      "operacoes",
      "locais",
    ],
  },
  {
    titulo: "Efetivo e Escalas",
    descricao:
      "Guardas, guarnições, escalas e gestão de equipe.",
    modulos: [
      "guardas",
      "dossie_guarda",
      "documentos",
      "escalas",
      "guarnicoes",
      "permutas",
      "ferias_licencas",
      "registro_ponto",
      "aniversariantes",
      "datas_comemorativas",
    ],
  },
  {
    titulo: "Frota, Equipamentos e Patrimônio",
    descricao:
      "Viaturas, armamentos, equipamentos e bens patrimoniais.",
    modulos: [
      "viaturas",
      "abastecimentos",
      "manutencoes",
      "checklist_viatura",
      "equipamentos",
      "armamentos",
      "patrimonio",
      "almoxarifado",
    ],
  },
  {
    titulo: "Documentos e Relatórios",
    descricao:
      "Ofícios, legislação, livro de parte e exportações.",
    modulos: [
      "oficios",
      "legislacao",
      "documentos_institucionais",
      "livro_parte",
      "relatorios",
      "estatisticas",
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
    descricao:
      "IA operacional, jurídica, legislação e créditos.",
    modulos: [
      "ia",
      "ia_operacional",
      "ia_juridica",
      "ia_legislacao",
      "sigia_documentos",
      "sigia_conhecimento",
      "sigia_creditos",
    ],
  },
  {
    titulo: "Comunicação",
    descricao:
      "Avisos, notificações, mensagens e feed interno.",
    modulos: [
      "avisos",
      "notificacoes",
      "feed_sig",
      "blog_operacional",
      "mensagens",
      "push",
    ],
  },
  {
    titulo: "Administração e Segurança",
    descricao:
      "Usuários, permissões, auditoria, backup e configurações.",
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
    titulo: "Integrações e Futuro",
    descricao:
      "APIs, consultas globais, portal cidadão e módulos futuros.",
    modulos: [
      "api_publica",
      "integracoes",
      "consulta_global",
      "consulta_cpf",
      "consulta_placa",
      "importador_dados",
      "exportador_dados",
      "migracao_dados",
      "portal_cidadao",
      "ouvidoria",
      "corregedoria",
      "defesa_civil",
      "transito",
      "ambiental",
      "escolar",
      "projetos",
      "desenvolvedor",
    ],
  },
] as const;

export const MODULOS_CATALOGO: string[] = Array.from(
  new Set<string>(
    GRUPOS_MODULOS.flatMap((grupo) =>
      grupo.modulos.map((modulo) => String(modulo))
    )
  )
);

export function perfilValido(valor: unknown): valor is Perfil {
  return Object.prototype.hasOwnProperty.call(
    HIERARQUIA_PERFIS,
    String(valor || "").toUpperCase()
  );
}

export function podeGerenciarPerfil(
  gestor: Perfil,
  alvo: Perfil
) {
  if (alvo === "DESENVOLVEDOR") return false;

  if (gestor === "DESENVOLVEDOR") return true;

  return (
    HIERARQUIA_PERFIS[gestor] >
    HIERARQUIA_PERFIS[alvo]
  );
}
