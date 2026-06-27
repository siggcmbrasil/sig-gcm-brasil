export type AgenteSIGIA =
  | "core"
  | "operacional"
  | "juridico"
  | "relatorios"
  | "frota"
  | "rh"
  | "estatisticas";

export function identificarAgente(mensagem: string): AgenteSIGIA {
  const texto = mensagem.toLowerCase();

  if (
    texto.includes("ocorrência") ||
    texto.includes("ocorrencia") ||
    texto.includes("plantão") ||
    texto.includes("plantao") ||
    texto.includes("patrulhamento")
  ) {
    return "operacional";
  }

  if (
    texto.includes("lei") ||
    texto.includes("legislação") ||
    texto.includes("legislacao") ||
    texto.includes("artigo") ||
    texto.includes("jurídico") ||
    texto.includes("juridico")
  ) {
    return "juridico";
  }

  if (
    texto.includes("relatório") ||
    texto.includes("relatorio") ||
    texto.includes("pdf") ||
    texto.includes("resumo")
  ) {
    return "relatorios";
  }

  if (
    texto.includes("viatura") ||
    texto.includes("frota") ||
    texto.includes("placa") ||
    texto.includes("veículo") ||
    texto.includes("veiculo")
  ) {
    return "frota";
  }

  if (
    texto.includes("guarda") ||
    texto.includes("gcm") ||
    texto.includes("efetivo") ||
    texto.includes("matrícula") ||
    texto.includes("matricula")
  ) {
    return "rh";
  }

  if (
    texto.includes("estatística") ||
    texto.includes("estatistica") ||
    texto.includes("quantas") ||
    texto.includes("total") ||
    texto.includes("ranking")
  ) {
    return "estatisticas";
  }

  return "core";
}

export function responderAgente(agente: AgenteSIGIA, mensagem: string) {
  switch (agente) {
    case "operacional":
      return `🚔 Agente Operacional acionado.

Posso auxiliar com:
• geração de ocorrência;
• consulta de plantão;
• patrulhamentos;
• chamados;
• guarnições;
• resumo operacional.

Mensagem recebida:
"${mensagem}"`;

    case "juridico":
      return `⚖️ Agente Jurídico acionado.

Posso auxiliar com:
• Lei 13.022/2014;
• Código Penal;
• CTB;
• ECA;
• Maria da Penha;
• Estatuto do Desarmamento;
• legislação municipal.

Em breve farei consultas jurídicas com base organizada.`;

    case "relatorios":
      return `📄 Agente de Relatórios acionado.

Posso auxiliar com:
• relatório de plantão;
• resumo de ocorrências;
• relatório para comando;
• relatório para secretaria;
• documentos institucionais.

Na próxima etapa, vou buscar dados reais do SIG.`;

    case "frota":
      return `🚔 Agente de Frota acionado.

Posso auxiliar com:
• consulta de viaturas;
• status da frota;
• placa;
• manutenção;
• abastecimento;
• disponibilidade operacional.

Em breve estarei conectada à Central de Frota.`;

    case "rh":
      return `👮 Agente de RH acionado.

Posso auxiliar com:
• consulta de guardas;
• matrícula;
• situação funcional;
• guarnição;
• documentos;
• histórico profissional.

Em breve estarei conectada à Central de RH.`;

    case "estatisticas":
      return `📊 Agente Estatístico acionado.

Posso auxiliar com:
• total de ocorrências;
• ranking por tipo;
• horários críticos;
• locais recorrentes;
• análise criminal;
• indicadores do município.

Na próxima etapa, vou consultar o banco de dados.`;

    default:
      return `🧠 SIGIA Core acionada.

Sou a Inteligência Artificial do SIG-GCM Brasil.

Posso direcionar sua solicitação para agentes especializados:
• Operacional;
• Jurídico;
• Relatórios;
• Frota;
• RH;
• Estatísticas.

Digite, por exemplo:
"Gerar ocorrência"
"Consultar viatura"
"Criar relatório"
"Quantas ocorrências hoje?"`;
  }
}

export function querOcorrenciasHoje(mensagem: string) {
  const texto = mensagem.toLowerCase();

  return (
    texto.includes("ocorrências hoje") ||
    texto.includes("ocorrencias hoje") ||
    texto.includes("quantas ocorrências") ||
    texto.includes("quantas ocorrencias") ||
    texto.includes("total de ocorrências") ||
    texto.includes("total de ocorrencias")
  );
}