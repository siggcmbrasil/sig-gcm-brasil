"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import Sidebar from "@/components/Sidebar";
import ModalAniversariantes from "@/components/ModalAniversariantes";
import RegistrarServiceWorker from "@/components/RegistrarServiceWorker";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

const PERFIS_VALIDOS = [
  "DESENVOLVEDOR",
  "ADMIN",
  "COMANDANTE",
  "DIRETOR",
  "CMT_GUARNICAO",
  "PLANTONISTA",
  "GUARDA",
  "CONSULTA",
] as const;

type PerfilUsuario = (typeof PERFIS_VALIDOS)[number];

type UsuarioLogado = {
  id: string;
  auth_id: string;
  nome: string;
  matricula?: string;
  email: string;
  perfil: PerfilUsuario;
  status: "ATIVO";
  municipio_id?: number;
  municipio_nome?: string;
  foto_url?: string;
};

type UsuarioSistemaBanco = {
  id: string | number;
  auth_id: string | null;
  nome: string | null;
  matricula: string | null;
  perfil: string | null;
  status: string | null;
  municipio_id: number | null;
  foto_url: string | null;
};

function normalizarPerfil(perfil: string | null): PerfilUsuario | null {
  const valor = String(perfil || "").toUpperCase();

  return PERFIS_VALIDOS.includes(valor as PerfilUsuario)
    ? (valor as PerfilUsuario)
    : null;
}

function limparDadosLocaisDoSistema() {
  localStorage.removeItem("usuarioLogado");

  Object.keys(sessionStorage)
    .filter((chave) => chave.startsWith("sig_acesso_registrado:"))
    .forEach((chave) => sessionStorage.removeItem(chave));
}

