"use client";

import { Phone } from "lucide-react";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigEmpty from "@/components/sig/SigEmpty";

export default function TelefonesPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Telefones Úteis"
        subtitulo="SAMU, PM, Bombeiros e serviços essenciais."
        icone={Phone}
      />

      <SigEmpty
        titulo="Nenhum telefone cadastrado"
        descricao="Os contatos aparecerão aqui."
      />
    </div>
  );
}