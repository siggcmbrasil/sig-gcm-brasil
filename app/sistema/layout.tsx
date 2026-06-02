"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";

type UsuarioLogado = {
  id: string;
  nome: string;
  email: string;
  perfil: string;
};

export default function SistemaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    async function verificarSessao() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        localStorage.removeItem("usuarioLogado");
        router.push("/login");
        return;
      }

      const usuarioAtual = {
        id: data.user.id,
        nome: data.user.email || "Usuário",
        email: data.user.email || "",
        perfil: "admin",
      };

      localStorage.setItem("usuarioLogado", JSON.stringify(usuarioAtual));
      setUsuario(usuarioAtual);
      setVerificando(false);
    }

    verificarSessao();
  }, [router]);

  if (verificando) {
    return (
      <div className="min-h-screen bg-[#061426] flex items-center justify-center text-white text-xl">
        Carregando sistema...
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#061426]">
      <Sidebar />

      <main className="flex-1 w-full">
        <div className="border-b border-slate-800 px-4 md:px-6 py-4 flex flex-col md:flex-row gap-2 md:gap-0 justify-between md:items-center">
          <div>
            <h1 className="font-bold text-white text-lg md:text-base">
              Sistema Integrado GCM Biritinga
            </h1>
            <p className="text-sm md:text-xs text-slate-400">
              Painel Operacional
            </p>
          </div>

          <div className="text-sm text-slate-300 md:text-right">
            <p>
              Usuário:{" "}
              <span className="font-semibold text-white">
                {usuario?.email}
              </span>
            </p>

            <p className="text-xs text-slate-500">
              Perfil: {usuario?.perfil}
            </p>
          </div>
        </div>

        <div className="text-white">{children}</div>
      </main>
    </div>
  );
}