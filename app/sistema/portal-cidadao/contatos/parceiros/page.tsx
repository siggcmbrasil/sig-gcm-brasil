"use client";

import { Shield } from "lucide-react";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigEmpty from "@/components/sig/SigEmpty";

export default function ParceirosPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Instituições Parceiras"
        subtitulo="Órgãos parceiros e instituições externas."
        icone={Shield}
      />

      <SigEmpty
        titulo="Nenhuma instituição cadastrada"
        descricao="As instituições aparecerão aqui."
      />
    </div>
  );
}