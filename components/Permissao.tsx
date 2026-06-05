"use client";

import { ReactNode } from "react";

type Perfil =
  | "ADMIN"
  | "COMANDANTE"
  | "DIRETOR"
  | "CMT_GUARNICAO"
  | "PLANTONISTA"
  | "CONSULTA";

export function pegarPerfilUsuario(): Perfil {
  if (typeof window === "undefined") return "CONSULTA";

  const dados = localStorage.getItem("usuarioLogado");

  if (!dados) return "CONSULTA";

  try {
    const usuario = JSON.parse(dados);
    return usuario?.perfil || "CONSULTA";
  } catch {
    return "CONSULTA";
  }
}

export function podeEditarSistema() {
  const perfil = pegarPerfilUsuario();

  return [
    "ADMIN",
    "COMANDANTE",
    "DIRETOR",
    "CMT_GUARNICAO",
    "PLANTONISTA",
  ].includes(perfil);
}

export function podeGerenciarSistema() {
  const perfil = pegarPerfilUsuario();

  return ["ADMIN", "COMANDANTE", "DIRETOR"].includes(perfil);
}

export function somenteAdmin() {
  const perfil = pegarPerfilUsuario();

  return perfil === "ADMIN";
}

export default function Permissao({
  tipo = "editar",
  children,
}: {
  tipo?: "editar" | "gerenciar" | "admin";
  children: ReactNode;
}) {
  let permitido = false;

  if (tipo === "editar") permitido = podeEditarSistema();
  if (tipo === "gerenciar") permitido = podeGerenciarSistema();
  if (tipo === "admin") permitido = somenteAdmin();

  if (!permitido) return null;

  return <>{children}</>;
}