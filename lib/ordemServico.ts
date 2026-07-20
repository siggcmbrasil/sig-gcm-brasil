"use client";

export type UsuarioOS = {
  id: string | number;
  nome: string;
  perfil: string;
  municipio_id?: number;
  matricula?: string;
};

export function normalizarOS(valor: unknown) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

export function lerUsuarioOS(): UsuarioOS | null {
  if (typeof window === "undefined") return null;

  try {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "null") as UsuarioOS | null;
    if (!usuario?.id || !usuario?.perfil || !usuario?.municipio_id) return null;
    return { ...usuario, perfil: normalizarOS(usuario.perfil) };
  } catch {
    return null;
  }
}

export function podeGerenciarOS(perfil: string) {
  return ["DESENVOLVEDOR", "ADMIN", "COMANDANTE", "DIRETOR", "CMT_GUARNICAO"].includes(
    normalizarOS(perfil)
  );
}

export function formatarDataOS(valor?: string | null) {
  if (!valor) return "--";
  const data = new Date(`${valor}T12:00:00`);
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleDateString("pt-BR");
}

export function estiloStatusOS(status: string) {
  const normalizado = normalizarOS(status);
  if (normalizado === "CONCLUIDA") return "border-emerald-400/25 bg-emerald-400/10 text-emerald-300";
  if (normalizado === "EM_ANDAMENTO") return "border-cyan-400/25 bg-cyan-400/10 text-cyan-300";
  if (normalizado === "PUBLICADA") return "border-blue-400/25 bg-blue-400/10 text-blue-300";
  if (normalizado === "CANCELADA") return "border-rose-400/25 bg-rose-400/10 text-rose-300";
  return "border-slate-600 bg-slate-800/60 text-slate-300";
}

export function estiloPrioridadeOS(prioridade: string) {
  const normalizado = normalizarOS(prioridade);
  if (normalizado === "URGENTE") return "text-rose-300";
  if (normalizado === "ALTA") return "text-amber-300";
  if (normalizado === "BAIXA") return "text-slate-400";
  return "text-cyan-300";
}
