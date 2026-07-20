"use client";

export type UsuarioRelatorioProdutividade = {
  id: number | string;
  nome: string;
  perfil: string;
  municipio_id: number;
};

export type LinhaProdutividade = {
  guarda_id: number;
  nome: string;
  matricula: string;
  guarnicao: string;
  jornadas: number;
  atrasos: number;
  faltas: number;
  justificativas: number;
  minutos_extras: number;
  minutos_debito: number;
  afastamentos: number;
  ocorrencias: number;
  patrulhamentos: number;
  visitas: number;
  escalas_extras: number;
  pontos: number;
};

export function normalizarRelatorio(valor: unknown) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function lerUsuarioRelatorio(): UsuarioRelatorioProdutividade | null {
  if (typeof window === "undefined") return null;
  try {
    const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado") || "null"
    ) as UsuarioRelatorioProdutividade | null;

    if (!usuario?.id || !usuario?.municipio_id) return null;

    return {
      ...usuario,
      perfil: normalizarRelatorio(usuario.perfil),
    };
  } catch {
    return null;
  }
}

export function podeVerRelatorioProdutividade(perfil: string) {
  return [
    "DESENVOLVEDOR",
    "ADMIN",
    "COMANDANTE",
    "DIRETOR",
    "CMT_GUARNICAO",
    "PLANTONISTA",
  ].includes(normalizarRelatorio(perfil));
}

export function formatarMinutosRelatorio(minutos: number) {
  const total = Math.max(0, Number(minutos || 0));
  return `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, "0")}min`;
}

export function hojeIso() {
  return new Date().toISOString().slice(0, 10);
}

export function primeiroDiaMesIso() {
  const data = new Date();
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-01`;
}

export function baixarCsvProdutividade(
  linhas: LinhaProdutividade[],
  dataInicial: string,
  dataFinal: string
) {
  const cabecalho = [
    "Posição",
    "Nome",
    "Matrícula",
    "Guarnição",
    "Jornadas",
    "Atrasos",
    "Faltas",
    "Justificativas",
    "Horas extras (min)",
    "Débitos (min)",
    "Afastamentos",
    "Ocorrências",
    "Patrulhamentos",
    "Visitas",
    "Escalas extras",
    "Pontuação",
  ];

  const conteudo = [
    cabecalho,
    ...linhas.map((linha, indice) => [
      indice + 1,
      linha.nome,
      linha.matricula,
      linha.guarnicao,
      linha.jornadas,
      linha.atrasos,
      linha.faltas,
      linha.justificativas,
      linha.minutos_extras,
      linha.minutos_debito,
      linha.afastamentos,
      linha.ocorrencias,
      linha.patrulhamentos,
      linha.visitas,
      linha.escalas_extras,
      linha.pontos,
    ]),
  ]
    .map((linha) =>
      linha
        .map((valor) => `"${String(valor).replaceAll('"', '""')}"`)
        .join(";")
    )
    .join("\n");

  const blob = new Blob(["\uFEFF" + conteudo], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `frequencia-produtividade-${dataInicial}-${dataFinal}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
