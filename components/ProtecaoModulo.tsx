"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { LockKeyhole } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { podeVerModulo } from "@/lib/permissoesModulo";

type StatusProtecao =
  | "verificando"
  | "liberado"
  | "negado";

export default function ProtecaoModulo({
  modulo,
  children,
}: {
  modulo: string;
  children: ReactNode;
}) {
  const [status, setStatus] =
    useState<StatusProtecao>("verificando");

  useEffect(() => {
    let componenteAtivo = true;

    async function verificar() {
      setStatus("verificando");

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          localStorage.removeItem("usuarioLogado");
          window.location.replace("/login");
          return;
        }

        /*
         * Não enviamos perfil, status ou município como
         * autorização. A API identifica tudo pelo token.
         */
        const permitido = await podeVerModulo(modulo);

        if (!componenteAtivo) {
          return;
        }

        setStatus(
          permitido ? "liberado" : "negado"
        );
      } catch (error) {
        console.error(
          "Erro ao verificar permissão:",
          error
        );

        if (componenteAtivo) {
          setStatus("negado");
        }
      }
    }

    void verificar();

    return () => {
      componenteAtivo = false;
    };
  }, [modulo]);

  if (status === "verificando") {
    return (
      <div className="flex min-h-[300px] items-center justify-center p-6 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />

          <p className="font-bold text-slate-300">
            Verificando permissões...
          </p>
        </div>
      </div>
    );
  }

  if (status === "negado") {
    return (
      <div className="p-4 text-white md:p-6">
        <div className="mx-auto max-w-xl rounded-3xl border border-red-500/30 bg-slate-950/80 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10">
            <LockKeyhole className="h-8 w-8 text-red-400" />
          </div>

          <h1 className="text-3xl font-black">
            Acesso negado
          </h1>

          <p className="mt-3 text-slate-400">
            Seu perfil não possui permissão para
            acessar este módulo.
          </p>

          <Link
            href="/sistema"
            className="btn-primary mt-6 inline-flex"
          >
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
