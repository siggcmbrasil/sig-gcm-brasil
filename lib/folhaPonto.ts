"use client";

export type UsuarioFolhaPonto = {
  id: number | string;
  nome: string;
  perfil: string;
  municipio_id: number;
  matricula?: string;
};

export type LinhaFolhaPonto = {
  data: string;
  entrada: string | null;
  saida: string | null;
  trabalhado: number;
  atraso: number;
  extra: number;
  debito: number;
  situacao: string;
  observacao: string;
};

export function normalizarFolhaPonto(valor: unknown) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function lerUsuarioFolhaPonto(): UsuarioFolhaPonto | null {
  if (typeof window === "undefined") return null;

  try {
    const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado") || "null"
    ) as UsuarioFolhaPonto | null;

    if (!usuario?.id || !usuario?.municipio_id || !usuario?.perfil) {
      return null;
    }

    return {
      ...usuario,
      perfil: normalizarFolhaPonto(usuario.perfil),
    };
  } catch {
    return null;
  }
}

export function podeGerenciarFolhaPonto(perfil: string) {
  return [
    "DESENVOLVEDOR",
    "ADMIN",
    "COMANDANTE",
    "DIRETOR",
    "CMT_GUARNICAO",
  ].includes(normalizarFolhaPonto(perfil));
}

export function formatarMinutosFolhaPonto(minutos?: number | null) {
  const total = Math.max(0, Number(minutos || 0));
  return `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, "0")}min`;
}

export function formatarDataFolhaPonto(data: string) {
  return data ? data.split("-").reverse().join("/") : "--";
}

export function nomeMesFolhaPonto(mes: number) {
  return [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ][Math.max(0, Math.min(11, mes - 1))];
}

export function intervaloCompetencia(mes: number, ano: number) {
  const inicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const ultimo = new Date(ano, mes, 0).getDate();
  const fim = `${ano}-${String(mes).padStart(2, "0")}-${String(ultimo).padStart(2, "0")}`;
  return { inicio, fim };
}

export function baixarCsvFolhaPonto(
  nome: string,
  linhas: LinhaFolhaPonto[]
) {
  const cabecalho = [
    "Data", "Entrada", "Saída", "Trabalhado (min)", "Atraso (min)",
    "Extra (min)", "Débito (min)", "Situação", "Observação",
  ];

  const conteudo = [
    cabecalho,
    ...linhas.map((linha) => [
      linha.data,
      linha.entrada || "",
      linha.saida || "",
      linha.trabalhado,
      linha.atraso,
      linha.extra,
      linha.debito,
      linha.situacao,
      linha.observacao,
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
  link.download = nome;
  link.click();
  URL.revokeObjectURL(url);
}
