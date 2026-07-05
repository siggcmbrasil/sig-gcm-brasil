"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [liberado, setLiberado] = useState(false);

  useEffect(() => {
    const usuario = localStorage.getItem("usuarioLogado");

    if (!usuario) {
      router.replace("/login");
      return;
    }

    try {
      const dados = JSON.parse(usuario);

      if (!dados?.id || !dados?.perfil || !dados?.municipio_id) {
        localStorage.removeItem("usuarioLogado");
        router.replace("/login");
        return;
      }

      setLiberado(true);
    } catch {
      localStorage.removeItem("usuarioLogado");
      router.replace("/login");
    }
  }, [router]);

  if (!liberado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Verificando acesso...
      </div>
    );
  }

  return <>{children}</>;
}