"use client";

import { useEffect, useState } from "react";
import { podeVerModulo } from "@/lib/permissoesModulo";

export default function ProtecaoModulo({
  modulo,
  children,
}: {
  modulo: string;
  children: React.ReactNode;
}) {
  const [liberado, setLiberado] = useState(false);

  useEffect(() => {
    async function verificar() {
      const dados = localStorage.getItem("usuarioLogado");

      if (!dados) {
        window.location.href = "/login";
        return;
      }

      const usuario = JSON.parse(dados);

      const permitido = await podeVerModulo(usuario.perfil, modulo);

      if (!permitido) {
        alert("Você não tem permissão para acessar esta área.");
        window.location.href = "/sistema";
        return;
      }

      setLiberado(true);
    }

    verificar();
  }, [modulo]);

  if (!liberado) {
    return <div className="p-6 text-white">Verificando permissão...</div>;
  }

  return <>{children}</>;
}