"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Newspaper,
  Plus,
  Search,
  Star,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCard from "@/components/sig/SigCard";

type Noticia = {
  id: number;
  titulo: string;
  fonte: string | null;
  link: string | null;
  categoria: string | null;
  resumo: string | null;
data_publicacao: string | null;
destaque?: boolean;
};

const categorias = [
  "Todas",
  "Guarda Municipal",
  "Segurança Pública",
  "Legislação",
  "STF/STJ",
  "Trânsito",
  "Defesa Civil",
  "SENASP/MJSP",
];

export default function NoticiasLegislacaoPage() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [carregando, setCarregando] = useState(true);
  const [formAberto, setFormAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [fonte, setFonte] = useState("");
  const [link, setLink] = useState("");
  const [categoriaNova, setCategoriaNova] = useState("Segurança Pública");
  const [resumo, setResumo] = useState("");
  const [dataPublicacao, setDataPublicacao] = useState("");
  const [destaque, setDestaque] = useState(false);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "null")
      : null;

  useEffect(() => {
    void carregarNoticias();
  }, []);

  async function carregarNoticias() {
  setCarregando(true);

  const resposta = await fetch("/api/noticias-seguranca");
  const json = await resposta.json();

  setCarregando(false);

  if (!json.sucesso) {
    alert("Erro ao carregar notícias ao vivo.");
    return;
  }

  setNoticias(json.noticias || []);
}

  async function salvarNoticia() {
    if (!titulo.trim()) {
      alert("Informe o título da notícia.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.from("noticias_legislacao").insert({
      municipio_id: usuario?.municipio_id ? Number(usuario.municipio_id) : null,
      titulo,
      fonte,
      link,
      categoria: categoriaNova,
      resumo,
      data_publicacao: dataPublicacao || null,
      destaque,
      ativo: true,
      atualizado_em: new Date().toISOString(),
    });

    setSalvando(false);

    if (error) {
      console.error("Erro ao salvar notícia:", error);
      alert("Erro ao salvar notícia.");
      return;
    }

    setTitulo("");
    setFonte("");
    setLink("");
    setCategoriaNova("Segurança Pública");
    setResumo("");
    setDataPublicacao("");
    setDestaque(false);
    setFormAberto(false);

    await carregarNoticias();
  }

  const noticiasFiltradas = useMemo(() => {
    const termo = busca.toLowerCase();

    return noticias.filter((noticia) => {
      const texto = `
        ${noticia.titulo || ""}
        ${noticia.fonte || ""}
        ${noticia.categoria || ""}
        ${noticia.resumo || ""}
      `.toLowerCase();

      const bateBusca = texto.includes(termo);
      const bateCategoria =
        categoria === "Todas" || noticia.categoria === categoria;

      return bateBusca && bateCategoria;
    });
  }, [noticias, busca, categoria]);

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
          titulo="Notícias da Segurança Pública"
          descricao="Notícias filtradas sobre Guarda Municipal, segurança pública, legislação, trânsito e tribunais."
          icone={Newspaper}
        />

        <SigCard>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#C9A227]">
                Filtro de notícias
              </p>

              <h2 className="mt-1 text-2xl font-black text-white">
                Pesquisar notícias
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setFormAberto(!formAberto)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9A227] px-5 py-3 font-black text-black hover:bg-yellow-400"
            >
              <Plus size={18} />
              Nova notícia
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                className="w-full rounded-xl border border-white/10 bg-slate-950 py-3 pl-11 pr-4 text-white outline-none focus:border-[#C9A227]"
                placeholder="Pesquisar por Guarda Municipal, STF, CTB, SENASP..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            <select
              className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-[#C9A227]"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              {categorias.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </SigCard>

        {formAberto && (
          <SigCard>
            <h2 className="mb-4 text-xl font-black text-white">
              Cadastrar notícia
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                className="input-premium"
                placeholder="Título da notícia"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />

              <input
                className="input-premium"
                placeholder="Fonte. Ex: G1, Senado, STF"
                value={fonte}
                onChange={(e) => setFonte(e.target.value)}
              />

              <input
                className="input-premium md:col-span-2"
                placeholder="Link da notícia"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />

              <select
                className="input-premium"
                value={categoriaNova}
                onChange={(e) => setCategoriaNova(e.target.value)}
              >
                {categorias
                  .filter((cat) => cat !== "Todas")
                  .map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
              </select>

              <input
                className="input-premium"
                type="date"
                value={dataPublicacao}
                onChange={(e) => setDataPublicacao(e.target.value)}
              />
            </div>

            <textarea
              className="input-premium mt-4 min-h-28 w-full"
              placeholder="Resumo da notícia e impacto para a Guarda Municipal"
              value={resumo}
              onChange={(e) => setResumo(e.target.value)}
            />

            <label className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-300">
              <input
                type="checkbox"
                checked={destaque}
                onChange={(e) => setDestaque(e.target.checked)}
              />
              Marcar como destaque
            </label>

            <button
              type="button"
              onClick={salvarNoticia}
              disabled={salvando}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#C9A227] px-5 py-3 font-black text-black hover:bg-yellow-400 disabled:opacity-50"
            >
              <Plus size={18} />
              {salvando ? "Salvando..." : "Salvar notícia"}
            </button>
          </SigCard>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5">
          {carregando ? (
            <SigCard>
              <p className="text-slate-400">Carregando notícias...</p>
            </SigCard>
          ) : noticiasFiltradas.length === 0 ? (
            <SigCard>
              <p className="text-slate-400">Nenhuma notícia encontrada.</p>
            </SigCard>
          ) : (
            noticiasFiltradas.map((noticia) => (
              <article
                key={noticia.id}
                className="rounded-3xl border border-white/10 bg-white/5 p-5 hover:border-[#C9A227]/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {noticia.destaque && (
                      <p className="mb-2 inline-flex items-center gap-1 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1 text-xs font-black text-yellow-300">
                        <Star size={14} />
                        Destaque
                      </p>
                    )}

                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C9A227]">
                      {noticia.categoria || "Notícia"}
                    </p>

                    <h2 className="mt-2 text-xl font-black text-white">
                      {noticia.titulo}
                    </h2>
                  </div>

                  <Newspaper className="shrink-0 text-[#C9A227]" />
                </div>

                <div className="mt-3 text-xs text-slate-400">
                  <p>Fonte: {noticia.fonte || "-"}</p>
                  <p>Data: {noticia.data_publicacao || "-"}</p>
                </div>

                {noticia.resumo && (
                  <p className="mt-4 text-sm leading-relaxed text-slate-300">
                    {noticia.resumo}
                  </p>
                )}

                {noticia.link && (
                  <a
                    href={noticia.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#C9A227]/50 px-4 py-2 text-sm font-bold text-[#C9A227] hover:bg-[#C9A227]/10"
                  >
                    Ler notícia
                    <ExternalLink size={16} />
                  </a>
                )}
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}