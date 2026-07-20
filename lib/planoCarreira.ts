"use client";

export type UsuarioCarreira = { id: string | number; nome: string; perfil: string; municipio_id: number };

export const STATUS_PROCESSO = ["RASCUNHO", "EM_ANALISE", "APTO", "INAPTO", "HOMOLOGADO", "CANCELADO"] as const;
export const TIPOS_PROMOCAO = ["ANTIGUIDADE", "MERECIMENTO", "PROGRESSAO", "REENQUADRAMENTO"] as const;

export function normalizarPerfilCarreira(valor: unknown) {
  return String(valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase().replace(/[\s-]+/g, "_");
}

export function lerUsuarioCarreira(): UsuarioCarreira | null {
  if (typeof window === "undefined") return null;
  try {
    const dados = JSON.parse(localStorage.getItem("usuarioLogado") || "null");
    if (!dados?.id || !dados?.municipio_id) return null;
    return { id: dados.id, nome: String(dados.nome || "Usuário"), perfil: normalizarPerfilCarreira(dados.perfil), municipio_id: Number(dados.municipio_id) };
  } catch { return null; }
}

export function podeGerenciarCarreira(perfil: string) {
  return ["DESENVOLVEDOR", "ADMIN", "COMANDANTE", "DIRETOR", "CORREGEDOR"].includes(normalizarPerfilCarreira(perfil));
}

export function formatarCarreira(valor: unknown) {
  return String(valor ?? "").replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (l) => l.toUpperCase());
}
