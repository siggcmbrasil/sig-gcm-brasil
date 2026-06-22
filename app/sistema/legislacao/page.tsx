"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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

const orgaosOficiais = [
  {
    nome: "Senado Federal",
    icone: "🏛️",
    descricao: "Consulta de legislação, Constituição e normas federais.",
    link: "https://www25.senado.leg.br/web/atividade/legislacao",
  },
  {
    nome: "Planalto",
    icone: "📜",
    descricao: "Portal oficial da legislação federal brasileira.",
    link: "https://www4.planalto.gov.br/legislacao",
  },
  {
    nome: "Câmara dos Deputados",
    icone: "⚖️",
    descricao: "Pesquisa de legislação federal e normas da Câmara.",
    link: "https://www.camara.leg.br/legislacao",
  },
  {
    nome: "Normas.leg.br",
    icone: "🔎",
    descricao: "Busca integrada de normas e alterações ao longo do tempo.",
    link: "https://normas.leg.br/busca",
  },
  {
    nome: "STF",
    icone: "🏛️",
    descricao: "Consulta ao Supremo Tribunal Federal.",
    link: "https://portal.stf.jus.br/",
  },
  {
    nome: "STJ",
    icone: "⚖️",
    descricao: "Consulta ao Superior Tribunal de Justiça.",
    link: "https://www.stj.jus.br/",
  },
  {
    nome: "CNJ",
    icone: "📚",
    descricao: "Normas, atos e resoluções do Conselho Nacional de Justiça.",
    link: "https://www.cnj.jus.br/",
  },
];

