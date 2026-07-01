"use client";

import {
  Newspaper,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import SigButton from "@/components/sig/SigButton";

export default function NoticiasPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Notícias"
        subtitulo="Publicações, comunicados e informações oficiais ao cidadão."
        icone={Newspaper}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card titulo="Notícias" valor="0" icone={<Newspaper className="w-7 h-7 text-blue-400" />} />
        <Card titulo="Rascunhos" valor="0" icone={<Clock className="w-7 h-7 text-yellow-400" />} />
        <Card titulo="Publicadas" valor="0" icone={<CheckCircle className="w-7 h-7 text-green-400" />} />
        <Card titulo="Arquivadas" valor="0" icone={<AlertCircle className="w-7 h-7 text-red-400" />} />
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row gap-3">
          <input className="input flex-1" placeholder="Pesquisar notícia..." />

          <select className="input md:w-60">
            <option>Todas</option>
            <option>RASCUNHO</option>
            <option>PUBLICADA</option>
            <option>ARQUIVADA</option>
          </select>

          <SigButton type="gold">
            <Search className="w-4 h-4" />
            Consultar
          </SigButton>

          <SigButton type="blue">
            <Plus className="w-4 h-4" />
            Nova Notícia
          </SigButton>
        </div>
      </SigCard>

      <SigCard>
        <div className="text-center py-16">
          <Newspaper className="w-16 h-16 mx-auto text-slate-600 mb-4" />

          <h2 className="text-xl font-black text-white">
            Nenhuma notícia cadastrada
          </h2>

          <p className="text-slate-400 mt-2">
            As notícias e comunicados publicados aparecerão aqui.
          </p>
        </div>
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Categorias de publicação
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          <Item texto="Comunicado oficial" />
          <Item texto="Ação da Guarda" />
          <Item texto="Educação preventiva" />
          <Item texto="Trânsito" />
          <Item texto="Eventos" />
          <Item texto="Serviços públicos" />
          <Item texto="Alerta à população" />
          <Item texto="Outros assuntos" />
        </div>
      </SigCard>
    </div>
  );
}

function Card({
  titulo,
  valor,
  icone,
}: {
  titulo: string;
  valor: string;
  icone: React.ReactNode;
}) {
  return (
    <div className="painel-premium p-5">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-slate-400 text-sm">{titulo}</p>
          <h2 className="text-3xl font-black text-white">{valor}</h2>
        </div>
        {icone}
      </div>
    </div>
  );
}

function Item({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-4 text-slate-200">
      {texto}
    </div>
  );
}