"use client";

export type UsuarioSaudeMental = {
  id: string | number;
  nome: string;
  perfil: string;
  municipio_id: number;
};

export const TIPOS_ATENDIMENTO_PSICOSSOCIAL = [
  "ACOLHIMENTO",
  "ATENDIMENTO_INDIVIDUAL",
  "AVALIACAO_PSICOLOGICA",
  "POS_OCORRENCIA_CRITICA",
  "RETORNO_AO_TRABALHO",
  "GRUPO_DE_APOIO",
  "ENCAMINHAMENTO",
] as const;

export const STATUS_ACOMPANHAMENTO = [
  "AGENDADO",
  "EM_ACOMPANHAMENTO",
  "ENCAMINHADO",
  "CONCLUIDO",
  "SUSPENSO",
  "CANCELADO",
] as const;

export function normalizarPerfilSaudeMental(valor: unknown) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function lerUsuarioSaudeMental(): UsuarioSaudeMental | null {
  if (typeof window === "undefined") return null;

  try {
    const dados = JSON.parse(localStorage.getItem("usuarioLogado") || "null");
    if (!dados?.id || !dados?.municipio_id) return null;

    return {
      id: dados.id,
      nome: String(dados.nome || "Usuário"),
      perfil: normalizarPerfilSaudeMental(dados.perfil),
      municipio_id: Number(dados.municipio_id),
    };
  } catch {
    return null;
  }
}

export function podeGerenciarSaudeMental(perfil: string) {
  return ["DESENVOLVEDOR", "ADMIN", "COMANDANTE", "DIRETOR"].includes(
    normalizarPerfilSaudeMental(perfil)
  );
}

export function podeVerClinicoSaudeMental(perfil: string) {
  return ["DESENVOLVEDOR", "ADMIN"].includes(
    normalizarPerfilSaudeMental(perfil)
  );
}

export function formatarSaudeMental(valor: unknown) {
  return String(valor ?? "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letra) => letra.toUpperCase());
}

export function formatarDataSaudeMental(valor?: string | null) {
  if (!valor) return "—";
  const [ano, mes, dia] = valor.slice(0, 10).split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : valor;
}

export function diasAteSaudeMental(valor?: string | null) {
  if (!valor) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const destino = new Date(`${valor.slice(0, 10)}T00:00:00`);
  return Math.ceil((destino.getTime() - hoje.getTime()) / 86400000);
}
