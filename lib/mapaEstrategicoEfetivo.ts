"use client";

export type UsuarioMapaEstrategico = {
  id: string | number;
  nome: string;
  perfil: string;
  municipio_id: number;
};

export const NIVEIS_RISCO = ["BAIXO", "MODERADO", "ALTO", "CRITICO"] as const;
export const TURNOS_OPERACIONAIS = ["DIURNO", "NOTURNO", "INTEGRAL"] as const;

export function normalizarPerfilMapa(valor: unknown) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function lerUsuarioMapaEstrategico(): UsuarioMapaEstrategico | null {
  if (typeof window === "undefined") return null;

  try {
    const dados = JSON.parse(localStorage.getItem("usuarioLogado") || "null");
    if (!dados?.id || !dados?.municipio_id) return null;

    return {
      id: dados.id,
      nome: String(dados.nome || "Usuário"),
      perfil: normalizarPerfilMapa(dados.perfil),
      municipio_id: Number(dados.municipio_id),
    };
  } catch {
    return null;
  }
}

export function podeGerenciarMapaEstrategico(perfil: string) {
  return [
    "DESENVOLVEDOR",
    "ADMIN",
    "COMANDANTE",
    "DIRETOR",
    "CMT_GUARNICAO",
  ].includes(normalizarPerfilMapa(perfil));
}

export function formatarMapa(valor: unknown) {
  return String(valor ?? "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letra) => letra.toUpperCase());
}

export function calcularCobertura(disponivel: number, necessario: number) {
  if (necessario <= 0) return 100;
  return Math.min(999, Math.round((disponivel / necessario) * 100));
}

export function classificarSituacao(cobertura: number) {
  if (cobertura < 50) return "CRITICA";
  if (cobertura < 80) return "DEFICIT";
  if (cobertura > 120) return "EXCEDENTE";
  return "ADEQUADA";
}
