"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  RotateCcw,
  Search,
  Star,
  Trash2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

type UsuarioLocal = {
  auth_id?: string;
  municipio_id?: number;
};

type Favorito = {
  id: number;
  titulo: string;
  descricao: string | null;
  categoria: string | null;
  tipo_conteudo: string | null;
  url: string | null;
  criado_em: string;
};

async function obterUsuario(): Promise<UsuarioLocal> {
  const local = JSON.parse(
    localStorage.getItem("usuarioLogado") || "{}"
  ) as UsuarioLocal;

  if (local.auth_id) return local;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    ...local,
    auth_id: user?.id,
  };
}

function limparBuscaSupabase(valor: string) {
  return valor.trim().replace(/[,%()]/g, " ").replace(/\s+/g, " ");
}

export default function FavoritosLegislacaoPage() {
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("TODAS");
  const [tipo, setTipo] = useState("TODOS");

  async function carregarFavoritos() {
    setCarregando(true);

    try {
      const usuario = await obterUsuario();

      if (!usuario.municipio_id || !usuario.auth_id) {
        throw new Error("Usuário ou município não identificado.");
      }

      let consulta = supabase
        .from("legislacao_favoritos")
        .select(
          "id,titulo,descricao,categoria,tipo_conteudo,url,criado_em"
        )
        .eq("municipio_id", usuario.municipio_id)
        .eq("auth_user_id", usuario.auth_id);

      if (categoria !== "TODAS") {
        consulta = consulta.eq("categoria", categoria);
      }

      if (tipo !== "TODOS") {
        consulta = consulta.eq("tipo_conteudo", tipo);
      }

      const termo = limparBuscaSupabase(busca);

      if (termo) {
        consulta = consulta.or(
          `titulo.ilike.%${termo}%,descricao.ilike.%${termo}%`
        );
      }

      const { data, error } = await consulta.order("criado_em", {
        ascending: false,
      });

      if (error) throw error;

      setFavoritos(data || []);

      await registrarAuditoria({
        modulo: "Central de Legislação",
        acao: "CONSULTAR",
        descricao: "Filtrou os favoritos jurídicos.",
        tabela: "legislacao_favoritos",
        detalhes: {
          municipio_id: usuario.municipio_id,
          busca,
          categoria,
          tipo,
          total: data?.length || 0,
        },
      });
    } catch (error: any) {
      console.error("Erro ao carregar favoritos legislativos:", error);
      alert(error?.message || "Erro ao carregar favoritos.");
      setFavoritos([]);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarFavoritos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function limparFiltros() {
    setBusca("");
    setCategoria("TODAS");
    setTipo("TODOS");
  }

  async function removerFavorito(item: Favorito) {
    const usuario = await obterUsuario();

    if (!usuario.municipio_id || !usuario.auth_id) return;

    const confirmar = window.confirm(
      `Remover "${item.titulo}" dos favoritos?`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("legislacao_favoritos")
      .delete()
      .eq("id", item.id)
      .eq("municipio_id", usuario.municipio_id)
      .eq("auth_user_id", usuario.auth_id);

    if (error) {
      console.error("Erro ao remover favorito:", error);
      alert("Erro ao remover favorito.");
      return;
    }

    await registrarAuditoria({
      modulo: "Central de Legislação",
      acao: "EXCLUIR",
      descricao: `Removeu dos favoritos: ${item.titulo}.`,
      tabela: "legislacao_favoritos",
      registro_id: item.id,
      detalhes: {
        municipio_id: usuario.municipio_id,
        titulo: item.titulo,
      },
    });

    setFavoritos((lista) =>
      lista.filter((favorito) => favorito.id !== item.id)
    );
  }

  async function abrirFavorito(item: Favorito) {
    const usuario = await obterUsuario();

    await registrarAuditoria({
      modulo: "Central de Legislação",
      acao: "VISUALIZAR",
      descricao: `Abriu o favorito legislativo: ${item.titulo}.`,
      tabela: "legislacao_favoritos",
      registro_id: item.id,
      detalhes: {
        municipio_id: usuario.municipio_id,
        titulo: item.titulo,
        url: item.url,
      },
    });

    if (item.url) {
      window.open(item.url, "_blank", "noopener,noreferrer");
    }
  }

  const categoriasDisponiveis = Array.from(
    new Set(favoritos.map((item) => item.categoria).filter(Boolean))
  ) as string[];

  const tiposDisponiveis = Array.from(
    new Set(favoritos.map((item) => item.tipo_conteudo).filter(Boolean))
  ) as string[];

  return (
    <div className="min-h-screen bg-slate-950 p-4 pb-24 text-white md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-amber-500/20 bg-slate-900/70 p-5 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-300">
              <Star size={30} />
            </div>

            <div>
              <Link
                href="/sistema/central-legislacao"
                className="mb-2 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
              >
                <ArrowLeft size={16} />
                Voltar à Central de Legislação
              </Link>

              <h1 className="text-2xl font-black md:text-4xl">
                Favoritos Jurídicos
              </h1>

              <p className="mt-1 text-sm text-slate-400 md:text-base">
                Conteúdos salvos exclusivamente pelo usuário logado.
              </p>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-300">
                Busca
              </span>
              <span className="relative block">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="search"
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Título ou descrição..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-white outline-none focus:border-amber-400"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-300">
                Categoria
              </span>
              <select
                value={categoria}
                onChange={(event) => setCategoria(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400"
              >
                <option value="TODAS">Todas as categorias</option>
                {categoriasDisponiveis.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-300">
                Tipo de conteúdo
              </span>
              <select
                value={tipo}
                onChange={(event) => setTipo(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400"
              >
                <option value="TODOS">Todos os tipos</option>
                {tiposDisponiveis.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void carregarFavoritos()}
              disabled={carregando}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-black text-slate-950 hover:bg-amber-300 disabled:opacity-50"
            >
              <Search size={18} />
              Aplicar filtros
            </button>

            <button
              type="button"
              onClick={() => {
                limparFiltros();
                window.setTimeout(() => void carregarFavoritos(), 0);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 font-bold text-slate-300 hover:bg-slate-800"
            >
              <RotateCcw size={18} />
              Limpar
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-sm font-semibold text-slate-400">
            Favoritos encontrados
          </p>
          <p className="mt-2 text-4xl font-black">{favoritos.length}</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {carregando ? (
            <Mensagem texto="Carregando favoritos..." />
          ) : favoritos.length === 0 ? (
            <Mensagem
              titulo="Nenhum favorito encontrado"
              texto="Salve uma lei, artigo ou material usando o botão de favorito."
            />
          ) : (
            favoritos.map((item) => (
              <article
                key={item.id}
                className="flex min-h-64 flex-col rounded-3xl border border-slate-800 bg-slate-900/60 p-5 hover:border-amber-500/30"
              >
                <div className="mb-3 flex flex-wrap gap-2">
                  {item.categoria && (
                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
                      {item.categoria}
                    </span>
                  )}

                  {item.tipo_conteudo && (
                    <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">
                      {item.tipo_conteudo}
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-black">{item.titulo}</h2>

                <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-400">
                  {item.descricao || "Conteúdo jurídico salvo pelo usuário."}
                </p>

                <div className="mt-auto flex gap-2 pt-5">
                  <button
                    type="button"
                    onClick={() => void abrirFavorito(item)}
                    disabled={!item.url}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 font-black text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ExternalLink size={18} />
                    Abrir
                  </button>

                  <button
                    type="button"
                    onClick={() => void removerFavorito(item)}
                    className="inline-flex items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-300 hover:bg-red-500/20"
                    aria-label={`Remover ${item.titulo} dos favoritos`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

function Mensagem({
  titulo,
  texto,
}: {
  titulo?: string;
  texto: string;
}) {
  return (
    <div className="col-span-full rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center">
      <Star className="mx-auto mb-3 text-slate-600" size={38} />
      {titulo && <h2 className="text-lg font-bold">{titulo}</h2>}
      <p className="mt-1 text-sm text-slate-400">{texto}</p>
    </div>
  );
}