export default function LegislacaoPage() {
  const [legislacoes, setLegislacoes] = useState<Legislacao[]>([]);
  const [busca, setBusca] = useState("");
  const [buscaOrgao, setBuscaOrgao] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("TODAS");
  const [abaAtiva, setAbaAtiva] = useState<"LEGISLACOES" | "ORGAOS">(
    "LEGISLACOES"
  );

  const [titulo, setTitulo] = useState("");
  const [categoria, setCategoria] = useState("Guarda Municipal");
  const [descricao, setDescricao] = useState("");
  const [artigo, setArtigo] = useState("");
  const [textoLei, setTextoLei] = useState("");
  const [aplicacao, setAplicacao] = useState("");

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
    "Guarda Municipal": "bg-blue-600",
    Trânsito: "bg-yellow-600",
    Penal: "bg-red-600",
    ECA: "bg-green-600",
    "Maria da Penha": "bg-pink-600",
    Ambiental: "bg-emerald-600",
    Municipal: "bg-purple-600",
    Administrativo: "bg-slate-600",
    Outros: "bg-zinc-600",
  };

  const iconesCategoria: Record<string, string> = {
    "Guarda Municipal": "🛡️",
    Trânsito: "🚦",
    Penal: "⚖️",
    ECA: "👨‍👩‍👧‍👦",
    "Maria da Penha": "🟣",
    Ambiental: "🌳",
    Municipal: "🏛️",
    Administrativo: "📋",
    Outros: "📚",
  };

  useEffect(() => {
    carregarLegislacoes();
  }, []);

  async function carregarLegislacoes() {
    const { data, error } = await supabase
      .from("legislacoes")
      .select("*")
      .order("favorito", { ascending: false })
      .order("criado_em", { ascending: false });

    if (!error && data) setLegislacoes(data);
  }

  async function cadastrarLegislacao() {
    if (!titulo || !categoria) {
      alert("Preencha o título e a categoria.");
      return;
    }

    const { error } = await supabase.from("legislacoes").insert({
      titulo,
      categoria,
      descricao,
      artigo,
      texto_lei: textoLei,
      aplicacao_operacional: aplicacao,
    });

    if (error) {
      alert("Erro ao cadastrar legislação.");
      return;
    }

    setTitulo("");
    setCategoria("Guarda Municipal");
    setDescricao("");
    setArtigo("");
    setTextoLei("");
    setAplicacao("");
    carregarLegislacoes();
  }

  async function alternarFavorito(item: Legislacao) {
    await supabase
      .from("legislacoes")
      .update({ favorito: !item.favorito })
      .eq("id", item.id);

    carregarLegislacoes();
  }

  const filtradas = legislacoes.filter((item) => {
    const texto = `
      ${item.titulo}
      ${item.categoria}
      ${item.descricao}
      ${item.artigo}
      ${item.texto_lei}
      ${item.aplicacao_operacional}
      ${item.palavras_chave}
      ${item.situacao_operacional}
    `.toLowerCase();

    return (
      texto.includes(busca.toLowerCase()) &&
      (categoriaFiltro === "TODAS" || item.categoria === categoriaFiltro)
    );
  });

  const orgaosFiltrados = orgaosOficiais.filter((orgao) => {
    const texto = `${orgao.nome} ${orgao.descricao}`.toLowerCase();
    return texto.includes(buscaOrgao.toLowerCase());
  });

  const totalLegislacoes = legislacoes.length;
  const totalFavoritas = legislacoes.filter((item) => item.favorito).length;
  const totalTransito = legislacoes.filter(
    (item) => item.categoria === "Trânsito"
  ).length;
  const totalPenal = legislacoes.filter(
    (item) => item.categoria === "Penal"
  ).length;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold">⚖️ Módulo de Legislação</h1>
          <p className="text-slate-400">
            Consulta rápida de leis, artigos, orientações operacionais e bases
            oficiais.
          </p>
        </header>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setAbaAtiva("LEGISLACOES")}
            className={`px-5 py-3 rounded-xl font-semibold ${
              abaAtiva === "LEGISLACOES"
                ? "bg-blue-600 text-white"
                : "bg-slate-900 border border-slate-800 text-slate-300"
            }`}
          >
            📚 Legislações cadastradas
          </button>

          <button
            onClick={() => setAbaAtiva("ORGAOS")}
            className={`px-5 py-3 rounded-xl font-semibold ${
              abaAtiva === "ORGAOS"
                ? "bg-blue-600 text-white"
                : "bg-slate-900 border border-slate-800 text-slate-300"
            }`}
          >
            🏛️ Órgãos oficiais
          </button>
        </div>

        {abaAtiva === "LEGISLACOES" && (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <p className="text-slate-400 text-sm">Total de legislações</p>
                <h2 className="text-3xl font-bold">📚 {totalLegislacoes}</h2>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <p className="text-slate-400 text-sm">Favoritas</p>
                <h2 className="text-3xl font-bold text-yellow-400">
                  ★ {totalFavoritas}
                </h2>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <p className="text-slate-400 text-sm">Trânsito</p>
                <h2 className="text-3xl font-bold">🚦 {totalTransito}</h2>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <p className="text-slate-400 text-sm">Penal</p>
                <h2 className="text-3xl font-bold">⚖️ {totalPenal}</h2>
              </div>
            </section>

            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h2 className="text-xl font-semibold">Cadastrar legislação</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
                  placeholder="Título da legislação"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />

                <select
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                >
                  {categorias.map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
                </select>

                <input
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
                  placeholder="Artigo / referência"
                  value={artigo}
                  onChange={(e) => setArtigo(e.target.value)}
                />

                <input
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
                  placeholder="Descrição resumida"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>

              <textarea
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 min-h-28"
                placeholder="Texto da lei ou resumo jurídico"
                value={textoLei}
                onChange={(e) => setTextoLei(e.target.value)}
              />

              <textarea
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 min-h-24"
                placeholder="Aplicação operacional"
                value={aplicacao}
                onChange={(e) => setAplicacao(e.target.value)}
              />

              <button
                onClick={cadastrarLegislacao}
                className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold"
              >
                Cadastrar legislação
              </button>
            </section>

            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-3"
                  placeholder="Pesquisar por palavra-chave, artigo, situação ou lei..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />

                <select
                  className="bg-slate-800 border border-slate-700 rounded-xl p-3"
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                >
                  <option value="TODAS">Todas as categorias</option>
                  {categorias.map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filtradas.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3"
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold">{item.titulo}</h3>
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white ${
                            estilosCategoria[item.categoria] || "bg-slate-600"
                          }`}
                        >
                          {iconesCategoria[item.categoria] || "📚"}{" "}
                          {item.categoria}
                        </span>
                      </div>

                      <button
                        onClick={() => alternarFavorito(item)}
                        className="text-yellow-400 text-xl"
                      >
                        {item.favorito ? "★" : "☆"}
                      </button>
                    </div>

                    {item.artigo && (
                      <p className="text-sm text-slate-300">
                        <strong>Referência:</strong> {item.artigo}
                      </p>
                    )}

                    {item.descricao && (
                      <p className="text-slate-300">{item.descricao}</p>
                    )}

                    {item.texto_lei && (
                      <p className="text-sm text-slate-300 whitespace-pre-line">
                        {item.texto_lei}
                      </p>
                    )}

                    {item.aplicacao_operacional && (
                      <div className="bg-blue-950/40 border border-blue-900 rounded-xl p-3">
                        <p className="text-sm font-semibold text-blue-300">
                          Aplicação operacional:
                        </p>
                        <p className="text-sm text-slate-200 whitespace-pre-line">
                          {item.aplicacao_operacional}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {filtradas.length === 0 && (
                  <p className="text-slate-400">
                    Nenhuma legislação encontrada.
                  </p>
                )}
              </div>
            </section>
          </>
        )}

        {abaAtiva === "ORGAOS" && (
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
            <div>
              <h2 className="text-xl font-bold">🏛️ Órgãos oficiais</h2>
              <p className="text-sm text-slate-400">
                Acesso rápido a bases oficiais de legislação, tribunais e
                consulta jurídica.
              </p>
            </div>

            <input
              value={buscaOrgao}
              onChange={(e) => setBuscaOrgao(e.target.value)}
              placeholder="Pesquisar órgão oficial..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {orgaosFiltrados.map((orgao) => (
                <div
                  key={orgao.nome}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-5 hover:border-blue-700 transition"
                >
                  <div className="text-4xl mb-3">{orgao.icone}</div>

                  <h3 className="text-white font-bold text-lg">
                    {orgao.nome}
                  </h3>

                  <p className="text-slate-400 text-sm mt-2 min-h-12">
                    {orgao.descricao}
                  </p>

                  <a
                    href={orgao.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Acessar órgão
                  </a>
                </div>
              ))}

              {orgaosFiltrados.length === 0 && (
                <p className="text-slate-400">Nenhum órgão encontrado.</p>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}