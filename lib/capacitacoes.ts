"use client";

export type UsuarioCapacitacao = {
  id: string | number;
  nome: string;
  perfil: string;
  municipio_id: number;
};

export function normalizarPerfilCapacitacao(valor: unknown) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function lerUsuarioCapacitacao(): UsuarioCapacitacao | null {
  if (typeof window === "undefined") return null;

  try {
    const dados = JSON.parse(localStorage.getItem("usuarioLogado") || "null");
    if (!dados?.id || !dados?.municipio_id) return null;

    return {
      id: dados.id,
      nome: String(dados.nome || "Usuário"),
      perfil: normalizarPerfilCapacitacao(dados.perfil),
      municipio_id: Number(dados.municipio_id),
    };
  } catch {
    return null;
  }
}

export function podeGerenciarCapacitacoes(perfil: string) {
  return [
    "DESENVOLVEDOR",
    "ADMIN",
    "COMANDANTE",
    "DIRETOR",
    "CMT_GUARNICAO",
    "CORREGEDOR",
  ].includes(normalizarPerfilCapacitacao(perfil));
}

export function formatarTextoCapacitacao(valor: unknown) {
  return String(valor ?? "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letra) => letra.toUpperCase());
}

export function calcularSituacaoMatricula(
  nota: number | null,
  notaMinima: number,
  frequencia: number,
  frequenciaMinima: number
) {
  if (frequencia < frequenciaMinima) return "REPROVADO_FREQUENCIA";
  if (nota !== null && nota < notaMinima) return "REPROVADO_NOTA";
  return "APROVADO";
}

export function diasAteValidade(data: string | null) {
  if (!data) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const validade = new Date(`${data}T00:00:00`);
  return Math.ceil((validade.getTime() - hoje.getTime()) / 86400000);
}
