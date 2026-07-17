export type ModuloSistema = {
  slug: string;
  nome: string;
  descricao?: string;
};

export type CategoriaModuloSistema = {
  categoria: string;
  itens: ModuloSistema[];
};

export const MODULOS_SISTEMA: CategoriaModuloSistema[] = [
  {
    categoria: "Principal",
    itens: [
      {
        slug: "dashboard",
        nome: "Dashboard",
      },
      {
        slug: "centro_comando",
        nome: "Centro de Comando",
      },
      {
        slug: "notificacoes",
        nome: "Notificações",
      },
      {
        slug: "avisos",
        nome: "Avisos Institucionais",
      },
      {
        slug: "datas_institucionais",
        nome: "Datas Institucionais",
      },
    ],
  },

  {
    categoria: "Operacional",
    itens: [
      {
        slug: "centro_operacional",
        nome: "Centro Operacional",
      },
      {
        slug: "ocorrencias",
        nome: "Ocorrências",
      },
      {
        slug: "ocorrencia_expressa",
        nome: "Ocorrência Expressa",
      },
      {
        slug: "chamados",
        nome: "Chamados",
      },
      {
        slug: "patrulhamento",
        nome: "Patrulhamento",
      },
      {
        slug: "visitas",
        nome: "Visitas",
      },
      {
        slug: "mapa_operacional",
        nome: "Mapa Operacional",
      },
      {
        slug: "operacoes",
        nome: "Operações",
      },
      {
        slug: "operacoes_especiais",
        nome: "Operações Especiais",
      },
      {
        slug: "ordens_servico",
        nome: "Ordens de Serviço",
      },
      {
        slug: "relatorio_plantao",
        nome: "Relatório de Plantão",
      },
      {
        slug: "registro_ponto",
        nome: "Registro de Ponto",
      },
    ],
  },

  {
    categoria: "Cadastros Operacionais",
    itens: [
      {
        slug: "pessoas",
        nome: "Pessoas",
      },
      {
        slug: "veiculos",
        nome: "Veículos",
      },
      {
        slug: "locais",
        nome: "Locais",
      },
      {
        slug: "objetos",
        nome: "Objetos",
      },
      {
        slug: "achados_perdidos",
        nome: "Achados e Perdidos",
      },
      {
        slug: "mancha_criminal",
        nome: "Mancha Criminal",
      },
      {
        slug: "inteligencia",
        nome: "Inteligência",
      },
      {
        slug: "alerta_intermunicipal",
        nome: "Alerta Intermunicipal",
      },
    ],
  },

  {
    categoria: "Escalas e Serviço",
    itens: [
      {
        slug: "escalas",
        nome: "Escalas",
      },
      {
        slug: "escala_mensal",
        nome: "Escala Mensal",
      },
      {
        slug: "escala_administrativa",
        nome: "Escala Administrativa",
      },
      {
        slug: "escala_extraordinaria",
        nome: "Escala Extraordinária",
      },
      {
        slug: "plantoes",
        nome: "Plantões",
      },
      {
        slug: "guarnicoes",
        nome: "Guarnições",
      },
      {
        slug: "permutas",
        nome: "Permutas",
      },
      {
        slug: "ferias_licencas",
        nome: "Férias e Licenças",
      },
    ],
  },

  {
    categoria: "Recursos Humanos",
    itens: [
      {
        slug: "rh",
        nome: "RH",
      },
      {
        slug: "guardas",
        nome: "Guardas",
      },
      {
        slug: "dossie_guarda",
        nome: "Dossiê do Guarda",
      },
      {
        slug: "atestados",
        nome: "Atestados",
      },
      {
        slug: "advertencias",
        nome: "Advertências",
      },
      {
        slug: "banco_horas",
        nome: "Banco de Horas",
      },
      {
        slug: "aniversariantes",
        nome: "Aniversariantes",
      },
      {
        slug: "documentos_funcionais",
        nome: "Documentos Funcionais",
      },
      {
        slug: "treinamentos",
        nome: "Treinamentos",
      },
      {
        slug: "ensino",
        nome: "Módulo de Ensino",
      },
    ],
  },

  {
    categoria: "Frota",
    itens: [
      {
        slug: "frota",
        nome: "Frota",
      },
      {
        slug: "viaturas",
        nome: "Viaturas",
      },
      {
        slug: "abastecimentos",
        nome: "Abastecimentos",
      },
      {
        slug: "manutencoes",
        nome: "Manutenções",
      },
      {
        slug: "checklist_viaturas",
        nome: "Checklist de Viaturas",
      },
      {
        slug: "danos_viaturas",
        nome: "Danos em Viaturas",
      },
      {
        slug: "pneus",
        nome: "Controle de Pneus",
      },
      {
        slug: "documentos_viaturas",
        nome: "Documentos de Viaturas",
      },
    ],
  },

  {
    categoria: "Armamento",
    itens: [
      {
        slug: "armamento",
        nome: "Armamento",
      },
      {
        slug: "armaria",
        nome: "Armaria",
      },
      {
        slug: "armas",
        nome: "Armas",
      },
      {
        slug: "municoes",
        nome: "Munições",
      },
      {
        slug: "cautelas_armamento",
        nome: "Cautelas",
      },
      {
        slug: "documentos_armamento",
        nome: "Documentos de Armamento",
      },
      {
        slug: "movimentacoes_armamento",
        nome: "Movimentações de Armamento",
      },
    ],
  },

  {
    categoria: "Patrimônio",
    itens: [
      {
        slug: "patrimonio",
        nome: "Patrimônio",
      },
      {
        slug: "bens",
        nome: "Bens Patrimoniais",
      },
      {
        slug: "movimentacoes_patrimonio",
        nome: "Movimentações",
      },
      {
        slug: "baixa_patrimonial",
        nome: "Baixa Patrimonial",
      },
      {
        slug: "inventario",
        nome: "Inventário",
      },
      {
        slug: "qr_code_patrimonio",
        nome: "QR Code Patrimonial",
      },
      {
        slug: "entradas_saidas",
        nome: "Entradas e Saídas",
      },
    ],
  },

  {
    categoria: "Administrativo",
    itens: [
      {
        slug: "oficios",
        nome: "Ofícios",
      },
      {
        slug: "oficios_recebidos",
        nome: "Ofícios Recebidos",
      },
      {
        slug: "oficios_emitidos",
        nome: "Ofícios Emitidos",
      },
      {
        slug: "memorandos",
        nome: "Memorandos",
      },
      {
        slug: "projetos",
        nome: "Projetos",
      },
      {
        slug: "documentos",
        nome: "Documentos",
      },
      {
        slug: "protocolos",
        nome: "Protocolos",
      },
      {
        slug: "administrativo",
        nome: "Central Administrativa",
      },
    ],
  },

  {
    categoria: "Jurídico e Legislação",
    itens: [
      {
        slug: "legislacao",
        nome: "Central de Legislação",
      },
      {
        slug: "leis",
        nome: "Cadastro de Leis",
      },
      {
        slug: "atualizacoes_legislacao",
        nome: "Atualizações Legislativas",
      },
      {
        slug: "favoritos_legislacao",
        nome: "Favoritos",
      },
      {
        slug: "downloads_legislacao",
        nome: "Downloads",
      },
      {
        slug: "biblioteca_documentos",
        nome: "Biblioteca de Documentos",
      },
    ],
  },

  {
    categoria: "Relatórios e Controle",
    itens: [
      {
        slug: "relatorios",
        nome: "Central de Relatórios",
      },
      {
        slug: "relatorios_operacionais",
        nome: "Relatórios Operacionais",
      },
      {
        slug: "relatorios_administrativos",
        nome: "Relatórios Administrativos",
      },
      {
        slug: "relatorios_rh",
        nome: "Relatórios de RH",
      },
      {
        slug: "relatorios_frota",
        nome: "Relatórios de Frota",
      },
      {
        slug: "relatorios_armamento",
        nome: "Relatórios de Armamento",
      },
      {
        slug: "relatorios_patrimonio",
        nome: "Relatórios de Patrimônio",
      },
      {
        slug: "estatisticas",
        nome: "Estatísticas",
      },
      {
        slug: "indicadores",
        nome: "Indicadores",
      },
      {
        slug: "auditoria",
        nome: "Auditoria",
      },
      {
        slug: "logs_acesso",
        nome: "Logs de Acesso",
      },
    ],
  },

  {
    categoria: "Comunicação",
    itens: [
      {
        slug: "comunicacao",
        nome: "Comunicação Interna",
      },
      {
        slug: "comunicados",
        nome: "Comunicados",
      },
      {
        slug: "notificacoes_push",
        nome: "Notificações Push",
      },
      {
        slug: "player_musica",
        nome: "Player de Músicas",
      },
    ],
  },

  {
    categoria: "Aplicativo e Mobilidade",
    itens: [
      {
        slug: "mobile",
        nome: "Aplicativo Mobile",
      },
      {
        slug: "pwa",
        nome: "PWA",
      },
      {
        slug: "modo_offline",
        nome: "Modo Offline",
      },
      {
        slug: "gps",
        nome: "GPS e Rastreamento",
      },
      {
        slug: "camera",
        nome: "Câmera",
      },
      {
        slug: "leitor_qr_code",
        nome: "Leitor de QR Code",
      },
      {
        slug: "assinatura_digital",
        nome: "Assinatura Digital",
      },
    ],
  },

  {
    categoria: "Configurações",
    itens: [
      {
        slug: "usuarios",
        nome: "Usuários",
      },
      {
        slug: "municipios",
        nome: "Municípios",
      },
      {
        slug: "permissoes",
        nome: "Permissões",
      },
      {
        slug: "perfis",
        nome: "Perfis",
      },
      {
        slug: "configuracoes",
        nome: "Configurações Gerais",
      },
      {
        slug: "identidade_visual",
        nome: "Identidade Visual",
      },
      {
        slug: "personalizacao_municipio",
        nome: "Personalização Municipal",
      },
      {
        slug: "importador",
        nome: "Importador de Dados",
      },
      {
        slug: "exportador",
        nome: "Exportador de Dados",
      },
      {
        slug: "migracao_dados",
        nome: "Migração de Dados",
      },
      {
        slug: "backup",
        nome: "Backup",
      },
      {
        slug: "seguranca",
        nome: "Segurança",
      },
    ],
  },

  {
    categoria: "Desenvolvedor",
    itens: [
      {
        slug: "desenvolvedor",
        nome: "Painel do Desenvolvedor",
      },
      {
        slug: "planos_assinaturas",
        nome: "Planos e Assinaturas",
      },
      {
        slug: "gerenciar_modulos",
        nome: "Gerenciar Módulos",
      },
      {
        slug: "monitoramento",
        nome: "Monitoramento do Sistema",
      },
      {
        slug: "erros_sistema",
        nome: "Erros do Sistema",
      },
      {
        slug: "logs_sistema",
        nome: "Logs do Sistema",
      },
      {
        slug: "configuracoes_tecnicas",
        nome: "Configurações Técnicas",
      },
    ],
  },

  {
    categoria: "Atualizações Futuras",
    itens: [
      {
        slug: "portal_cidadao",
        nome: "Portal do Cidadão",
      },
      {
        slug: "feed_sig",
        nome: "Central de Feeds — V2",
      },
      {
        slug: "sigia",
        nome: "SIGIA — V3",
      },
      {
        slug: "simulador_tiro",
        nome: "Simulador de Tiro a Laser",
      },
    ],
  },
];