"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

function destinoPorPerfil(perfil: string) {
  switch (perfil) {
    case "GUARDA":
    case "PLANTONISTA":
      return "/sistema/central-guarda";

    case "COMANDANTE":
    case "DIRETOR":
    case "CMT_GUARNICAO":
      return "/sistema/central-comando";

    case "CORREGEDOR":
      return "/sistema/central-corregedoria";

    case "ADMIN":
      return "/sistema/central-perfil-administrativo";

    case "DESENVOLVEDOR":
      return "/sistema/central-perfis";

    case "CONSULTA":
    default:
      return "/sistema/central-consulta";
  }
}

export default function MinhaCentralPage() {
  const router = useRouter();
  const [mensagem, setMensagem] = useState("Identificando sua central...");

  useEffect(() => {
    try {
      const usuario = JSON.parse(
        localStorage.getItem("usuarioLogado") || "{}"
      );

      const perfil = String(usuario?.perfil || "")
        .trim()
        .toUpperCase();

      const destino = destinoPorPerfil(perfil);

      setMensagem("Abrindo sua central personalizada...");
      router.replace(destino);
    } catch {
      router.replace("/sistema/central-consulta");
    }
  }, [router]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="rounded-3xl border border-cyan-400/15 bg-[#061326] px-8 py-10 text-center shadow-2xl">
        <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-cyan-300" />
        <p className="mt-4 font-black text-white">{mensagem}</p>
        <p className="mt-2 text-sm text-slate-500">
          Suas permissões continuam sendo aplicadas em cada módulo.
        </p>
      </div>
    </main>
  );
}
