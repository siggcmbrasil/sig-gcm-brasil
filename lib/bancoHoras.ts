"use client";

export type UsuarioBancoHoras = {
  id: string | number;
  nome: string;
  perfil: string;
  municipio_id?: number;
  matricula?: string;
};

export function normalizarBancoHoras(valor: unknown) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

export function lerUsuarioBancoHoras(): UsuarioBancoHoras | null {
  if (typeof window === "undefined") return null;

  try {
    const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado") || "null"
    ) as UsuarioBancoHoras | null;

    if (!usuario?.id || !usuario?.perfil || !usuario?.municipio_id) {
      return null;
    }

    return {
      ...usuario,
      perfil: normalizarBancoHoras(usuario.perfil),
    };
  } catch {
    return null;
  }
}

export function podeGerenciarBancoHoras(perfil: string) {
  return [
    "DESENVOLVEDOR",
    "ADMIN",
    "COMANDANTE",
    "DIRETOR",
    "CMT_GUARNICAO",
  ].includes(normalizarBancoHoras(perfil));
}

export function formatarHoras(valor: number) {
  const absoluto = Math.abs(Number(valor || 0));
  const horas = Math.floor(absoluto);
  const minutos = Math.round((absoluto - horas) * 60);
  return `${valor < 0 ? "-" : ""}${horas}h${String(minutos).padStart(2, "0")}`;
}

export function formatarDataBancoHoras(valor?: string | null) {
  if (!valor) return "--";
  const data = new Date(`${valor}T12:00:00`);
  return Number.isNaN(data.getTime())
    ? valor
    : data.toLocaleDateString("pt-BR");
}
