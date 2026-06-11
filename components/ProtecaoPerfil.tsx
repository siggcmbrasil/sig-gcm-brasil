"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { temPermissao } from "@/lib/permissoes";

export default function ProtecaoPerfil({
  perfilMinimo,
  children,
}: {
  perfilMinimo: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const dados = localStorage.getItem("usuarioLogado");

    if (!dados) {
      router.push("/login");
      return;
    }

    const usuario = JSON.parse(dados);

    if (!temPermissao(usuario.perfil, perfilMinimo)) {
      alert("Você não tem permissão para acessar esta página.");
      router.push("/sistema");
    }
  }, [router, perfilMinimo]);

  return <>{children}</>;
}