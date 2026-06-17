"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ModalAniversariantes from "@/components/ModalAniversariantes";
import { supabase } from "@/lib/supabase";

type UsuarioLogado = {
  id: string;
  auth_id?: string;
  nome: string;
  matricula?: string;
  email: string;
  perfil: string;
  status?: string;
  municipio_id?: number;
  foto_url?: string;
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

      const { data: usuarioSistema } = await supabase
  .from("usuarios")
  .select("*")
  .eq("email", data.user.email)
  .single();

const usuarioAtual = {
  id: usuarioSistema?.id,
  auth_id: data.user.id,
  nome: usuarioSistema?.nome || data.user.email || "Usuário",
  matricula: usuarioSistema?.matricula || "",
  email: data.user.email || "",
  perfil: (usuarioSistema?.perfil || "GUARDA").toUpperCase(),
  status: usuarioSistema?.status || "Ativo",
  municipio_id: usuarioSistema?.municipio_id || 1,
  foto_url: usuarioSistema?.foto_url || "",
};

localStorage.setItem(
  "usuarioLogado",
  JSON.stringify(usuarioAtual)
);
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

      <div className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
  <div>
    <h1 className="text-white font-bold text-lg">
      SIG-GCM APP
    </h1>

    <p className="text-xs text-slate-400">
      Biritinga - BA
    </p>
  </div>

  {usuario?.foto_url ? (
  <img
    src={usuario.foto_url}
    alt="Usuário"
    className="w-10 h-10 rounded-full object-cover border border-slate-700"
  />
) : (
  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
    👤
  </div>
)}
</div>

      <div className="text-white">
        <ModalAniversariantes />
        {children}

        <footer className="text-center py-6 text-xs text-slate-500 border-t border-slate-800 mt-10">
          SIG-GCM Brasil © {new Date().getFullYear()}
          <br />
          Desenvolvido por
          <span className="text-blue-400 font-semibold">
            {" "}Maick Lustosa Costa
          </span>
        </footer>
      </div>

    </main>
  </div>
);
}