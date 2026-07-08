"use client";

import Link from "next/link";
import {
  Archive,
  CheckCircle,
  PackageSearch,
  PlusCircle,
  Search,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigActionCard from "@/components/sig/SigActionCard";
import SigCard from "@/components/sig/SigCard";

export default function AchadosPerdidosPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Achados e Perdidos"
        subtitulo="Controle de objetos encontrados, devolvidos ou aguardando retirada."
        icone={PackageSearch}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ResumoCard titulo="Total" valor="0" cor="text-cyan-400" />
        <ResumoCard titulo="Encontrados" valor="0" cor="text-yellow-400" />
        <ResumoCard titulo="Devolvidos" valor="0" cor="text-emerald-400" />
        <ResumoCard titulo="Arquivados" valor="0" cor="text-slate-300" />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <SigActionCard
  href="/sistema/portal-cidadao/achados-perdidos"
  titulo="Novo Registro"
  descricao="Cadastrar objeto encontrado ou perdido. Módulo em estruturação."
  icone={PlusCircle}
/>

        <SigActionCard
          href="/sistema/portal-cidadao/achados-perdidos"
          titulo="Consultar"
          descricao="Pesquisar por objeto, proprietário, local ou data."
          icone={Search}
        />

        <SigActionCard
          href="/sistema/portal-cidadao/protocolos"
          titulo="Protocolos"
          descricao="Acompanhar devoluções e solicitações vinculadas."
          icone={Archive}
        />
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            className="input flex-1"
            placeholder="Pesquisar objeto, local, proprietário ou protocolo..."
          />

          <button
            type="button"
            className="btn-primary inline-flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" />
            Pesquisar
          </button>
        </div>
      </SigCard>

      <SigCard>
        <div className="py-20 text-center">
          <PackageSearch className="w-16 h-16 mx-auto text-cyan-400 mb-4" />

          <h2 className="text-2xl font-black text-white">
            Nenhum item registrado
          </h2>

          <p className="text-slate-400 mt-2 max-w-2xl mx-auto">
            Os objetos encontrados, perdidos ou devolvidos aparecerão aqui após
            o primeiro cadastro.
          </p>

<Link
  href="/sistema/portal-cidadao/achados-perdidos"
  className="btn-primary inline-flex items-center justify-center gap-2 mt-6 opacity-70"
>
            <PlusCircle className="w-5 h-5" />
            Cadastrar Objeto
          </Link>
        </div>
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Regras de Segurança
        </h2>

        <div className="grid md:grid-cols-2 gap-3">
          <Regra texto="Todo objeto deve gerar protocolo de registro." />
          <Regra texto="A devolução deve registrar nome, documento e assinatura/termo." />
          <Regra texto="Fotos de documentos não devem ser exibidas publicamente." />
          <Regra texto="Somente perfis autorizados podem marcar como devolvido." />
        </div>
      </SigCard>
    </div>
  );
}

function ResumoCard({
  titulo,
  valor,
  cor,
}: {
  titulo: string;
  valor: string;
  cor: string;
}) {
  return (
    <SigCard>
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h2 className={`text-4xl font-black mt-2 ${cor}`}>{valor}</h2>
      <p className="text-slate-500 text-xs mt-1">Em estruturação</p>
    </SigCard>
  );
}

function Regra({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl bg-slate-950/70 border border-cyan-500/20 p-4 text-slate-300">
      <CheckCircle className="w-5 h-5 text-emerald-400 inline mr-2" />
      {texto}
    </div>
  );
}