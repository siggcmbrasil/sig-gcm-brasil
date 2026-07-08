"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCard from "@/components/sig/SigCard";

type Resultado = {
  id: number;
  titulo: string;
  categoria: string;
  descricao: string | null;
  artigo: string | null;
  texto_lei: string | null;
  aplicacao_operacional: string | null;
  palavras_chave: string | null;
  situacao_operacional: string | null;
};

export default function PesquisaJuridicaPage() {
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [pesquisou, setPesquisou] = useState(false);

  const buscaNormalizada = useMemo(() => busca.trim(), [busca]);

  async function pesquisar() {
    if (!buscaNormalizada) {
      alert("Digite uma lei, artigo, palavra-chave ou assunto.");
      return;
    }

    setCarregando(true);
    setPesquisou(true);
    setResultados([]);

    const termo = buscaNormalizada;

    const { data, error } = await supabase
      .from("legislacoes")
      .select(
        "id, titulo, categoria, descricao, artigo, texto_lei, aplicacao_operacional, palavras_chave, situacao_operacional"
      )
      .or(
        `titulo.ilike.%${termo}%,categoria.ilike.%${termo}%,descricao.ilike.%${termo}%,artigo.ilike.%${termo}%,texto_lei.ilike.%${termo}%,aplicacao_operacional.ilike.%${termo}%,palavras_chave.ilike.%${termo}%,situacao_operacional.ilike.%${termo}%`
      )
      .limit(30);

    setCarregando(false);

    if (error) {
      console.error("Erro na pesquisa jurídica:", error);
      alert("Erro ao pesquisar legislação.");
      return;
    }

    setResultados(data || []);
  }

  return (
    <main className="min-h-screen bg-[#07152E] p-4 md:p-6 pb-24 text-white">
      <div className="w-full max-w-none space-y-6">
        <Link
          href="/sistema/central-legislacao"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white"
        >
          <ArrowLeft size={18} />
          Voltar para Central de Legislação
        </Link>

        <SigCentralHeader
          titulo="Pesquisa Jurídica"
          descricao="Pesquise rapidamente leis, artigos, palavras-chave, situações operacionais e fundamentos jurídicos."
          icone={Search}
        />

        <SigCard>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#C9A227]">
                Busca jurídica rápida
              </p>

              <h2 className="mt-1 text-2xl font-black text-white">
                O que o senhor procura?
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Exemplos: desacato, flagrante, algemas, CTB, art. 301, Lei 13.022.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-5 py-4 text-white outline-none focus:border-[#C9A227]"
                placeholder="Digite lei, artigo, palavra-chave ou assunto..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void pesquisar();
                  }
                }}
              />

              <button
                type="button"
                onClick={pesquisar}
                disabled={carregando}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#C9A227] px-6 py-4 font-black text-black hover:bg-yellow-400 disabled:opacity-50"
              >
                <Search size={18} />
                {carregando ? "Pesquisando..." : "Pesquisar"}
              </button>
            </div>
          </div>
        </SigCard>

        {pesquisou && (
          <section className="space-y-4">
            <h2 className="text-xl font-black text-white">
              Resultados encontrados: {resultados.length}
            </h2>

            {resultados.length === 0 ? (
              <SigCard>
                <p className="text-slate-400">
                  Nenhum resultado encontrado para essa pesquisa.
                </p>
              </SigCard>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5">
                {resultados.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-3xl border border-white/10 bg-white/5 p-5 hover:border-[#C9A227]/50"
                  >
                    <div className="flex items-start gap-3">
                      <BookOpen className="mt-1 text-[#C9A227]" />

                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C9A227]">
                          Resultado jurídico
                        </p>

                        <h3 className="mt-1 text-xl font-black text-white">
                          {item.titulo}
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                          {item.categoria} {item.artigo ? `• ${item.artigo}` : ""}
                        </p>
                      </div>
                    </div>

                    {item.descricao && (
                      <p className="mt-4 text-sm text-slate-300">
                        {item.descricao}
                      </p>
                    )}

                    {item.aplicacao_operacional && (
                      <div className="mt-4 rounded-2xl border border-blue-500/30 bg-blue-950/30 p-4">
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">
                          Aplicação operacional
                        </p>

                        <p className="mt-2 text-sm text-slate-200">
                          {item.aplicacao_operacional}
                        </p>
                      </div>
                    )}

                    <div className="mt-5 flex justify-end">
                      <Link
                        href="/sistema/legislacao"
                        className="rounded-xl border border-[#C9A227]/50 px-4 py-2 text-sm font-bold text-[#C9A227] hover:bg-[#C9A227]/10"
                      >
                        Abrir na Biblioteca
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}