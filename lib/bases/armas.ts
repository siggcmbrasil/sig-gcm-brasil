export const TIPOS_ARMA_FOGO = [
  "Revólver",
  "Pistola",
  "Espingarda",
  "Carabina",
  "Fuzil",
  "Rifle",
  "Garrucha",
  "Submetralhadora",
  "Outro",
];

export const MARCAS_ARMA_FOGO = [
  "Taurus",
  "CBC",
  "Imbel",
  "Glock",
  "Beretta",
  "Sig Sauer",
  "Rossi",
  "Boito",
  "Winchester",
  "Smith & Wesson",
  "Colt",
  "CZ",
  "Outra",
];

export const CALIBRES_ARMA_FOGO = [
  ".22",
  ".32",
  ".38",
  ".380",
  "9mm",
  ".40",
  ".45",
  "12",
  "16",
  "20",
  "28",
  "36",
  "5.56",
  "7.62",
  "Outro",
];

export const TIPOS_ARMA_BRANCA = [
  "Faca",
  "Facão",
  "Canivete",
  "Punhal",
  "Machado",
  "Tesoura",
  "Estilete",
  "Foice",
  "Espada",
  "Outro",
];

export const SITUACOES_ARMA = [
  "APREENDIDA",
  "ENCONTRADA",
  "ENTREGUE",
  "RECUPERADA",
  "SEM NUMERAÇÃO",
  "NUMERAÇÃO SUPRIMIDA",
  "COM MUNIÇÃO",
  "SEM MUNIÇÃO",
];

export const MARCAS_MODELOS_ARMA_FOGO: Record<string, string[]> = {
  Taurus: [
    "PT 58",
    "PT 59",
    "PT 92",
    "PT 100",
    "PT 101",
    "PT 111",
    "PT 140",
    "TH9",
    "TH40",
    "G2C",
    "GX4",
    "TS9",
    "RT 82",
    "RT 85",
    "RT 88",
    "RT 889",
    "Judge",
    "Outro",
  ],

  Glock: [
    "G17",
    "G19",
    "G22",
    "G23",
    "G26",
    "G34",
    "G42",
    "G43",
    "G45",
    "G48",
    "Outro",
  ],

  Imbel: [
    "MD1",
    "MD2",
    "MD5",
    "IA2",
    "GC",
    "M973",
    "Outro",
  ],

  CBC: [
    "Espingarda Pump",
    "Espingarda Monotiro",
    "Carabina 7022",
    "Carabina 8122",
    "Outro",
  ],

  Rossi: [
    "Revolver 38",
    "Revolver 357",
    "Carabina Puma",
    "Espingarda",
    "Outro",
  ],

  Boito: [
    "Espingarda Monotiro",
    "Espingarda Dois Canos",
    "Espingarda Pump",
    "Outro",
  ],

  Beretta: [
    "92FS",
    "APX",
    "PX4 Storm",
    "M9",
    "Outro",
  ],

  "Sig Sauer": [
    "P226",
    "P229",
    "P320",
    "P365",
    "MCX",
    "Outro",
  ],

  "Smith & Wesson": [
    "Model 10",
    "Model 19",
    "Model 36",
    "Model 60",
    "M&P9",
    "M&P40",
    "Outro",
  ],

  Colt: [
    "1911",
    "Python",
    "Detective Special",
    "M4",
    "Outro",
  ],

  CZ: [
    "CZ 75",
    "CZ P-10",
    "CZ Shadow",
    "CZ Scorpion",
    "Outro",
  ],

  Winchester: [
    "Rifle 70",
    "Rifle 94",
    "Espingarda SXP",
    "Outro",
  ],

  Outra: ["Outro"],
};