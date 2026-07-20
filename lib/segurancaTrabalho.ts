"use client";

export type UsuarioSegurancaTrabalho = {
  id: string | number;
  nome: string;
  perfil: string;
  municipio_id: number;
};

export const CATEGORIAS_RISCO = [
  "FISICO",
  "QUIMICO",
  "BIOLOGICO",
  "ERGONOMICO",
  "ACIDENTE",
  "PSICOSSOCIAL",
] as const;

export const NIVEIS_RISCO = [
  "BAIXO",
  "MODERADO",
  "ALTO",
  "CRITICO",
] as const;

export function normalizarPerfilSeguranca(valor: unknown) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function lerUsuarioSeguranca(): UsuarioSegurancaTrabalho | null {
  if (typeof window === "undefined") return null;

  try {
    const dados = JSON.parse(localStorage.getItem("usuarioLogado") || "null");
    if (!dados?.id || !dados?.municipio_id) return null;

    return {
      id: dados.id,
      nome: String(dados.nome || "Usuário"),
      perfil: normalizarPerfilSeguranca(dados.perfil),
      municipio_id: Number(dados.municipio_id),
    };
  } catch {
    return null;
  }
}

export function podeGerenciarSeguranca(perfil: string) {
  return [
    "DESENVOLVEDOR",
    "ADMIN",
    "COMANDANTE",
    "DIRETOR",
    "CMT_GUARNICAO",
  ].includes(normalizarPerfilSeguranca(perfil));
}

export function formatarSeguranca(valor: unknown) {
  return String(valor ?? "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letra) => letra.toUpperCase());
}

export function formatarDataSeguranca(valor?: string | null) {
  if (!valor) return "—";
  const [ano, mes, dia] = valor.slice(0, 10).split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : valor;
}

export function diasAteSeguranca(valor?: string | null) {
  if (!valor) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const destino = new Date(`${valor.slice(0, 10)}T00:00:00`);
  return Math.ceil((destino.getTime() - hoje.getTime()) / 86400000);
}
