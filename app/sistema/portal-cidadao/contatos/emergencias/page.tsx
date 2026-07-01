"use client";

import { Ambulance } from "lucide-react";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigEmpty from "@/components/sig/SigEmpty";

export default function EmergenciaPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Emergências"
        subtitulo="Contatos de resposta rápida."
        icone={Ambulance}
      />

      <SigEmpty
        titulo="Nenhum contato cadastrado"
        descricao="Os contatos aparecerão aqui."
      />
    </div>
  );
}