"use client";

export type UsuarioConcursos = {
  id: string | number;
  nome: string;
  perfil: string;
  municipio_id: number;
};

export const STATUS_CONCURSO = [
  "PLANEJADO",
  "EDITAL_PUBLICADO",
  "INSCRICOES",
  "EM_ANDAMENTO",
  "HOMOLOGADO",
  "ENCERRADO",
  "CANCELADO",
] as const;

export const STATUS_CANDIDATO = [
  "INSCRITO",
  "CLASSIFICADO",
  "APROVADO",
  "CADASTRO_RESERVA",
  "CONVOCADO",
  "EM_ANALISE_DOCUMENTAL",
  "APTO",
  "INAPTO",
  "DESISTENTE",
  "NOMEADO",
  "EMPOSSADO",
  "EM_EXERCICIO",
] as const;

export function normalizarPerfilConcursos(valor: unknown) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function lerUsuarioConcursos(): UsuarioConcursos | null {
  if (typeof window === "undefined") return null;

  try {
    const dados = JSON.parse(localStorage.getItem("usuarioLogado") || "null");
    if (!dados?.id || !dados?.municipio_id) return null;

    return {
      id: dados.id,
      nome: String(dados.nome || "Usuário"),
      perfil: normalizarPerfilConcursos(dados.perfil),
      municipio_id: Number(dados.municipio_id),
    };
  } catch {
    return null;
  }
}

export function podeGerenciarConcursos(perfil: string) {
  return ["DESENVOLVEDOR", "ADMIN", "COMANDANTE", "DIRETOR"].includes(
    normalizarPerfilConcursos(perfil)
  );
}

export function formatarConcursos(valor: unknown) {
  return String(valor ?? "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letra) => letra.toUpperCase());
}

export function formatarDataConcurso(valor?: string | null) {
  if (!valor) return "—";
  const [ano, mes, dia] = valor.slice(0, 10).split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : valor;
}
