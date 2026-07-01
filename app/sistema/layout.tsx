"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ModalAniversariantes from "@/components/ModalAniversariantes";
import { supabase } from "@/lib/supabase";
import RegistrarServiceWorker from "@/components/RegistrarServiceWorker";
import { iniciarPushNotifications } from "@/lib/pushNotifications";

type UsuarioLogado = {
  id: string;
  auth_id?: string;
  nome: string;
  matricula?: string;
  email: string;
  perfil:
  | "DESENVOLVEDOR"
  | "ADMIN"
  | "COMANDANTE"
  | "DIRETOR"
  | "CMT_GUARNICAO"
  | "PLANTONISTA"
  | "GUARDA"
  | "CONSULTA";
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
  try {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        localStorage.removeItem("usuarioLogado");
        router.push("/login");
        return;
      }

      useEffect(() => {
  if (!usuario) return;

  iniciarPushNotifications();
}, [usuario]);

      const { data: usuarioSistema } = await supabase
  .from("usuarios")
  .select("*")
  .eq("auth_id", data.user.id)
  .single();

  if (!usuarioSistema) {
  await supabase.auth.signOut();
  localStorage.removeItem("usuarioLogado");
  router.push("/login");
  return;
}

if (usuarioSistema.status !== "Ativo") {
  await supabase.auth.signOut();
  localStorage.removeItem("usuarioLogado");
  router.push("/login");
  return;
}

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

} catch (error) {
  console.error(error);

  await supabase.auth.signOut();
  localStorage.removeItem("usuarioLogado");
  router.push("/login");
  return;
}
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
<>
    <RegistrarServiceWorker />
    
  <div className="flex flex-col md:flex-row min-h-screen bg-[#061426]">
    {usuario && <Sidebar usuario={usuario} />}

    <main className="flex-1 w-full">

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
  </>
  );
}