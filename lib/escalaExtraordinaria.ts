"use client";

export type UsuarioEscalaExtra = {
  id: number | string;
  nome: string;
  perfil: string;
  municipio_id: number;
  matricula?: string;
};

export function normalizarEscalaExtra(valor: unknown) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function lerUsuarioEscalaExtra(): UsuarioEscalaExtra | null {
  if (typeof window === "undefined") return null;

  try {
    const usuario = JSON.parse(
      localStorage.getItem("usuarioLogado") || "null"
    ) as UsuarioEscalaExtra | null;

    if (!usuario?.id || !usuario?.municipio_id || !usuario?.perfil) {
      return null;
    }

    return {
      ...usuario,
      perfil: normalizarEscalaExtra(usuario.perfil),
    };
  } catch {
    return null;
  }
}

export function podeGerenciarEscalaExtra(perfil: string) {
  return [
    "DESENVOLVEDOR",
    "ADMIN",
    "COMANDANTE",
    "DIRETOR",
    "CMT_GUARNICAO",
  ].includes(normalizarEscalaExtra(perfil));
}

export function formatarDataEscalaExtra(valor?: string | null) {
  if (!valor) return "--";
  const data = new Date(`${valor}T12:00:00`);
  return Number.isNaN(data.getTime())
    ? valor
    : data.toLocaleDateString("pt-BR");
}

export function calcularHorasEscalaExtra(
  inicio?: string | null,
  fim?: string | null
) {
  if (!inicio || !fim) return 0;
  const [hi, mi] = inicio.split(":").map(Number);
  const [hf, mf] = fim.split(":").map(Number);
  let minutos = hf * 60 + mf - (hi * 60 + mi);
  if (minutos < 0) minutos += 24 * 60;
  return Number((minutos / 60).toFixed(2));
}
