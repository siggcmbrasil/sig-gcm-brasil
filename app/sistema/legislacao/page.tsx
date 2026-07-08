"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Building2,
  ExternalLink,
  FileText,
  Gavel,
  Plus,
  Search,
  Star,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCard from "@/components/sig/SigCard";

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
    nome: "Estatuto Geral das Guardas Municipais",
    icone: "🛡️",
    descricao: "Lei nº 13.022/2014 — normas gerais das Guardas Municipais.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l13022.htm",
  },
  {
    nome: "Planalto",
    icone: "📜",
    descricao: "Portal oficial da legislação federal brasileira.",
    link: "https://www4.planalto.gov.br/legislacao",
  },
  {
    nome: "Constituição Federal",
    icone: "📘",
    descricao: "Constituição da República Federativa do Brasil.",
    link: "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
  },
  {
    nome: "Código Penal",
    icone: "⚖️",
    descricao: "Decreto-Lei nº 2.848/1940.",
    link: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del2848compilado.htm",
  },
  {
    nome: "Código de Processo Penal",
    icone: "📚",
    descricao: "Decreto-Lei nº 3.689/1941.",
    link: "https://www.planalto.gov.br/ccivil_03/decreto-lei/del3689compilado.htm",
  },
  {
    nome: "Código de Trânsito Brasileiro",
    icone: "🚦",
    descricao: "Lei nº 9.503/1997.",
    link: "https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm",
  },
  {
    nome: "ECA",
    icone: "👨‍👩‍👧‍👦",
    descricao: "Lei nº 8.069/1990.",
    link: "https://www.planalto.gov.br/ccivil_03/leis/l8069.htm",
  },
  {
    nome: "Lei Maria da Penha",
    icone: "🟣",
    descricao: "Lei nº 11.340/2006.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11340.htm",
  },
  {
    nome: "Lei de Drogas",
    icone: "⚠️",
    descricao: "Lei nº 11.343/2006.",
    link: "https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2006/lei/l11343.htm",
  },
  {
    nome: "STF",
    icone: "🏛️",
    descricao: "Supremo Tribunal Federal.",
    link: "https://portal.stf.jus.br/",
  },
  {
    nome: "STJ",
    icone: "⚖️",
    descricao: "Superior Tribunal de Justiça.",
    link: "https://www.stj.jus.br/",
  },
  {
    nome: "CNJ",
    icone: "📚",
    descricao: "Conselho Nacional de Justiça.",
    link: "https://www.cnj.jus.br/",
  },
];

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
  "Guarda Municipal": "border-blue-500/40 bg-blue-500/10 text-blue-300",
  Trânsito: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",
  Penal: "border-red-500/40 bg-red-500/10 text-red-300",
  ECA: "border-green-500/40 bg-green-500/10 text-green-300",
  "Maria da Penha": "border-pink-500/40 bg-pink-500/10 text-pink-300",
  Ambiental: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  Municipal: "border-purple-500/40 bg-purple-500/10 text-purple-300",
  Administrativo: "border-slate-500/40 bg-slate-500/10 text-slate-300",
  Outros: "border-zinc-500/40 bg-zinc-500/10 text-zinc-300",
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

