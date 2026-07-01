"use client";

import { Users } from "lucide-react";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigEmpty from "@/components/sig/SigEmpty";

export default function InternosPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Contatos Internos"
        subtitulo="Servidores, guardas e setores internos."
        icone={Users}
      />

      <SigEmpty
        titulo="Nenhum contato cadastrado"
        descricao="Os contatos internos aparecerão aqui."
      />
    </div>
  );
}