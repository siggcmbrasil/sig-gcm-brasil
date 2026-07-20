"use client";

export type UsuarioSaude = {
  id: string | number;
  nome: string;
  perfil: string;
  municipio_id: number;
};

export const TIPOS_EXAME = [
  "ADMISSIONAL",
  "PERIODICO",
  "RETORNO_AO_TRABALHO",
  "MUDANCA_DE_FUNCAO",
  "DEMISSIONAL",
  "COMPLEMENTAR",
] as const;

export const RESULTADOS_APTIDAO = [
  "APTO",
  "APTO_COM_RESTRICAO",
  "INAPTO_TEMPORARIO",
  "INAPTO_DEFINITIVO",
  "AGUARDANDO_AVALIACAO",
] as const;

export function normalizarPerfilSaude(valor: unknown) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function lerUsuarioSaude(): UsuarioSaude | null {
  if (typeof window === "undefined") return null;

  try {
    const dados = JSON.parse(localStorage.getItem("usuarioLogado") || "null");
    if (!dados?.id || !dados?.municipio_id) return null;

    return {
      id: dados.id,
      nome: String(dados.nome || "Usuário"),
      perfil: normalizarPerfilSaude(dados.perfil),
      municipio_id: Number(dados.municipio_id),
    };
  } catch {
    return null;
  }
}

export function podeGerenciarSaude(perfil: string) {
  return ["DESENVOLVEDOR", "ADMIN", "COMANDANTE", "DIRETOR"].includes(
    normalizarPerfilSaude(perfil)
  );
}

export function podeVerDadosSigilosos(perfil: string) {
  return ["DESENVOLVEDOR", "ADMIN", "COMANDANTE", "DIRETOR"].includes(
    normalizarPerfilSaude(perfil)
  );
}

export function formatarSaude(valor: unknown) {
  return String(valor ?? "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letra) => letra.toUpperCase());
}

export function formatarDataSaude(valor?: string | null) {
  if (!valor) return "—";
  const [ano, mes, dia] = valor.slice(0, 10).split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : valor;
}

export function calcularDiasAte(data?: string | null) {
  if (!data) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const destino = new Date(`${data.slice(0, 10)}T00:00:00`);
  return Math.ceil((destino.getTime() - hoje.getTime()) / 86400000);
}
