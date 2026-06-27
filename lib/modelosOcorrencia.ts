export const TIPOS_OCORRENCIA = [
  "Perturbação do sossego",
  "Averiguação de denúncia",
  "Abordagem a pessoa suspeita",
  "Veículo abandonado",
  "Acidente de trânsito",
  "Apoio ao SAMU",
  "Apoio ao Conselho Tutelar",
  "Apoio à Polícia Militar",
  "Furto",
  "Roubo",
  "Dano ao patrimônio",
  "Maria da Penha",
  "Tráfico / Drogas",
  "Ronda escolar",
  "Apoio em evento",
  "Fiscalização",
  "Animais soltos",
  "Vias de fato",
  "Ameaça",
  "Desinteligência familiar",
  "Objeto encontrado",
  "Veículo recuperado",
  "Menor em situação de risco",
  "Apoio à saúde",
];

export const TIPOS_ENVOLVIDO = [
  "SOLICITANTE",
  "VÍTIMA",
  "AUTOR",
  "SUSPEITO",
  "TESTEMUNHA",
  "CONDUTOR",
  "PROPRIETÁRIO",
  "RESPONSÁVEL",
  "MENOR",
  "ACOMPANHANTE",
];

export const SITUACOES_VEICULO = [
  "ABORDADO",
  "ACIDENTE",
  "APREENDIDO",
  "RECUPERADO",
  "ABANDONADO",
  "FURTO/ROUBO",
  "SUSPEITO",
  "SEM RESTRIÇÃO",
  "COM RESTRIÇÃO",
  "REMOVIDO",
  "LIBERADO",
];

export const OBJETOS_PREDEFINIDOS = {
  "Arma de fogo": {
    tipos: ["Revólver", "Pistola", "Espingarda", "Carabina", "Fuzil", "Garrucha"],
    campos: ["marca", "modelo", "calibre", "numeração", "munições", "situação"],
  },

  "Arma branca": {
    tipos: ["Faca", "Facão", "Canivete", "Punhal", "Machado", "Tesoura"],
    campos: ["tipo", "tamanho", "marca", "situação"],
  },

  Celular: {
    marcas: {
      Apple: [
        "iPhone 8",
        "iPhone X",
        "iPhone 11",
        "iPhone 12",
        "iPhone 13",
        "iPhone 14",
        "iPhone 15",
        "iPhone 16",
        "iPhone 17",
      ],
      Samsung: [
        "Galaxy A10",
        "Galaxy A20",
        "Galaxy A30",
        "Galaxy A50",
        "Galaxy A71",
        "Galaxy S20",
        "Galaxy S21",
        "Galaxy S22",
        "Galaxy S23",
        "Galaxy S24",
      ],
      Motorola: ["Moto G8", "Moto G9", "Moto G10", "Moto G20", "Moto G30", "Moto G60"],
      Xiaomi: ["Redmi Note 8", "Redmi Note 9", "Redmi Note 10", "Redmi Note 11", "Redmi Note 12", "Redmi Note 13"],
    },
    campos: ["marca", "modelo", "imei", "cor", "chip", "situação"],
  },

  Documento: {
    tipos: ["RG", "CPF", "CNH", "Título de Eleitor", "Certidão", "Carteira Funcional"],
    campos: ["tipo", "número", "nome", "situação"],
  },

  Dinheiro: {
    tipos: ["Espécie", "Moeda", "Cheque"],
    campos: ["valor", "quantidade", "observação", "situação"],
  },

  Droga: {
    tipos: ["Maconha", "Cocaína", "Crack", "Comprimidos", "Substância semelhante"],
    campos: ["tipo", "quantidade", "peso", "unidade_peso", "situação"],
  },
};

export const SITUACOES_OBJETO = [
  "APREENDIDO",
  "RECUPERADO",
  "ENCONTRADO",
  "ENTREGUE",
  "DEVOLVIDO",
  "DANIFICADO",
  "SEM IDENTIFICAÇÃO",
];