"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { temPermissao } from "@/lib/permissoes";

type Props = {
  perfilMinimo?: string;
  perfisPermitidos?: string[];
  children: React.ReactNode;
};

export default function ProtecaoPerfil({
  perfilMinimo,
  perfisPermitidos,
  children,
}: Props) {
  const router = useRouter();

  useEffect(() => {
    const dados = localStorage.getItem("usuarioLogado");

    if (!dados) {
      router.push("/login");
      return;
    }

    const usuario = JSON.parse(dados);
    const perfilUsuario = usuario?.perfil;

    if (perfilUsuario === "DESENVOLVEDOR") return;

    if (perfisPermitidos && !perfisPermitidos.includes(perfilUsuario)) {
      alert("Você não tem permissão para acessar esta página.");
      router.push("/sistema");
      return;
    }

    if (perfilMinimo && !temPermissao(perfilUsuario, perfilMinimo)) {
      alert("Você não tem permissão para acessar esta página.");
      router.push("/sistema");
    }
  }, [router, perfilMinimo, perfisPermitidos]);

  return <>{children}</>;
}