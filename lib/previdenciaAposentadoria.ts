"use client";

export type UsuarioPrevidencia = {
  id: string | number;
  nome: string;
  perfil: string;
  municipio_id: number;
};

export function normalizarPerfil(valor: unknown) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function lerUsuarioPrevidencia(): UsuarioPrevidencia | null {
  if (typeof window === "undefined") return null;

  try {
    const dados = JSON.parse(localStorage.getItem("usuarioLogado") || "null");
    if (!dados?.id || !dados?.municipio_id) return null;

    return {
      id: dados.id,
      nome: String(dados.nome || "Usuário"),
      perfil: normalizarPerfil(dados.perfil),
      municipio_id: Number(dados.municipio_id),
    };
  } catch {
    return null;
  }
}

export function podeGerenciarPrevidencia(perfil: string) {
  return [
    "DESENVOLVEDOR",
    "ADMIN",
    "COMANDANTE",
    "DIRETOR",
    "CMT_GUARNICAO",
  ].includes(normalizarPerfil(perfil));
}

export function formatarTexto(valor: unknown) {
  return String(valor ?? "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letra) => letra.toUpperCase());
}

export function formatarData(valor?: string | null) {
  if (!valor) return "—";
  const [ano, mes, dia] = valor.slice(0, 10).split("-");
  return dia && mes && ano ? `${dia}/${mes}/${ano}` : valor;
}

export function formatarTempo(totalMeses?: number | null) {
  const meses = Math.max(0, Number(totalMeses || 0));
  const anos = Math.floor(meses / 12);
  const restante = meses % 12;
  return `${anos} ano${anos === 1 ? "" : "s"} e ${restante} mês${restante === 1 ? "" : "es"}`;
}
