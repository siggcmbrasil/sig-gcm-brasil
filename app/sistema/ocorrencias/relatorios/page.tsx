"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OcorrenciasRelatoriosRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/sistema/central-relatorios");
  }, [router]);

  return (
    <div className="p-6 text-white">
      Redirecionando para relatórios de ocorrências...
    </div>
  );
}