export default function LegislacaoPage() {
  const [legislacoes, setLegislacoes] = useState<Legislacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [abaAtiva, setAbaAtiva] = useState<"LEGISLACOES" | "ORGAOS" | "CADASTRO">(
    "LEGISLACOES"
  );

  const [busca, setBusca] = useState("");
  const [buscaOrgao, setBuscaOrgao] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("TODAS");

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

  async function carregarLegislacoes() {
    setIsLoading(true);

    const { data, error } = await supabase
      .from("legislacoes")
      .select("*")
      .order("favorito", { ascending: false })
      .order("criado_em", { ascending: false });

    setIsLoading(false);

    if (error) {
      console.error("Erro ao carregar legislações:", error);
      alert("Não foi possível carregar as legislações.");
      return;
    }

    setLegislacoes(data || []);
  }

  async function salvarLegislacao() {
  if (!titulo || !categoria) {
    alert("Preencha o título e a categoria.");
    return;
  }

  setIsSubmitting(true);

  const payload = {
    titulo,
    categoria,
    descricao,
    artigo,
    texto_lei: textoLei,
    aplicacao_operacional: aplicacao,
    palavras_chave: palavrasChave,
    situacao_operacional: situacaoOperacional,
    favorito: false,
  };

  const { error } = editandoId
    ? await supabase
        .from("legislacoes")
        .update(payload)
        .eq("id", editandoId)
    : await supabase.from("legislacoes").insert(payload);

  setIsSubmitting(false);

  if (error) {
    console.error("Erro ao salvar legislação:", error);
    alert("Erro ao salvar legislação.");
    return;
  }

  setTitulo("");
  setCategoria("Guarda Municipal");
  setDescricao("");
  setArtigo("");
  setTextoLei("");
  setAplicacao("");
  setPalavrasChave("");
  setSituacaoOperacional("");
  setEditandoId(null);

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
}

  async function alternarFavorito(item: Legislacao) {
    setLegislacoes((prev) =>
      prev.map((leg) =>
        leg.id === item.id ? { ...leg, favorito: !leg.favorito } : leg
      )
    );

    const { error } = await supabase
      .from("legislacoes")
      .update({ favorito: !item.favorito })
      .eq("id", item.id);

    if (error) {
      console.error("Erro ao favoritar:", error);
      await carregarLegislacoes();
    }
  }

  const filtradas = useMemo(() => {
    return legislacoes.filter((item) => {
      const texto = `
        ${item.titulo || ""}
        ${item.categoria || ""}
        ${item.descricao || ""}
        ${item.artigo || ""}
        ${item.texto_lei || ""}
        ${item.aplicacao_operacional || ""}
        ${item.palavras_chave || ""}
        ${item.situacao_operacional || ""}
      `.toLowerCase();

      return (
        texto.includes(busca.toLowerCase()) &&
        (categoriaFiltro === "TODAS" || item.categoria === categoriaFiltro)
      );
    });
  }, [legislacoes, busca, categoriaFiltro]);

  const orgaosFiltrados = useMemo(() => {
    return orgaosOficiais.filter((orgao) => {
      const texto = `${orgao.nome} ${orgao.descricao}`.toLowerCase();
      return texto.includes(buscaOrgao.toLowerCase());
    });
  }, [buscaOrgao]);

  const totalLegislacoes = legislacoes.length;
  const totalFavoritas = legislacoes.filter((item) => item.favorito).length;
  const totalTransito = legislacoes.filter((item) => item.categoria === "Trânsito").length;
  const totalPenal = legislacoes.filter((item) => item.categoria === "Penal").length;

  return (
    <main className="min-h-screen bg-[#07152E] p-4 md:p-6 pb-24 text-white">
      <div className="w-full max-w-none space-y-6">
        <SigCentralHeader
          titulo="Central de Legislação"
          descricao="Biblioteca jurídica, órgãos oficiais, pesquisa de leis e aplicação operacional para a Guarda Municipal."
          icone={Gavel}
        />

        <section className="grid gap-4 md:grid-cols-4">
          <Resumo titulo="Legislações" valor={totalLegislacoes} icone={BookOpen} />
          <Resumo titulo="Favoritas" valor={totalFavoritas} icone={Star} />
          <Resumo titulo="Trânsito" valor={totalTransito} icone={FileText} />
          <Resumo titulo="Penal" valor={totalPenal} icone={Gavel} />
        </section>

        <SigCard>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#C9A227]">
                Consulta jurídica rápida
              </p>

              <h2 className="mt-1 text-2xl font-black text-white">
                Pesquisar legislação
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Pesquise por lei, artigo, categoria, palavra-chave ou aplicação operacional.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <input
                className="min-w-[280px] rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-[#C9A227]"
                placeholder="Ex: desacato, CTB, abordagem..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />

              <select
                className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-[#C9A227]"
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
              >
                <option value="TODAS">Todas</option>
                {categorias.map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </SigCard>

        <div className="flex flex-wrap gap-2">
  <FiltroRapido texto="🛡️ Guarda" valor="Guarda Municipal" setCategoriaFiltro={setCategoriaFiltro} />
  <FiltroRapido texto="🚦 Trânsito" valor="Trânsito" setCategoriaFiltro={setCategoriaFiltro} />
  <FiltroRapido texto="⚖️ Penal" valor="Penal" setCategoriaFiltro={setCategoriaFiltro} />
  <FiltroRapido texto="👶 ECA" valor="ECA" setCategoriaFiltro={setCategoriaFiltro} />
  <FiltroRapido texto="🟣 Maria da Penha" valor="Maria da Penha" setCategoriaFiltro={setCategoriaFiltro} />
  <FiltroRapido texto="🌳 Ambiental" valor="Ambiental" setCategoriaFiltro={setCategoriaFiltro} />
  <FiltroRapido texto="🏛️ Municipal" valor="Municipal" setCategoriaFiltro={setCategoriaFiltro} />
  <FiltroRapido texto="📚 Todas" valor="TODAS" setCategoriaFiltro={setCategoriaFiltro} />
</div>

        <div className="grid gap-3 md:grid-cols-3">
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
            titulo="Órgãos oficiais"
          />

          <BotaoAba
            ativo={abaAtiva === "CADASTRO"}
            onClick={() => setAbaAtiva("CADASTRO")}
            icone={Plus}
            titulo="Cadastrar legislação"
          />
        </div>

        {abaAtiva === "LEGISLACOES" && (
          <section className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5">
            {isLoading ? (
              <SigCard>
                <p className="text-slate-400">Carregando legislações...</p>
              </SigCard>
            ) : filtradas.length === 0 ? (
              <SigCard>
                <p className="text-slate-400">Nenhuma legislação encontrada.</p>
              </SigCard>
            ) : (
              filtradas.map((item) => (
                <article
  key={item.id}
  className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-4 hover:border-[#C9A227]/50 transition"
>
  <div className="flex justify-between gap-4">
    <div>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C9A227]">
        Dossiê Jurídico
      </p>

      <h3 className="mt-1 text-xl font-black text-white">
        {item.titulo}
      </h3>

      <span
        className={`mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black ${
          estilosCategoria[item.categoria] ||
          "border-slate-500/40 bg-slate-500/10 text-slate-300"
        }`}
      >
        {iconesCategoria[item.categoria] || "📚"} {item.categoria}
      </span>
    </div>

    <button
      type="button"
      onClick={() => alternarFavorito(item)}
      className={`text-3xl ${
        item.favorito
          ? "text-yellow-400"
          : "text-slate-600 hover:text-yellow-400"
      }`}
      title="Favoritar"
    >
      {item.favorito ? "★" : "☆"}
    </button>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    <InfoLei titulo="Referência legal" valor={item.artigo || "Não informado"} />
    <InfoLei titulo="Situação operacional" valor={item.situacao_operacional || "Não informado"} />
    <InfoLei titulo="Palavras-chave" valor={item.palavras_chave || "Não informado"} />
    <InfoLei titulo="Categoria" valor={item.categoria || "Não informado"} />
  </div>

  {item.descricao && (
    <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        Resumo
      </p>

      <p className="mt-2 text-sm leading-relaxed text-slate-200">
        {item.descricao}
      </p>
    </section>
  )}

  {item.texto_lei && (
    <section className="rounded-2xl border border-white/10 bg-slate-950 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        Texto legal / conteúdo jurídico
      </p>

      <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-slate-300 pr-2">
        {item.texto_lei}
      </p>
    </section>
  )}

  {item.aplicacao_operacional && (
    <section className="rounded-2xl border border-blue-500/30 bg-blue-950/30 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">
        Aplicação prática para a Guarda
      </p>

      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-100">
        {item.aplicacao_operacional}
      </p>
    </section>
  )}

  <section className="rounded-2xl border border-[#C9A227]/30 bg-[#C9A227]/10 p-4">
    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C9A227]">
      Uso operacional sugerido
    </p>

    <ul className="mt-2 space-y-1 text-sm text-slate-200">
      <li>• Consultar antes de registrar ocorrência relacionada.</li>
      <li>• Usar como base para relatório, orientação ou despacho.</li>
      <li>• Conferir sempre o texto oficial em caso de dúvida jurídica.</li>
    </ul>
  </section>

  <div className="flex flex-wrap justify-end gap-3 pt-2">
    <button
      type="button"
      onClick={() => editarLegislacao(item)}
      className="rounded-xl border border-yellow-500 px-4 py-2 text-sm font-bold text-yellow-400 hover:bg-yellow-500/10"
    >
      ✏️ Editar dossiê
    </button>

<button
  type="button"
  onClick={() => setLegislacaoAberta(item)}
  className="rounded-xl border border-cyan-500/50 px-4 py-2 text-sm font-bold text-cyan-300 hover:bg-cyan-500/10"
>
  📖 Ler completo
</button>

    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl border border-white/20 px-4 py-2 text-sm font-bold text-white hover:bg-white/10"
    >
      🖨️ Imprimir
    </button>
  </div>
</article>
              ))
            )}
          </section>
        )}

        {abaAtiva === "ORGAOS" && (
          <SigCard>
            <div className="mb-4">
              <h2 className="text-xl font-black text-white">Órgãos oficiais</h2>
              <p className="text-sm text-slate-400">
                Acesso rápido a bases oficiais de legislação, tribunais e normas.
              </p>
            </div>

            <input
              value={buscaOrgao}
              onChange={(e) => setBuscaOrgao(e.target.value)}
              placeholder="Pesquisar órgão oficial..."
              className="mb-5 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-[#C9A227]"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {orgaosFiltrados.map((orgao) => (
                <a
                  key={orgao.nome}
                  href={orgao.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-white/10 bg-slate-950 p-5 transition hover:border-[#C9A227]"
                >
                  <div className="text-4xl">{orgao.icone}</div>
                  <h3 className="mt-3 text-lg font-black text-white">
                    {orgao.nome}
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    {orgao.descricao}
                  </p>

                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#C9A227]">
                    Acessar <ExternalLink size={16} />
                  </span>
                </a>
              ))}
            </div>
          </SigCard>
        )}

        {abaAtiva === "CADASTRO" && (
          <SigCard>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-black text-white">
  <Plus className="text-[#C9A227]" />
  {editandoId ? "Editar legislação" : "Cadastrar legislação"}
</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                className="input-premium"
                placeholder="Título da legislação"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />

              <select
                className="input-premium"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                {categorias.map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>

              <input
                className="input-premium"
                placeholder="Artigo / referência"
                value={artigo}
                onChange={(e) => setArtigo(e.target.value)}
              />

              <input
                className="input-premium"
                placeholder="Descrição resumida"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />

              <input
                className="input-premium"
                placeholder="Palavras-chave. Ex: abordagem, flagrante, desacato"
                value={palavrasChave}
                onChange={(e) => setPalavrasChave(e.target.value)}
              />

              <input
                className="input-premium"
                placeholder="Situação operacional. Ex: abordagem, ocorrência, trânsito"
                value={situacaoOperacional}
                onChange={(e) => setSituacaoOperacional(e.target.value)}
              />
            </div>

            <textarea
              className="input-premium mt-4 min-h-32 w-full"
              placeholder="Texto da lei ou resumo jurídico"
              value={textoLei}
              onChange={(e) => setTextoLei(e.target.value)}
            />

            <textarea
              className="input-premium mt-4 min-h-28 w-full"
              placeholder="Aplicação operacional"
              value={aplicacao}
              onChange={(e) => setAplicacao(e.target.value)}
            />

            <button
  type="button"
  onClick={salvarLegislacao}
  disabled={isSubmitting}
  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#C9A227] px-5 py-3 font-black text-black hover:bg-yellow-400 disabled:opacity-50"
>
  <Plus size={18} />

  {isSubmitting
    ? "Salvando..."
    : editandoId
    ? "Salvar alterações"
    : "Cadastrar legislação"}
</button>
          </SigCard>
        )}
      </div>

{legislacaoAberta && (
  <div className="fixed inset-0 z-[999] bg-black/80 p-4 overflow-y-auto">
    <div className="mx-auto max-w-5xl rounded-3xl border border-[#C9A227]/40 bg-[#07152E] p-6 text-white shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#C9A227]">
            Dossiê Jurídico
          </p>

          <h2 className="mt-2 text-3xl font-black">
            {legislacaoAberta.titulo}
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            {legislacaoAberta.categoria}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setLegislacaoAberta(null)}
          className="rounded-xl border border-red-500/50 px-4 py-2 font-bold text-red-300 hover:bg-red-500/10"
        >
          Fechar
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <InfoLei
          titulo="Referência legal"
          valor={legislacaoAberta.artigo || "Não informado"}
        />

        <InfoLei
          titulo="Situação operacional"
          valor={legislacaoAberta.situacao_operacional || "Não informado"}
        />

        <InfoLei
          titulo="Palavras-chave"
          valor={legislacaoAberta.palavras_chave || "Não informado"}
        />

        <InfoLei
          titulo="Categoria"
          valor={legislacaoAberta.categoria || "Não informado"}
        />
      </div>

      {legislacaoAberta.descricao && (
        <section className="mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-5">
          <h3 className="font-black text-[#C9A227]">Resumo</h3>
          <p className="mt-2 whitespace-pre-line text-slate-200">
            {legislacaoAberta.descricao}
          </p>
        </section>
      )}

      {legislacaoAberta.texto_lei && (
        <section className="mt-5 rounded-2xl border border-white/10 bg-slate-950 p-5">
          <h3 className="font-black text-[#C9A227]">
            Texto legal completo
          </h3>

          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-300">
            {legislacaoAberta.texto_lei}
          </p>
        </section>
      )}

      {legislacaoAberta.aplicacao_operacional && (
        <section className="mt-5 rounded-2xl border border-blue-500/30 bg-blue-950/30 p-5">
          <h3 className="font-black text-blue-300">
            Aplicação prática para a Guarda
          </h3>

          <p className="mt-3 whitespace-pre-line text-slate-100">
            {legislacaoAberta.aplicacao_operacional}
          </p>
        </section>
      )}

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            editarLegislacao(legislacaoAberta);
            setLegislacaoAberta(null);
          }}
          className="rounded-xl border border-yellow-500 px-4 py-2 font-bold text-yellow-400 hover:bg-yellow-500/10"
        >
          ✏️ Editar dossiê
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl border border-white/20 px-4 py-2 font-bold text-white hover:bg-white/10"
        >
          🖨️ Imprimir
        </button>
      </div>
    </div>
  </div>
)}

    </main>
  );
}

function FiltroRapido({
  texto,
  valor,
  setCategoriaFiltro,
}: {
  texto: string;
  valor: string;
  setCategoriaFiltro: (valor: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => setCategoriaFiltro(valor)}
      className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200 hover:border-[#C9A227] hover:bg-[#C9A227]/10"
    >
      {texto}
    </button>
  );
}

function InfoLei({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
        {titulo}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-200">
        {valor}
      </p>
    </div>
  );
}

function Resumo({
  titulo,
  valor,
  icone: Icone,
}: {
  titulo: string;
  valor: number;
  icone: any;
}) {
  return (
    <SigCard>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#C9A227]/30 bg-[#C9A227]/10 text-[#C9A227]">
          <Icone size={24} />
        </div>

        <div>
          <p className="text-sm text-slate-400">{titulo}</p>
          <h3 className="text-2xl font-black text-white">{valor}</h3>
        </div>
      </div>
    </SigCard>
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
  icone: any;
  titulo: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left font-black transition ${
        ativo
          ? "border-[#C9A227] bg-[#C9A227]/15 text-white"
          : "border-white/10 bg-white/5 text-slate-300 hover:border-[#C9A227]/60"
      }`}
    >
      <Icone className={ativo ? "text-[#C9A227]" : "text-slate-400"} />
      <p className="mt-2">{titulo}</p>
    </button>
  );
}