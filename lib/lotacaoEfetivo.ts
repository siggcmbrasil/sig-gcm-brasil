"use client";

export type UsuarioLotacao = {
  id: string | number;
  nome: string;
  perfil: string;
  municipio_id: number;
};

export const TIPOS_MOVIMENTACAO = [
  "TRANSFERENCIA_INTERNA",
  "REMOCAO",
  "DESIGNACAO_TEMPORARIA",
  "CESSAO",
  "SUBSTITUICAO",
] as const;

export const STATUS_MOVIMENTACAO = [
  "RASCUNHO",
  "PENDENTE",
  "APROVADA",
  "NEGADA",
  "CONCLUIDA",
  "CANCELADA",
] as const;

export function normalizarPerfilLotacao(valor: unknown) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function lerUsuarioLotacao(): UsuarioLotacao | null {
  if (typeof window === "undefined") return null;

  try {
    const dados = JSON.parse(localStorage.getItem("usuarioLogado") || "null");
    if (!dados?.id || !dados?.municipio_id) return null;

    return {
      id: dados.id,
      nome: String(dados.nome || "Usuário"),
      perfil: normalizarPerfilLotacao(dados.perfil),
      municipio_id: Number(dados.municipio_id),
    };
  } catch {
    return null;
  }
}

export function podeGerenciarLotacao(perfil: string) {
  return [
    "DESENVOLVEDOR",
    "ADMIN",
    "COMANDANTE",
    "DIRETOR",
    "CMT_GUARNICAO",
  ].includes(normalizarPerfilLotacao(perfil));
}

export function formatarLotacao(valor: unknown) {
  return String(valor ?? "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letra) => letra.toUpperCase());
}