export default function SistemaLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [verificando, setVerificando] = useState(true);

  const montadoRef = useRef(true);
  const verificacaoEmAndamentoRef = useRef(false);

  const registrarAuditoriaSegura = useCallback(
    async (dados: Parameters<typeof registrarAuditoria>[0]) => {
      try {
        await registrarAuditoria(dados);
      } catch (error) {
        console.error("Falha ao registrar auditoria do layout:", {
          message:
            error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    },
    []
  );

  const encerrarAcesso = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro ao encerrar sessão:", error);
    }

    limparDadosLocaisDoSistema();

    if (montadoRef.current) {
      setUsuario(null);
      setVerificando(false);
    }

    router.replace("/login");
    router.refresh();
  }, [router]);

  const verificarSessao = useCallback(async () => {
    if (verificacaoEmAndamentoRef.current) {
      return;
    }

    verificacaoEmAndamentoRef.current = true;

    if (montadoRef.current) {
      setVerificando(true);
    }

    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        await encerrarAcesso();
        return;
      }

      const { data, error: usuarioError } = await supabase
        .from("usuarios")
        .select(
          "id,auth_id,nome,matricula,perfil,status,municipio_id,foto_url"
        )
        .eq("auth_id", authUser.id)
        .maybeSingle<UsuarioSistemaBanco>();

      if (usuarioError || !data) {
        console.error("Usuário institucional não encontrado:", {
          message: usuarioError?.message,
          details: usuarioError?.details,
          hint: usuarioError?.hint,
          code: usuarioError?.code,
        });

        await encerrarAcesso();
        return;
      }

      const status = String(data.status || "").toUpperCase();
      const perfil = normalizarPerfil(data.perfil);

      if (status !== "ATIVO") {
        await registrarAuditoriaSegura({
          modulo: "Sistema",
          acao: "ACESSO_NEGADO",
          descricao: "Tentativa de acesso com usuário sem status ATIVO.",
          tabela: "usuarios",
          registro_id: data.id,
          detalhes: {
            usuario_id: data.id,
            auth_id: authUser.id,
            status,
          },
        });

        await encerrarAcesso();
        return;
      }

      if (!perfil) {
        await registrarAuditoriaSegura({
          modulo: "Sistema",
          acao: "ACESSO_NEGADO",
          descricao: "Tentativa de acesso com perfil inválido.",
          tabela: "usuarios",
          registro_id: data.id,
          detalhes: {
            usuario_id: data.id,
            auth_id: authUser.id,
            perfil_recebido: data.perfil,
          },
        });

        await encerrarAcesso();
        return;
      }

      /*
       * O DESENVOLVEDOR pode existir sem município fixo.
       * Todos os demais perfis precisam de municipio_id.
       */
      if (perfil !== "DESENVOLVEDOR" && !data.municipio_id) {
        await registrarAuditoriaSegura({
          modulo: "Sistema",
          acao: "ACESSO_NEGADO",
          descricao: "Tentativa de acesso sem município vinculado.",
          tabela: "usuarios",
          registro_id: data.id,
          detalhes: {
            usuario_id: data.id,
            auth_id: authUser.id,
            perfil,
          },
        });

        await encerrarAcesso();
        return;
      }

      let municipioNome = "";

      if (data.municipio_id) {
        const { data: municipio, error: municipioError } = await supabase
          .from("municipios")
          .select("nome")
          .eq("id", data.municipio_id)
          .maybeSingle();

        if (municipioError) {
          console.error("Erro ao carregar município do usuário:", {
            message: municipioError.message,
            details: municipioError.details,
            hint: municipioError.hint,
            code: municipioError.code,
          });

          await encerrarAcesso();
          return;
        }

        if (!municipio && perfil !== "DESENVOLVEDOR") {
          await encerrarAcesso();
          return;
        }

        municipioNome = municipio?.nome || "";
      }

      const usuarioAtual: UsuarioLogado = {
        id: String(data.id),
        auth_id: authUser.id,
        nome: data.nome || authUser.email || "Usuário",
        matricula: data.matricula || "",
        email: authUser.email || "",
        perfil,
        status: "ATIVO",
        municipio_id: data.municipio_id ?? undefined,
        municipio_nome: municipioNome,
        foto_url: data.foto_url || "",
      };

      /*
       * Cache visual. As permissões reais continuam sendo validadas
       * pela sessão, pelas APIs e pelas políticas RLS.
       */
      localStorage.setItem(
        "usuarioLogado",
        JSON.stringify(usuarioAtual)
      );

      const chaveAuditoria = `sig_acesso_registrado:${authUser.id}`;

      if (!sessionStorage.getItem(chaveAuditoria)) {
        await registrarAuditoriaSegura({
          modulo: "Sistema",
          acao: "ACESSO",
          descricao: "Usuário acessou a área protegida do sistema.",
          tabela: "usuarios",
          registro_id: data.id,
          detalhes: {
            usuario_id: data.id,
            auth_id: authUser.id,
            perfil,
            municipio_id: data.municipio_id,
          },
        });

        sessionStorage.setItem(chaveAuditoria, "1");
      }

      if (montadoRef.current) {
        setUsuario(usuarioAtual);
        setVerificando(false);
      }
    } catch (error) {
      console.error("Erro ao verificar sessão protegida:", {
        message:
          error instanceof Error ? error.message : "Erro desconhecido",
        error,
      });

      await encerrarAcesso();
    } finally {
      verificacaoEmAndamentoRef.current = false;
    }
  }, [encerrarAcesso, registrarAuditoriaSegura]);

  useEffect(() => {
    montadoRef.current = true;

    void verificarSessao();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "SIGNED_OUT") {
        limparDadosLocaisDoSistema();

        if (montadoRef.current) {
          setUsuario(null);
          setVerificando(false);
        }

        router.replace("/login");
        return;
      }

      if (evento === "USER_UPDATED") {
        void verificarSessao();
      }
    });

    const aoVoltarPeloNavegador = (evento: PageTransitionEvent) => {
      if (evento.persisted) {
        void verificarSessao();
      }
    };

    window.addEventListener("pageshow", aoVoltarPeloNavegador);

    return () => {
      montadoRef.current = false;
      subscription.unsubscribe();
      window.removeEventListener("pageshow", aoVoltarPeloNavegador);
    };
  }, [router, verificarSessao]);

  if (verificando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#061426] text-xl text-white">
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

      <div className="flex min-h-screen flex-col bg-[#061426] md:flex-row">
        <Sidebar usuario={usuario} />

        <main className="min-w-0 w-full flex-1 overflow-x-hidden">
          <div className="w-full text-white">
            <ModalAniversariantes />
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
