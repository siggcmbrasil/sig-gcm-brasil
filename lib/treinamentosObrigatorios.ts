"use client";

export type UsuarioTreinamento = {
  id: string | number;
  nome: string;
  perfil: string;
  municipio_id: number;
};

export function normalizarPerfilTreinamento(valor: unknown) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function lerUsuarioTreinamento(): UsuarioTreinamento | null {
  if (typeof window === "undefined") return null;

  try {
    const dados = JSON.parse(localStorage.getItem("usuarioLogado") || "null");
    if (!dados?.id || !dados?.municipio_id) return null;

    return {
      id: dados.id,
      nome: String(dados.nome || "Usuário"),
      perfil: normalizarPerfilTreinamento(dados.perfil),
      municipio_id: Number(dados.municipio_id),
    };
  } catch {
    return null;
  }
}

export function podeGerenciarTreinamentos(perfil: string) {
  return [
    "DESENVOLVEDOR",
    "ADMIN",
    "COMANDANTE",
    "DIRETOR",
    "CMT_GUARNICAO",
    "CORREGEDOR",
  ].includes(normalizarPerfilTreinamento(perfil));
}

export function formatarTextoTreinamento(valor: unknown) {
  return String(valor ?? "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letra) => letra.toUpperCase());
}

export function diasParaVencer(data: string | null) {
  if (!data) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const validade = new Date(`${data}T00:00:00`);
  return Math.ceil((validade.getTime() - hoje.getTime()) / 86400000);
}

export function classificarSituacaoObrigacao(
  validade: string | null,
  dispensado: boolean,
  limiteAlerta = 60
) {
  if (dispensado) return "DISPENSADO";
  if (!validade) return "PENDENTE";

  const dias = diasParaVencer(validade);
  if (dias === null) return "PENDENTE";
  if (dias < 0) return "VENCIDO";
  if (dias <= limiteAlerta) return "VENCENDO";
  return "REGULAR";
}
