export type AgenteSIGIA =
  | "core"
  | "operacional"
  | "juridico"
  | "relatorios"
  | "frota"
  | "rh"
  | "estatisticas"
  | "inteligencia"
  | "administrativo"
  | "patrimonio"
  | "armamento"
  | "ensino"
  | "comunicacao";

function normalizarTexto(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function contemAlgum(
  texto: string,
  termos: string[]
) {
  return termos.some((termo) =>
    texto.includes(
      normalizarTexto(termo)
    )
  );
}

export function identificarAgente(
  mensagem: string
): AgenteSIGIA {
  const texto =
    normalizarTexto(mensagem);

  if (
    contemAlgum(texto, [
      "ocorrencia",
      "plantao",
      "escala",
      "guarnicao",
      "patrulhamento",
      "visita",
      "chamado",
      "atendimento",
      "abordagem",
      "operacao",
      "mapa operacional",
      "quem esta de servico",
      "quem esta trabalhando",
      "equipe de hoje",
    ])
  ) {
    return "operacional";
  }

  if (
    contemAlgum(texto, [
      "lei",
      "legislacao",
      "artigo",
      "juridico",
      "constituicao",
      "codigo penal",
      "ctb",
      "eca",
      "maria da penha",
      "estatuto",
      "decreto",
      "portaria",
      "resolucao",
      "norma",
    ])
  ) {
    return "juridico";
  }

  if (
    contemAlgum(texto, [
      "relatorio",
      "pdf",
      "resumo",
      "documento",
      "oficio",
      "memorando",
      "declaracao",
      "certidao",
      "exportar",
      "imprimir",
    ])
  ) {
    return "relatorios";
  }

  if (
    contemAlgum(texto, [
      "viatura",
      "frota",
      "placa",
      "veiculo",
      "abastecimento",
      "combustivel",
      "manutencao",
      "pneu",
      "quilometragem",
      "disponivel",
      "indisponivel",
    ])
  ) {
    return "frota";
  }

  if (
    contemAlgum(texto, [
      "guarda",
      "gcm",
      "efetivo",
      "matricula",
      "servidor",
      "ferias",
      "atestado",
      "afastamento",
      "banco de horas",
      "advertencia",
      "dossie",
      "aniversariante",
    ])
  ) {
    return "rh";
  }

  if (
    contemAlgum(texto, [
      "estatistica",
      "quantas",
      "quantos",
      "total",
      "ranking",
      "percentual",
      "media",
      "indicador",
      "comparar",
      "comparacao",
      "mais frequente",
      "menos frequente",
      "horario critico",
      "bairro com mais",
    ])
  ) {
    return "estatisticas";
  }

  if (
    contemAlgum(texto, [
      "inteligencia",
      "analise criminal",
      "padrao",
      "suspeito",
      "recorrencia",
      "mapa de calor",
      "vinculo",
      "rede",
      "risco",
      "alerta intermunicipal",
    ])
  ) {
    return "inteligencia";
  }

  if (
    contemAlgum(texto, [
      "usuario",
      "permissao",
      "perfil",
      "municipio",
      "configuracao",
      "auditoria",
      "backup",
      "importacao",
      "exportacao",
      "sistema",
    ])
  ) {
    return "administrativo";
  }

  if (
    contemAlgum(texto, [
      "patrimonio",
      "bem",
      "tombamento",
      "movimentacao",
      "baixa",
      "inventario",
      "qr code",
      "material",
    ])
  ) {
    return "patrimonio";
  }

  if (
    contemAlgum(texto, [
      "arma",
      "armamento",
      "cautela",
      "municao",
      "calibre",
      "pistola",
      "revolver",
      "carabina",
      "armaria",
    ])
  ) {
    return "armamento";
  }

  if (
    contemAlgum(texto, [
      "curso",
      "aula",
      "treinamento",
      "ensino",
      "prova",
      "avaliacao",
      "certificado",
      "material didatico",
    ])
  ) {
    return "ensino";
  }

  if (
    contemAlgum(texto, [
      "feed",
      "comunicado",
      "aviso",
      "noticia",
      "publicacao",
      "mensagem interna",
      "comunicacao",
    ])
  ) {
    return "comunicacao";
  }

  return "core";
}

export function responderAgente(
  agente: AgenteSIGIA,
  mensagem: string
) {
  switch (agente) {
    case "operacional":
      return `🚔 Agente Operacional acionado.

Posso consultar e auxiliar com:
• plantão e escala do dia;
• guarnições e equipes;
• ocorrências;
• chamados;
• patrulhamentos;
• visitas;
• operações;
• mapa operacional;
• geração de narrativas.

Solicitação recebida:
"${mensagem}"`;

    case "juridico":
      return `⚖️ Agente Jurídico acionado.

Posso pesquisar legislação interna, municipal, estadual e federal, além de documentos cadastrados no SIG.

Solicitação recebida:
"${mensagem}"`;

    case "relatorios":
      return `📄 Agente de Relatórios acionado.

Posso ajudar com relatórios operacionais, administrativos, estatísticos, de plantão, de ocorrências e documentos institucionais.

Solicitação recebida:
"${mensagem}"`;

    case "frota":
      return `🚔 Agente de Frota acionado.

Posso consultar viaturas, disponibilidade, manutenção, abastecimentos, pneus, danos, quilometragem e histórico da frota.

Solicitação recebida:
"${mensagem}"`;

    case "rh":
      return `👮 Agente de RH acionado.

Posso consultar guardas, matrículas, escalas, guarnições, férias, atestados, banco de horas, afastamentos e dossiês.

Solicitação recebida:
"${mensagem}"`;

    case "estatisticas":
      return `📊 Agente Estatístico acionado.

Posso analisar totais, rankings, períodos, horários críticos, locais recorrentes, tipos de ocorrência e indicadores do município.

Solicitação recebida:
"${mensagem}"`;

    case "inteligencia":
      return `🧠 Agente de Inteligência acionado.

Posso cruzar dados autorizados, identificar padrões, recorrências, vínculos, riscos e alertas operacionais.

Solicitação recebida:
"${mensagem}"`;

    case "administrativo":
      return `⚙️ Agente Administrativo acionado.

Posso auxiliar com usuários, permissões, municípios, configurações, auditoria, importações, exportações e rotinas administrativas.

Solicitação recebida:
"${mensagem}"`;

    case "patrimonio":
      return `📦 Agente de Patrimônio acionado.

Posso consultar bens, inventário, movimentações, baixas, responsáveis e histórico patrimonial.

Solicitação recebida:
"${mensagem}"`;

    case "armamento":
      return `🔐 Agente de Armamento acionado.

Posso auxiliar com armamentos, cautelas, munições, documentos, situação e histórico da armaria.

Solicitação recebida:
"${mensagem}"`;

    case "ensino":
      return `🎓 Agente de Ensino acionado.

Posso auxiliar com cursos, treinamentos, avaliações, materiais, certificados e trilhas de aprendizagem.

Solicitação recebida:
"${mensagem}"`;

    case "comunicacao":
      return `📢 Agente de Comunicação acionado.

Posso auxiliar com avisos, comunicados, feed interno, publicações, notícias e mensagens institucionais.

Solicitação recebida:
"${mensagem}"`;

    default:
      return `🧠 SIGIA Core acionada.

Posso consultar dados reais dos módulos autorizados do SIG-GCM Brasil, analisar documentos, pesquisar conhecimento institucional e direcionar a solicitação ao agente especializado correto.

Solicitação recebida:
"${mensagem}"`;
  }
}

export function querOcorrenciasHoje(
  mensagem: string
) {
  const texto =
    normalizarTexto(mensagem);

  return contemAlgum(texto, [
    "ocorrencias hoje",
    "quantas ocorrencias",
    "total de ocorrencias",
    "ocorrencias do dia",
    "registro de hoje",
    "atendimentos hoje",
  ]);
}

export function querPlantaoHoje(
  mensagem: string
) {
  const texto =
    normalizarTexto(mensagem);

  return contemAlgum(texto, [
    "quem esta de plantao",
    "quem esta no plantao",
    "plantao de hoje",
    "escala de hoje",
    "quem esta de servico",
    "quem esta trabalhando hoje",
    "equipe de hoje",
    "guarnicao de hoje",
    "guardas de plantao",
  ]);
}