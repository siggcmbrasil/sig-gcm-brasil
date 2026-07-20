"use client";

export type UsuarioFeriasLicencas = {
  id: number | string;
  nome: string;
  perfil: string;
  municipio_id: number;
  matricula?: string;
};

export function normalizarFeriasLicencas(valor: unknown) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function lerUsuarioFeriasLicencas(): UsuarioFeriasLicencas | null {
  if (typeof window === "undefined") return null;

  try {
    const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado") || "null"
    ) as UsuarioFeriasLicencas | null;

    if (!usuario?.id || !usuario?.municipio_id || !usuario?.perfil) {
      return null;
    }

    return {
      ...usuario,
      perfil: normalizarFeriasLicencas(usuario.perfil),
    };
  } catch {
    return null;
  }
}

export function podeGerenciarFeriasLicencas(perfil: string) {
  return [
    "DESENVOLVEDOR",
    "ADMIN",
    "COMANDANTE",
    "DIRETOR",
    "CMT_GUARNICAO",
  ].includes(normalizarFeriasLicencas(perfil));
}

export function formatarDataFeriasLicencas(valor?: string | null) {
  if (!valor) return "--";
  const data = new Date(`${valor}T12:00:00`);
  return Number.isNaN(data.getTime())
    ? valor
    : data.toLocaleDateString("pt-BR");
}

export function nomeTipoFeriasLicencas(tipo: string) {
  const nomes: Record<string, string> = {
    FERIAS: "Férias",
    LICENCA_MEDICA: "Licença médica",
    LICENCA_PREMIO: "Licença-prêmio",
    LICENCA_MATERNIDADE: "Licença-maternidade",
    LICENCA_PATERNIDADE: "Licença-paternidade",
    ATESTADO: "Atestado",
    CURSO: "Curso",
    AFASTAMENTO: "Afastamento",
    OUTROS: "Outros",
  };

  return nomes[normalizarFeriasLicencas(tipo)] || tipo.replaceAll("_", " ");
}
