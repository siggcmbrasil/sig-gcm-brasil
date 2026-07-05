"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RelatorioPlantaoAntigoPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/sistema/relatorios/plantao");
  }, [router]);

  return (
    <div className="p-6">
      <div className="painel-premium p-6">
        <h1 className="text-2xl font-black text-white">
          Redirecionando...
        </h1>

        <p className="text-slate-400 mt-2">
          Abrindo o novo gerador oficial de relatórios.
        </p>
      </div>
    </div>
  );
}