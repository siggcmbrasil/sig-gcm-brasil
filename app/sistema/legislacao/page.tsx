"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  ExternalLink,
  FileText,
  Gavel,
  Pencil,
  Plus,
  Printer,
  Search,
  Star,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigCentralHeader from "@/components/sig/SigCentralHeader";


type Legislacao = {
  id: number;
  titulo: string;
  categoria: string;
  descricao: string | null;
  artigo: string | null;
  texto_lei: string | null;
  aplicacao_operacional: string | null;
  palavras_chave: string | null;
  situacao_operacional: string | null;
  favorito: boolean;
};

type AbaAtiva = "LEGISLACOES" | "ORGAOS" | "CADASTRO";

const ITENS_POR_PAGINA = 12;

const categorias = [
  "Guarda Municipal",
  "Trânsito",
  "Penal",
  "ECA",
  "Maria da Penha",
  "Ambiental",
  "Municipal",
  "Administrativo",
  "Outros",
];

const estilosCategoria: Record<string, string> = {
  "Guarda Municipal": "border-blue-500/35 bg-blue-500/10 text-blue-300",
  Trânsito: "border-amber-500/35 bg-amber-500/10 text-amber-300",
  Penal: "border-red-500/35 bg-red-500/10 text-red-300",
  ECA: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300",
  "Maria da Penha": "border-pink-500/35 bg-pink-500/10 text-pink-300",
  Ambiental: "border-green-500/35 bg-green-500/10 text-green-300",
  Municipal: "border-violet-500/35 bg-violet-500/10 text-violet-300",
  Administrativo: "border-slate-500/35 bg-slate-500/10 text-slate-300",
  Outros: "border-zinc-500/35 bg-zinc-500/10 text-zinc-300",
};

const orgaosOficiais = [
  {
    nome: "Estatuto Geral das Guardas Municipais",
    descricao: "Lei nº 13.022/2014 — normas gerais das Guardas Municipais.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l13022.htm",
  },
  {
    nome: "Planalto",
    descricao: "Portal oficial da legislação federal brasileira.",
    link: "https://www4.planalto.gov.br/legislacao",
  },
  {
    nome: "Constituição Federal",
    descricao: "Constituição da República Federativa do Brasil.",
    link: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
  },
  {
    nome: "Código Penal",
    descricao: "Decreto-Lei nº 2.848/1940.",
    link: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm",
  },
  {
    nome: "Código de Processo Penal",
    descricao: "Decreto-Lei nº 3.689/1941.",
    link: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm",
  },
  {
    nome: "Código de Trânsito Brasileiro",
    descricao: "Lei nº 9.503/1997.",
    link: "https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm",
  },
  {
    nome: "ECA",
    descricao: "Lei nº 8.069/1990.",
    link: "https://www.planalto.gov.br/ccivil_03/leis/l8069.htm",
  },
  {
    nome: "Lei Maria da Penha",
    descricao: "Lei nº 11.340/2006.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11340.htm",
  },
  {
    nome: "Lei de Drogas",
    descricao: "Lei nº 11.343/2006.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11343.htm",
  },
  {
    nome: "STF",
    descricao: "Supremo Tribunal Federal.",
    link: "https://portal.stf.jus.br/",
  },
  {
    nome: "STJ",
    descricao: "Superior Tribunal de Justiça.",
    link: "https://www.stj.jus.br/",
  },
  {
    nome: "CNJ",
    descricao: "Conselho Nacional de Justiça.",
    link: "https://www.cnj.jus.br/",
  },
];

