"use client";

export type UsuarioCompetencia = {
  id: string | number;
  nome: string;
  perfil: string;
  municipio_id: number;
};

export const NIVEIS_COMPETENCIA = [
  { valor: 1, titulo: "Básico" },
  { valor: 2, titulo: "Intermediário" },
  { valor: 3, titulo: "Avançado" },
  { valor: 4, titulo: "Especialista" },
] as const;

export function normalizarPerfilCompetencia(valor: unknown) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function lerUsuarioCompetencia(): UsuarioCompetencia | null {
  if (typeof window === "undefined") return null;

  try {
    const dados = JSON.parse(localStorage.getItem("usuarioLogado") || "null");
    if (!dados?.id || !dados?.municipio_id) return null;

    return {
      id: dados.id,
      nome: String(dados.nome || "Usuário"),
      perfil: normalizarPerfilCompetencia(dados.perfil),
      municipio_id: Number(dados.municipio_id),
    };
  } catch {
    return null;
  }
}

export function podeGerenciarCompetencias(perfil: string) {
  return [
    "DESENVOLVEDOR",
    "ADMIN",
    "COMANDANTE",
    "DIRETOR",
    "CMT_GUARNICAO",
    "CORREGEDOR",
  ].includes(normalizarPerfilCompetencia(perfil));
}

export function formatarTextoCompetencia(valor: unknown) {
  return String(valor ?? "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letra) => letra.toUpperCase());
}

export function nomeNivelCompetencia(nivel: number | null | undefined) {
  return (
    NIVEIS_COMPETENCIA.find((item) => item.valor === Number(nivel))?.titulo ||
    "Não avaliado"
  );
}

export function calcularLacuna(nivelAtual: number, nivelExigido: number) {
  return Math.max(0, Number(nivelExigido || 0) - Number(nivelAtual || 0));
}
