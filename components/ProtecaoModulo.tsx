"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { podeVerModulo } from "@/lib/permissoesModulo";

export default function ProtecaoModulo({
  modulo,
  children,
}: {
  modulo: string;
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<"verificando" | "liberado" | "negado">(
    "verificando"
  );

  useEffect(() => {
    async function verificar() {
      try {
        const dados = localStorage.getItem("usuarioLogado");

        if (!dados) {
          location.replace("/login");
          return;
        }

        const usuario = JSON.parse(dados);

const statusUsuario = String(usuario.status || "").toUpperCase();

if (statusUsuario !== "ATIVO") {
  localStorage.removeItem("usuarioLogado");
  location.replace("/login");
  return;
}

if (String(usuario.perfil || "").toUpperCase() === "DESENVOLVEDOR") {
  setStatus("liberado");
  return;
}

        if (!usuario?.perfil) {
          location.replace("/login");
          return;
        }

        const permitido = await podeVerModulo(usuario.perfil, modulo);

        if (!permitido) {
          setStatus("negado");
          return;
        }

        setStatus("liberado");
      } catch (error) {
  console.error("Erro ao verificar permissão:", error);
        localStorage.removeItem("usuarioLogado");
        location.replace("/login");
      }
    }

    verificar();
  }, [modulo]);

  if (status === "verificando") {
    return (
  <div className="min-h-[300px] flex items-center justify-center text-white">
    Verificando permissões...
  </div>
);
  }

  if (status === "negado") {
    return (
      <div className="p-6 text-white">
        <div className="painel-premium p-8 max-w-xl">
          <h1 className="text-3xl font-black mb-2">⛔ Acesso negado</h1>
          <p className="text-slate-400 mb-6">
            Você não possui permissão para acessar esta área.
          </p>

          <Link href="/sistema" className="btn-primary inline-block">
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}