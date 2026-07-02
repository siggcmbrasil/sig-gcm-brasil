"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Newspaper,
  Plus,
  Search,
  Filter,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigButton from "@/components/sig/SigButton";

export default function BlogOperacionalPage() {
  const [publicacoes, setPublicacoes] = useState<any[]>([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    carregarPublicacoes();
  }, []);

  async function carregarPublicacoes() {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

    const { data, error } = await supabase
      .from("blog_operacional")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("created_at", { ascending: false });

    if (error) {
      alert("Erro ao carregar publicações.");
      console.error(error);
      return;
    }

    setPublicacoes(data || []);
  }

  const lista = publicacoes.filter((item) =>
    `
      ${item.titulo || ""}
      ${item.autor || ""}
      ${item.categoria || ""}
      ${item.resumo || ""}
    `
      .toLowerCase()
      .includes(busca.toLowerCase())
  );

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
            <div className="flex items-center gap-2 border border-slate-700 rounded-xl px-3 py-2">
              <Search size={18} />

              <input
                className="w-full bg-transparent outline-none"
                placeholder="Pesquisar publicação..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>

          <SigButton icon={Filter}>
            Filtrar
          </SigButton>

          <Link href="/sistema/blog-operacional/nova">
            <SigButton icon={Plus}>
              Nova Publicação
            </SigButton>
          </Link>
        </div>
      </SigCard>

      <div className="space-y-4">
        {lista.length === 0 ? (
          <SigCard>
            <p className="text-center text-slate-400 py-10">
              Nenhuma publicação encontrada.
            </p>
          </SigCard>
        ) : (
          lista.map((item) => (
            <SigCard key={item.id}>
              <div className="space-y-3">
                <div>
                  <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                    {item.categoria || "Geral"}
                  </span>
                </div>

                <h2 className="text-xl font-bold">
                  {item.titulo}
                </h2>

                <p className="text-sm text-slate-400">
                  {item.autor || "SIG-GCM Brasil"} •{" "}
                  {item.data_publicacao
                    ? new Date(item.data_publicacao).toLocaleDateString("pt-BR")
                    : new Date(item.created_at).toLocaleDateString("pt-BR")}
                </p>

                <p className="text-slate-300">
                  {item.resumo}
                </p>

                <Link
                  href={`/sistema/blog-operacional/${item.id}`}
                  className="text-emerald-400 font-semibold inline-block"
                >
                  Ler matéria →
                </Link>
              </div>
            </SigCard>
          ))
        )}
      </div>
    </div>
  );
}