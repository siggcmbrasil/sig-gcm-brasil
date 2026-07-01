"use client";

import { Building2 } from "lucide-react";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigEmpty from "@/components/sig/SigEmpty";

export default function OrgaosPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Órgãos Públicos"
        subtitulo="Prefeitura, secretarias e departamentos."
        icone={Building2}
      />

      <SigEmpty
        titulo="Nenhum órgão cadastrado"
        descricao="Os órgãos aparecerão aqui."
      />
    </div>
  );
}