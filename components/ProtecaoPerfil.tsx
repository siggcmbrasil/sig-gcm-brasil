"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Perfil =
  | "ADMIN"
  | "COMANDANTE"
  | "DIRETOR"
  | "CMT_GUARNICAO"
  | "PLANTONISTA"
  | "CONSULTA";

type UsuarioLogado = {
  nome: string;
  email: string;
  perfil: Perfil;
  status: string;
};

export default function ProtecaoPerfil({
  perfisPermitidos,
  children,
}: {
  perfisPermitidos: Perfil[];
  children: React.ReactNode;
}) {
  const [carregando, setCarregando] = useState(true);
  const [permitido, setPermitido] = useState(false);

  useEffect(() => {
    const dados = localStorage.getItem("usuarioLogado");

    if (!dados) {
      window.location.href = "/login";
      return;
    }

    const usuario: UsuarioLogado = JSON.parse(dados);

    if (usuario.status === "Inativo" || usuario.status === "Bloqueado") {
      localStorage.removeItem("usuarioLogado");
      window.location.href = "/login";
      return;
    }

    setPermitido(perfisPermitidos.includes(usuario.perfil));
    setCarregando(false);
  }, [perfisPermitidos]);

  if (carregando) {
    return <div className="p-6 text-slate-400">Verificando permissão...</div>;
  }

  if (!permitido) {
    return (
      <div className="p-6 pb-24">
        <div className="card max-w-xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">
            Acesso negado
          </h1>

          <p className="text-slate-400 mb-6">
            Seu perfil não possui permissão para acessar esta área.
          </p>

          <Link
            href="/sistema"
            className="inline-block bg-blue-700 hover:bg-blue-800 px-5 py-3 rounded-xl font-semibold"
          >
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}