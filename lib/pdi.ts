"use client";

export type UsuarioPdi = {
  id: string | number;
  nome: string;
  perfil: string;
  municipio_id: number;
};

export type MetaPdi = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  prioridade: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
  prazo: string;
  responsavel: string;
  progresso: number;
  status: "NAO_INICIADA" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA";
  evidencia: string;
};

export function normalizarPerfilPdi(valor: unknown) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function lerUsuarioPdi(): UsuarioPdi | null {
  if (typeof window === "undefined") return null;

  try {
    const dados = JSON.parse(localStorage.getItem("usuarioLogado") || "null");
    if (!dados?.id || !dados?.municipio_id) return null;

    return {
      id: dados.id,
      nome: String(dados.nome || "Usuário"),
      perfil: normalizarPerfilPdi(dados.perfil),
      municipio_id: Number(dados.municipio_id),
    };
  } catch {
    return null;
  }
}

export function podeGerenciarPdi(perfil: string) {
  return [
    "DESENVOLVEDOR",
    "ADMIN",
    "COMANDANTE",
    "DIRETOR",
    "CMT_GUARNICAO",
    "CORREGEDOR",
  ].includes(normalizarPerfilPdi(perfil));
}

export function criarMetaVazia(): MetaPdi {
  return {
    id: crypto.randomUUID(),
    titulo: "",
    descricao: "",
    categoria: "COMPETENCIA",
    prioridade: "MEDIA",
    prazo: "",
    responsavel: "",
    progresso: 0,
    status: "NAO_INICIADA",
    evidencia: "",
  };
}

export function calcularProgressoPdi(metas: MetaPdi[]) {
  if (!metas.length) return 0;
  const total = metas.reduce(
    (soma, meta) => soma + Math.min(100, Math.max(0, Number(meta.progresso || 0))),
    0
  );
  return Math.round(total / metas.length);
}

export function formatarStatusPdi(valor: unknown) {
  return String(valor ?? "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letra) => letra.toUpperCase());
}
