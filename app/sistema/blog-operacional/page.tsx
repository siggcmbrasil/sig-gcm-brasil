"use client";

import {
  Newspaper,
  Plus,
  Search,
  Filter,
} from "lucide-react";

import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigButton from "@/components/sig/SigButton";

export default function BlogOperacionalPage() {
  const publicacoes = [
    {
      id: 1,
      titulo: "Operação São João Seguro é encerrada com sucesso",
      autor: "Comando GCM",
      data: "29/06/2026",
      categoria: "Operacional",
      resumo:
        "As equipes realizaram patrulhamento intensivo durante os festejos, sem registros graves.",
    },
    {
      id: 2,
      titulo: "Novo módulo de Permutas disponível no SIG",
      autor: "Equipe SIG-GCM Brasil",
      data: "28/06/2026",
      categoria: "Sistema",
      resumo:
        "Agora as solicitações de permuta possuem aprovação do comando e confirmação pelo RH.",
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <SigPageHeader
        titulo="Blog Operacional"
        subtitulo="Notícias, comunicados e informativos da Guarda Municipal."
        icone={Newspaper}
      />

      <SigCard>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 border rounded-xl px-3 py-2">
              <Search size={18} />
              <input
                className="w-full bg-transparent outline-none"
                placeholder="Pesquisar publicação..."
              />
            </div>
          </div>

          <SigButton icon={Filter}>
            Filtrar
          </SigButton>

          <SigButton icon={Plus}>
            Nova Publicação
          </SigButton>
        </div>
      </SigCard>

      <div className="space-y-4">
        {publicacoes.map((item) => (
          <SigCard key={item.id}>
            <div className="space-y-3">
              <div>
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                  {item.categoria}
                </span>
              </div>

              <h2 className="text-xl font-bold">
                {item.titulo}
              </h2>

              <p className="text-sm text-slate-400">
                {item.autor} • {item.data}
              </p>

              <p className="text-slate-300">
                {item.resumo}
              </p>

              <button className="text-emerald-400 font-semibold">
                Ler matéria →
              </button>
            </div>
          </SigCard>
        ))}
      </div>
    </div>
  );
}