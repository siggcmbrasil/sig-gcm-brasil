"use client";

export type UsuarioAvaliacao = {
  id: string | number;
  nome: string;
  perfil: string;
  municipio_id: number;
};

export const CRITERIOS_PADRAO = [
  { chave: "disciplina", nome: "Disciplina", peso: 1 },
  { chave: "assiduidade", nome: "Assiduidade", peso: 1 },
  { chave: "pontualidade", nome: "Pontualidade", peso: 1 },
  { chave: "produtividade", nome: "Produtividade", peso: 1.5 },
  { chave: "postura_profissional", nome: "Postura profissional", peso: 1 },
  { chave: "trabalho_equipe", nome: "Trabalho em equipe", peso: 1 },
  { chave: "cumprimento_ordens", nome: "Cumprimento de ordens", peso: 1 },
  { chave: "conhecimento_tecnico", nome: "Conhecimento técnico", peso: 1.5 },
  { chave: "atendimento_cidadao", nome: "Atendimento ao cidadão", peso: 1 },
] as const;

export type CriterioAvaliacao = {
  chave: string;
  nome: string;
  peso: number;
  nota: number;
  observacao?: string;
};

export function normalizarPerfil(valor: unknown) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function lerUsuarioAvaliacao(): UsuarioAvaliacao | null {
  if (typeof window === "undefined") return null;
  try {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "null");
    if (!usuario?.id || !usuario?.municipio_id) return null;
    return {
      id: usuario.id,
      nome: String(usuario.nome || "Usuário"),
      perfil: normalizarPerfil(usuario.perfil),
      municipio_id: Number(usuario.municipio_id),
    };
  } catch {
    return null;
  }
}

export function podeGerenciarAvaliacoes(perfil: string) {
  return [
    "DESENVOLVEDOR",
    "ADMIN",
    "COMANDANTE",
    "DIRETOR",
    "CMT_GUARNICAO",
    "CORREGEDOR",
  ].includes(normalizarPerfil(perfil));
}

export function calcularMedia(criterios: CriterioAvaliacao[]) {
  const pesoTotal = criterios.reduce((soma, item) => soma + Number(item.peso || 0), 0);
  if (pesoTotal <= 0) return 0;
  const soma = criterios.reduce(
    (total, item) => total + Number(item.nota || 0) * Number(item.peso || 0),
    0
  );
  return Number((soma / pesoTotal).toFixed(2));
}

export function conceitoDaMedia(media: number) {
  if (media >= 9) return "EXCELENTE";
  if (media >= 8) return "MUITO_BOM";
  if (media >= 7) return "BOM";
  if (media >= 6) return "REGULAR";
  return "INSATISFATORIO";
}

export function formatarConceito(valor: unknown) {
  return String(valor ?? "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letra) => letra.toUpperCase());
}
