"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ModalAniversariantes from "@/components/ModalAniversariantes";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import RegistrarServiceWorker from "@/components/RegistrarServiceWorker";

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
  municipio_nome?: string;
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

  async function verificarSessao() {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        localStorage.clear();
        sessionStorage.clear();
        router.replace("/login");
        return;
      }

      const { data: usuarioSistema, error: erroUsuario } = await supabase
        .from("usuarios")
        .select("id, auth_id, nome, matricula, perfil, status, municipio_id, foto_url")
        .eq("auth_id", data.user.id)
        .single();

      if (erroUsuario || !usuarioSistema) {
        await supabase.auth.signOut();
        localStorage.clear();
        sessionStorage.clear();
        router.replace("/login");
        return;
      }

      // CORREÇÃO APLICADA: "ATIVO" em maiúsculas
      if (usuarioSistema.status !== "ATIVO") {
        await registrarAuditoria({
          modulo: "Sistema",
          acao: "ERRO",
          descricao: "Tentativa de acesso com usuário inativo.",
          tabela: "usuarios",
          registro_id: usuarioSistema.id,
          detalhes: {
            usuario_id: usuarioSistema.id,
            auth_id: data.user.id,
            status: usuarioSistema.status,
          },
        });
        await supabase.auth.signOut();
        localStorage.clear();
        sessionStorage.clear();
        router.replace("/login");
        return;
      }

      if (!usuarioSistema.municipio_id) {
        await registrarAuditoria({
          modulo: "Sistema",
          acao: "ERRO",
          descricao: "Tentativa de acesso sem município vinculado.",
          tabela: "usuarios",
          registro_id: usuarioSistema.id,
          detalhes: {
            usuario_id: usuarioSistema.id,
            auth_id: data.user.id,
            perfil: usuarioSistema.perfil,
          },
        });
        await supabase.auth.signOut();
        localStorage.clear();
        sessionStorage.clear();
        router.replace("/login");
        return;
      }

      const { data: municipioUsuario } = await supabase
        .from("municipios")
        .select("nome")
        .eq("id", usuarioSistema.municipio_id)
        .single();

      const usuarioAtual: UsuarioLogado = {
        id: String(usuarioSistema.id),
        auth_id: data.user.id,
        nome: usuarioSistema.nome || data.user.email || "Usuário",
        matricula: usuarioSistema.matricula || "",
        email: data.user.email || "",
        perfil: (usuarioSistema.perfil || "GUARDA").toUpperCase() as UsuarioLogado["perfil"],
        status: usuarioSistema.status || "ATIVO", // CORREÇÃO APLICADA
        municipio_id: usuarioSistema.municipio_id,
        municipio_nome: municipioUsuario?.nome || "",
        foto_url: usuarioSistema.foto_url || "",
      };

      localStorage.setItem("usuarioLogado", JSON.stringify(usuarioAtual));

      await registrarAuditoria({
        modulo: "Sistema",
        acao: "ACESSO",
        descricao: "Usuário acessou área protegida do sistema.",
        tabela: "usuarios",
        registro_id: usuarioSistema.id,
        detalhes: {
          usuario_id: usuarioSistema.id,
          auth_id: data.user.id,
          perfil: usuarioAtual.perfil,
          municipio_id: usuarioAtual.municipio_id,
        },
      });

      setUsuario(usuarioAtual);
      setVerificando(false);
    } catch (error) {
      console.error(error);

      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      router.replace("/login");
    }
  }

  useEffect(() => {
    verificarSessao();

    const aoVoltarPeloNavegador = () => {
      setVerificando(true);
      verificarSessao();
    };

    window.addEventListener("pageshow", aoVoltarPeloNavegador);

    return () => {
      window.removeEventListener("pageshow", aoVoltarPeloNavegador);
    };
  }, []);

  if (verificando) {
    return (
      <div className="min-h-screen bg-[#061426] flex items-center justify-center text-white text-xl">
        Verificando acesso...
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <>
      <RegistrarServiceWorker />

      <div className="flex flex-col md:flex-row min-h-screen bg-[#061426]">
        <Sidebar usuario={usuario} />

<main className="flex-1 min-w-0 w-full overflow-x-hidden">
  <div className="w-full text-white">
            <ModalAniversariantes />

            {children}

            
          </div>
        </main>
      </div>
    </>
  );
}