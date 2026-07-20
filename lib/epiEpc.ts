"use client";

export type UsuarioEpiEpc = { id: string | number; nome: string; perfil: string; municipio_id: number };

export const TIPOS_ITEM = ["EPI", "EPC"] as const;
export const STATUS_ITEM = ["ATIVO", "BLOQUEADO", "INATIVO"] as const;
export const STATUS_ENTREGA = ["EM_USO", "DEVOLVIDO", "SUBSTITUIDO", "PERDIDO", "DANIFICADO"] as const;

export function normalizarPerfilEpiEpc(valor: unknown) {
  return String(valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase().replace(/[\s-]+/g, "_");
}

export function lerUsuarioEpiEpc(): UsuarioEpiEpc | null {
  if (typeof window === "undefined") return null;
  try {
    const dados = JSON.parse(localStorage.getItem("usuarioLogado") || "null");
    if (!dados?.id || !dados?.municipio_id) return null;
    return { id: dados.id, nome: String(dados.nome || "Usuário"), perfil: normalizarPerfilEpiEpc(dados.perfil), municipio_id: Number(dados.municipio_id) };
  } catch { return null; }
}

export function podeGerenciarEpiEpc(perfil: string) {
  return ["DESENVOLVEDOR", "ADMIN", "COMANDANTE", "DIRETOR", "CMT_GUARNICAO"].includes(normalizarPerfilEpiEpc(perfil));
}

export function formatarEpiEpc(valor: unknown) {
  return String(valor ?? "").replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase());
}

export function formatarDataEpiEpc(valor?: string | null) {
  if (!valor) return "—";
  const [a,m,d] = valor.slice(0,10).split("-");
  return d && m && a ? `${d}/${m}/${a}` : valor;
}

export function diasAteEpiEpc(valor?: string | null) {
  if (!valor) return null;
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const destino = new Date(`${valor.slice(0,10)}T00:00:00`);
  return Math.ceil((destino.getTime()-hoje.getTime())/86400000);
}