export default function LegislacaoPage() {
  const [legislacoes, setLegislacoes] = useState<Legislacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>("LEGISLACOES");

  const [busca, setBusca] = useState("");
  const [buscaOrgao, setBuscaOrgao] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("TODAS");
  const [paginaAtual, setPaginaAtual] = useState(1);

  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("Guarda Municipal");
  const [descricao, setDescricao] = useState("");
  const [artigo, setArtigo] = useState("");
  const [textoLei, setTextoLei] = useState("");
  const [aplicacao, setAplicacao] = useState("");
  const [palavrasChave, setPalavrasChave] = useState("");
  const [situacaoOperacional, setSituacaoOperacional] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [legislacaoAberta, setLegislacaoAberta] = useState<Legislacao | null>(null);

  useEffect(() => {
    void carregarLegislacoes();
  }, []);

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, categoriaFiltro]);

  async function carregarLegislacoes() {
    setIsLoading(true);

    const { data, error } = await supabase
      .from("legislacoes")
      .select("*")
      .order("favorito", { ascending: false })
      .order("criado_em", { ascending: false });

    setIsLoading(false);

    if (error) {
      console.error("Erro ao carregar legislações:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      alert("Não foi possível carregar as legislações.");
      return;
    }

    setLegislacoes((data || []) as Legislacao[]);
  }

  function limparFormulario() {
    setTitulo("");
    setCategoria("Guarda Municipal");
    setDescricao("");
    setArtigo("");
    setTextoLei("");
    setAplicacao("");
    setPalavrasChave("");
    setSituacaoOperacional("");
    setEditandoId(null);
  }

  async function salvarLegislacao() {
    if (!titulo.trim() || !categoria.trim()) {
      alert("Preencha o título e a categoria.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      titulo: titulo.trim(),
      categoria,
      descricao: descricao.trim() || null,
      artigo: artigo.trim() || null,
      texto_lei: textoLei.trim() || null,
      aplicacao_operacional: aplicacao.trim() || null,
      palavras_chave: palavrasChave.trim() || null,
      situacao_operacional: situacaoOperacional.trim() || null,
      favorito: editandoId
        ? legislacoes.find((item) => item.id === editandoId)?.favorito || false
        : false,
    };

    const { error } = editandoId
      ? await supabase.from("legislacoes").update(payload).eq("id", editandoId)
      : await supabase.from("legislacoes").insert(payload);

    setIsSubmitting(false);

    if (error) {
      console.error("Erro ao salvar legislação:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      alert("Erro ao salvar legislação.");
      return;
    }

    limparFormulario();
    await carregarLegislacoes();
    setAbaAtiva("LEGISLACOES");
  }

  function editarLegislacao(item: Legislacao) {
    setEditandoId(item.id);
    setTitulo(item.titulo || "");
    setCategoria(item.categoria || "Guarda Municipal");
    setDescricao(item.descricao || "");
    setArtigo(item.artigo || "");
    setTextoLei(item.texto_lei || "");
    setAplicacao(item.aplicacao_operacional || "");
    setPalavrasChave(item.palavras_chave || "");
    setSituacaoOperacional(item.situacao_operacional || "");
    setAbaAtiva("CADASTRO");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function alternarFavorito(item: Legislacao) {
    const novoValor = !item.favorito;

    setLegislacoes((atual) =>
      atual.map((legislacao) =>
        legislacao.id === item.id
          ? { ...legislacao, favorito: novoValor }
          : legislacao,
      ),
    );

    const { error } = await supabase
      .from("legislacoes")
      .update({ favorito: novoValor })
      .eq("id", item.id);

    if (error) {
      console.error("Erro ao alterar favorito:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      await carregarLegislacoes();
    }
  }

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return legislacoes.filter((item) => {
      const conteudo = [
        item.titulo,
        item.categoria,
        item.descricao,
        item.artigo,
        item.texto_lei,
        item.aplicacao_operacional,
        item.palavras_chave,
        item.situacao_operacional,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const correspondeBusca = !termo || conteudo.includes(termo);
      const correspondeCategoria =
        categoriaFiltro === "TODAS" || item.categoria === categoriaFiltro;

      return correspondeBusca && correspondeCategoria;
    });
  }, [legislacoes, busca, categoriaFiltro]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / ITENS_POR_PAGINA));
  const inicioPagina = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const itensPagina = filtradas.slice(inicioPagina, inicioPagina + ITENS_POR_PAGINA);

  const orgaosFiltrados = useMemo(() => {
    const termo = buscaOrgao.trim().toLowerCase();

    return orgaosOficiais.filter((orgao) =>
      `${orgao.nome} ${orgao.descricao}`.toLowerCase().includes(termo),
    );
  }, [buscaOrgao]);

  const totalFavoritas = legislacoes.filter((item) => item.favorito).length;

  return (
    <main className="min-h-screen bg-[#07152E] p-4 pb-24 text-white md:p-6">
      <div className="w-full space-y-5">
        <SigCentralHeader
          titulo="Biblioteca de Legislação"
          descricao="Encontre a norma primeiro. Os detalhes aparecem somente quando o conteúdo for aberto."
          icone={Gavel}
        />

        <section className="rounded-3xl border border-cyan-500/15 bg-slate-950/45 p-4 md:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                Consulta organizada
              </p>
              <h2 className="mt-1 text-xl font-black text-white">
                Localize a legislação sem abrir vários textos ao mesmo tempo
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                A lista mostra somente título, categoria, referência e resumo. Abra um item para ler o conteúdo completo.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-300">
              <ResumoCompacto titulo="Registros" valor={legislacoes.length} />
              <ResumoCompacto titulo="Favoritos" valor={totalFavoritas} />
              <ResumoCompacto titulo="Encontrados" valor={filtradas.length} />
            </div>
          </div>
        </section>

        <nav className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2 sm:flex-row">
          <BotaoAba
            ativo={abaAtiva === "LEGISLACOES"}
            onClick={() => setAbaAtiva("LEGISLACOES")}
            icone={BookOpen}
            titulo="Biblioteca"
          />
          <BotaoAba
            ativo={abaAtiva === "ORGAOS"}
            onClick={() => setAbaAtiva("ORGAOS")}
            icone={Building2}
            titulo="Fontes oficiais"
          />
          <BotaoAba
            ativo={abaAtiva === "CADASTRO"}
            onClick={() => {
              limparFormulario();
              setAbaAtiva("CADASTRO");
            }}
            icone={Plus}
            titulo="Cadastrar"
          />
        </nav>

        {abaAtiva === "LEGISLACOES" ? (
          <>
            <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-4 md:p-5">
              <div className="grid gap-3 lg:grid-cols-[1fr_260px_auto]">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-300" />
                  <input
                    value={busca}
                    onChange={(evento) => setBusca(evento.target.value)}
                    placeholder="Pesquisar por lei, artigo, tema ou palavra-chave..."
                    className="h-13 w-full rounded-2xl border border-white/10 bg-[#071226] py-3 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-500/60"
                  />
                </label>

                <select
                  value={categoriaFiltro}
                  onChange={(evento) => setCategoriaFiltro(evento.target.value)}
                  className="h-13 rounded-2xl border border-white/10 bg-[#071226] px-4 py-3 text-white outline-none transition focus:border-cyan-500/60"
                >
                  <option value="TODAS">Todas as categorias</option>
                  {categorias.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                {(busca || categoriaFiltro !== "TODAS") ? (
                  <button
                    type="button"
                    onClick={() => {
                      setBusca("");
                      setCategoriaFiltro("TODAS");
                    }}
                    className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-slate-300 transition hover:border-cyan-500/40 hover:text-cyan-300"
                  >
                    Limpar filtros
                  </button>
                ) : null}
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/40">
              <div className="flex flex-col gap-2 border-b border-white/10 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
                <div>
                  <h2 className="font-black text-white">Resultados da biblioteca</h2>
                  <p className="text-sm text-slate-500">
                    {filtradas.length} registro(s) localizado(s)
                  </p>
                </div>

                {filtradas.length > 0 ? (
                  <p className="text-xs font-bold text-slate-500">
                    Página {paginaAtual} de {totalPaginas}
                  </p>
                ) : null}
              </div>

              {isLoading ? (
                <EstadoLista texto="Carregando legislações..." />
              ) : itensPagina.length === 0 ? (
                <EstadoLista texto="Nenhuma legislação encontrada com esses filtros." />
              ) : (
                <div className="divide-y divide-white/10">
                  {itensPagina.map((item) => (
                    <article
                      key={item.id}
                      className="group px-4 py-4 transition hover:bg-white/[0.025] md:px-5"
                    >
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                        <button
                          type="button"
                          onClick={() => setLegislacaoAberta(item)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black ${
                                estilosCategoria[item.categoria] || estilosCategoria.Outros
                              }`}
                            >
                              {item.categoria}
                            </span>

                            {item.artigo ? (
                              <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-slate-400">
                                {item.artigo}
                              </span>
                            ) : null}

                            {item.favorito ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300">
                                <Star className="h-3.5 w-3.5 fill-current" />
                                Favorito
                              </span>
                            ) : null}
                          </div>

                          <h3 className="mt-2 text-base font-black text-white transition group-hover:text-cyan-300 md:text-lg">
                            {item.titulo}
                          </h3>

                          <p className="mt-1 line-clamp-2 max-w-5xl text-sm leading-6 text-slate-400">
                            {item.descricao ||
                              item.aplicacao_operacional ||
                              "Conteúdo disponível para consulta."}
                          </p>
                        </button>

                        <div className="flex shrink-0 flex-wrap items-center gap-2 xl:justify-end">
                          <button
                            type="button"
                            onClick={() => void alternarFavorito(item)}
                            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                              item.favorito
                                ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                                : "border-white/10 text-slate-500 hover:border-amber-500/40 hover:text-amber-300"
                            }`}
                            title={item.favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                          >
                            <Star className={`h-4 w-4 ${item.favorito ? "fill-current" : ""}`} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setLegislacaoAberta(item)}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-black text-white transition hover:bg-cyan-500"
                          >
                            <BookOpen className="h-4 w-4" />
                            Ler conteúdo
                          </button>

                          <button
                            type="button"
                            onClick={() => editarLegislacao(item)}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm font-bold text-slate-300 transition hover:border-blue-500/40 hover:text-blue-300"
                          >
                            <Pencil className="h-4 w-4" />
                            Editar
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {!isLoading && filtradas.length > ITENS_POR_PAGINA ? (
                <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-4 md:px-5">
                  <button
                    type="button"
                    disabled={paginaAtual <= 1}
                    onClick={() => setPaginaAtual((atual) => Math.max(1, atual - 1))}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Anterior
                  </button>

                  <span className="text-sm font-bold text-slate-400">
                    {paginaAtual} / {totalPaginas}
                  </span>

                  <button
                    type="button"
                    disabled={paginaAtual >= totalPaginas}
                    onClick={() =>
                      setPaginaAtual((atual) => Math.min(totalPaginas, atual + 1))
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 transition hover:border-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Próxima
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </section>
          </>
        ) : null}

        {abaAtiva === "ORGAOS" ? (
          <section className="rounded-3xl border border-white/10 bg-slate-950/45 p-4 md:p-6">
            <div className="max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                Fontes externas
              </p>
              <h2 className="mt-1 text-2xl font-black text-white">Órgãos e textos oficiais</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Use estes links para confirmar a redação vigente da norma e consultar a fonte pública responsável.
              </p>
            </div>

            <label className="relative mt-5 block max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-300" />
              <input
                value={buscaOrgao}
                onChange={(evento) => setBuscaOrgao(evento.target.value)}
                placeholder="Pesquisar fonte oficial..."
                className="w-full rounded-2xl border border-white/10 bg-[#071226] py-3 pl-12 pr-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-500/60"
              />
            </label>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {orgaosFiltrados.map((orgao) => (
                <a
                  key={orgao.nome}
                  href={orgao.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group rounded-2xl border border-white/10 bg-slate-950/60 p-4 transition hover:border-cyan-500/40"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2.5 text-cyan-300">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-black text-white group-hover:text-cyan-300">
                        {orgao.nome}
                      </h3>
                      <p className="mt-1 text-sm leading-5 text-slate-400">{orgao.descricao}</p>
                      <span className="mt-3 inline-flex items-center gap-2 text-xs font-black text-cyan-300">
                        Acessar fonte
                        <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ) : null}

        {abaAtiva === "CADASTRO" ? (
          <section className="rounded-3xl border border-white/10 bg-slate-950/45 p-4 md:p-6">
            <div className="flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                  Gestão do conteúdo
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">
                  {editandoId ? "Editar legislação" : "Cadastrar legislação"}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Preencha o resumo e deixe o conteúdo completo para a tela de leitura.
                </p>
              </div>

              {editandoId ? (
                <button
                  type="button"
                  onClick={limparFormulario}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-300 hover:border-red-500/40 hover:text-red-300"
                >
                  <X className="h-4 w-4" />
                  Cancelar edição
                </button>
              ) : null}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <CampoRotulo titulo="Título da legislação" obrigatorio>
                <input
                  value={titulo}
                  onChange={(evento) => setTitulo(evento.target.value)}
                  className="input-biblioteca"
                  placeholder="Ex.: Código Penal — Ameaça"
                />
              </CampoRotulo>

              <CampoRotulo titulo="Categoria" obrigatorio>
                <select
                  value={categoria}
                  onChange={(evento) => setCategoria(evento.target.value)}
                  className="input-biblioteca"
                >
                  {categorias.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </CampoRotulo>

              <CampoRotulo titulo="Referência legal">
                <input
                  value={artigo}
                  onChange={(evento) => setArtigo(evento.target.value)}
                  className="input-biblioteca"
                  placeholder="Ex.: Art. 147 do Código Penal"
                />
              </CampoRotulo>

              <CampoRotulo titulo="Situação operacional">
                <input
                  value={situacaoOperacional}
                  onChange={(evento) => setSituacaoOperacional(evento.target.value)}
                  className="input-biblioteca"
                  placeholder="Ex.: ameaça, abordagem, trânsito"
                />
              </CampoRotulo>

              <CampoRotulo titulo="Resumo" classe="md:col-span-2">
                <textarea
                  value={descricao}
                  onChange={(evento) => setDescricao(evento.target.value)}
                  className="input-biblioteca min-h-24 resize-y"
                  placeholder="Explique de forma curta o que o usuário encontrará neste conteúdo."
                />
              </CampoRotulo>

              <CampoRotulo titulo="Palavras-chave" classe="md:col-span-2">
                <input
                  value={palavrasChave}
                  onChange={(evento) => setPalavrasChave(evento.target.value)}
                  className="input-biblioteca"
                  placeholder="Ex.: ameaça, vítima, representação, flagrante"
                />
              </CampoRotulo>

              <CampoRotulo titulo="Texto legal ou conteúdo jurídico" classe="md:col-span-2">
                <textarea
                  value={textoLei}
                  onChange={(evento) => setTextoLei(evento.target.value)}
                  className="input-biblioteca min-h-44 resize-y"
                  placeholder="Insira o texto jurídico que será exibido somente na leitura completa."
                />
              </CampoRotulo>

              <CampoRotulo titulo="Aplicação operacional" classe="md:col-span-2">
                <textarea
                  value={aplicacao}
                  onChange={(evento) => setAplicacao(evento.target.value)}
                  className="input-biblioteca min-h-36 resize-y"
                  placeholder="Explique como a norma se relaciona com a atuação da Guarda Municipal."
                />
              </CampoRotulo>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => void salvarLegislacao()}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-cyan-600 px-6 py-3 font-black text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-5 w-5" />
                {isSubmitting
                  ? "Salvando..."
                  : editandoId
                    ? "Salvar alterações"
                    : "Cadastrar legislação"}
              </button>
            </div>
          </section>
        ) : null}
      </div>

      {legislacaoAberta ? (
        <DetalhesLegislacao
          item={legislacaoAberta}
          aoFechar={() => setLegislacaoAberta(null)}
          aoEditar={() => {
            editarLegislacao(legislacaoAberta);
            setLegislacaoAberta(null);
          }}
        />
      ) : null}

      <style jsx global>{`
        .input-biblioteca {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: #071226;
          padding: 0.85rem 1rem;
          color: white;
          outline: none;
          transition: border-color 0.2s ease;
        }

        .input-biblioteca:focus {
          border-color: rgba(6, 182, 212, 0.65);
        }
      `}</style>
    </main>
  );
}

function DetalhesLegislacao({
  item,
  aoFechar,
  aoEditar,
}: {
  item: Legislacao;
  aoFechar: () => void;
  aoEditar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[999] overflow-y-auto bg-black/80 p-3 backdrop-blur-sm md:p-6">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-cyan-500/25 bg-[#07152E] shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-[#07152E]/95 p-5 backdrop-blur md:p-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${
                  estilosCategoria[item.categoria] || estilosCategoria.Outros
                }`}
              >
                {item.categoria}
              </span>
              {item.artigo ? (
                <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-300">
                  {item.artigo}
                </span>
              ) : null}
            </div>

            <h2 className="mt-3 text-2xl font-black text-white md:text-3xl">{item.titulo}</h2>
          </div>

          <button
            type="button"
            onClick={aoFechar}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-slate-300 transition hover:border-red-500/40 hover:text-red-300"
            title="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-4 p-5 md:p-6">
          <div className="grid gap-3 md:grid-cols-2">
            <InfoDetalhe titulo="Referência legal" valor={item.artigo || "Não informado"} />
            <InfoDetalhe
              titulo="Situação operacional"
              valor={item.situacao_operacional || "Não informado"}
            />
            <InfoDetalhe titulo="Categoria" valor={item.categoria || "Não informado"} />
            <InfoDetalhe titulo="Palavras-chave" valor={item.palavras_chave || "Não informado"} />
          </div>

          <SecaoDetalhe
            titulo="Resumo"
            conteudo={item.descricao}
            icone={FileText}
            vazio="Nenhum resumo foi informado."
          />

          <SecaoDetalhe
            titulo="Texto legal ou conteúdo jurídico"
            conteudo={item.texto_lei}
            icone={Gavel}
            vazio="Nenhum texto jurídico foi informado."
          />

          <SecaoDetalhe
            titulo="Aplicação operacional"
            conteudo={item.aplicacao_operacional}
            icone={BookOpen}
            vazio="Nenhuma aplicação operacional foi informada."
            destaque
          />

          <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-sm font-black text-amber-300">Atenção</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Este conteúdo serve como apoio de consulta. Em situações sensíveis, confirme a redação vigente na fonte oficial e siga os protocolos institucionais.
            </p>
          </section>

          <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 pt-5">
            <button
              type="button"
              onClick={aoEditar}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-500/30 px-4 py-2.5 text-sm font-bold text-blue-300 transition hover:bg-blue-500/10"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/5"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecaoDetalhe({
  titulo,
  conteudo,
  icone: Icone,
  vazio,
  destaque = false,
}: {
  titulo: string;
  conteudo: string | null;
  icone: LucideIcon;
  vazio: string;
  destaque?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border p-5 ${
        destaque
          ? "border-blue-500/25 bg-blue-500/5"
          : "border-white/10 bg-slate-950/55"
      }`}
    >
      <div className="flex items-center gap-2">
        <Icone className={`h-5 w-5 ${destaque ? "text-blue-300" : "text-cyan-300"}`} />
        <h3 className="font-black text-white">{titulo}</h3>
      </div>
      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-300">
        {conteudo || vazio}
      </p>
    </section>
  );
}

function InfoDetalhe({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
        {titulo}
      </p>
      <p className="mt-1 text-sm font-bold leading-6 text-slate-200">{valor}</p>
    </div>
  );
}

function CampoRotulo({
  titulo,
  obrigatorio = false,
  classe = "",
  children,
}: {
  titulo: string;
  obrigatorio?: boolean;
  classe?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={classe}>
      <span className="mb-2 block text-sm font-bold text-slate-300">
        {titulo}
        {obrigatorio ? <span className="ml-1 text-cyan-300">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function ResumoCompacto({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <span className="rounded-xl border border-white/10 bg-slate-950/55 px-3 py-2">
      <span className="text-slate-500">{titulo}: </span>
      <span className="text-white">{valor}</span>
    </span>
  );
}

function EstadoLista({ texto }: { texto: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center p-8 text-center text-sm text-slate-400">
      {texto}
    </div>
  );
}

function BotaoAba({
  ativo,
  onClick,
  icone: Icone,
  titulo,
}: {
  ativo: boolean;
  onClick: () => void;
  icone: LucideIcon;
  titulo: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${
        ativo
          ? "bg-cyan-600 text-white shadow-lg shadow-cyan-950/30"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icone className="h-4 w-4" />
      {titulo}
    </button>
  );
}
