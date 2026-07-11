"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  Gavel,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

type Perfil =
  | "DESENVOLVEDOR"
  | "ADMIN"
  | "COMANDANTE"
  | "DIRETOR"
  | "CMT_GUARNICAO"
  | "PLANTONISTA"
  | "GUARDA"
  | "CONSULTA";

type UsuarioLocal = {
  id?: string;
  auth_id?: string;
  nome?: string;
  perfil?: Perfil;
  municipio_id?: number;
};

type Atualizacao = {
  id: number;
  municipio_id: number;
  titulo: string;
  resumo: string | null;
  categoria: string | null;
  tipo: string | null;
  fonte: string | null;
  url: string | null;
  data_publicacao: string | null;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
};

type FormAtualizacao = {
  titulo: string;
  resumo: string;
  categoria: string;
  tipo: string;
  fonte: string;
  url: string;
  data_publicacao: string;
};

const FORM_INICIAL: FormAtualizacao = {
  titulo: "",
  resumo: "",
  categoria: "GUARDA MUNICIPAL",
  tipo: "LEI",
  fonte: "",
  url: "",
  data_publicacao: new Date().toISOString().split("T")[0],
};

const CATEGORIAS = [
  "GUARDA MUNICIPAL",
  "CONSTITUCIONAL",
  "CTB",
  "PENAL",
  "PROCESSO PENAL",
  "ECA",
  "MARIA DA PENHA",
  "DROGAS",
  "AMBIENTAL",
  "MUNICIPAL",
  "ADMINISTRATIVO",
  "JURISPRUDÊNCIA",
  "OUTRO",
];

const TIPOS = [
  "LEI",
  "DECRETO",
  "PORTARIA",
  "RESOLUÇÃO",
  "SÚMULA",
  "JURISPRUDÊNCIA",
  "ALTERAÇÃO",
  "REVOGAÇÃO",
  "OUTRO",
];

function podeGerenciar(perfil?: Perfil) {
  return ["DESENVOLVEDOR", "ADMIN", "COMANDANTE", "DIRETOR"].includes(
    perfil || ""
  );
}

function limparBuscaSupabase(valor: string) {
  return valor.trim().replace(/[,%()]/g, " ").replace(/\s+/g, " ");
}

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

export default function AtualizacoesLegislacaoPage() {
  const [usuario, setUsuario] = useState<UsuarioLocal>({});
  const [atualizacoes, setAtualizacoes] = useState<Atualizacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("TODAS");
  const [tipo, setTipo] = useState("TODOS");
  const [situacao, setSituacao] = useState<"ATIVAS" | "INATIVAS" | "TODAS">(
    "ATIVAS"
  );
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");

  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<FormAtualizacao>(FORM_INICIAL);

  async function carregarAtualizacoes() {
    setCarregando(true);

    try {
      const contexto = await obterUsuario();
      setUsuario(contexto);

      if (!contexto.municipio_id) {
        throw new Error("Município não identificado.");
      }

      let consulta = supabase
        .from("legislacao_atualizacoes")
        .select(
          "id,municipio_id,titulo,resumo,categoria,tipo,fonte,url,data_publicacao,ativo,criado_em,atualizado_em"
        )
        .eq("municipio_id", contexto.municipio_id);

      if (!podeGerenciar(contexto.perfil) || situacao === "ATIVAS") {
        consulta = consulta.eq("ativo", true);
      } else if (situacao === "INATIVAS") {
        consulta = consulta.eq("ativo", false);
      }

      if (categoria !== "TODAS") {
        consulta = consulta.eq("categoria", categoria);
      }

      if (tipo !== "TODOS") {
        consulta = consulta.eq("tipo", tipo);
      }

      if (dataInicial) {
        consulta = consulta.gte("data_publicacao", dataInicial);
      }

      if (dataFinal) {
        consulta = consulta.lte("data_publicacao", dataFinal);
      }

      const termo = limparBuscaSupabase(busca);

      if (termo) {
        consulta = consulta.or(
          `titulo.ilike.%${termo}%,resumo.ilike.%${termo}%,fonte.ilike.%${termo}%`
        );
      }

      const { data, error } = await consulta
        .order("data_publicacao", {
          ascending: false,
          nullsFirst: false,
        })
        .order("criado_em", { ascending: false });

      if (error) throw error;

      setAtualizacoes(data || []);

      await registrarAuditoria({
        modulo: "Central de Legislação",
        acao: "CONSULTAR",
        descricao: "Filtrou as atualizações legislativas.",
        tabela: "legislacao_atualizacoes",
        detalhes: {
          municipio_id: contexto.municipio_id,
          busca,
          categoria,
          tipo,
          situacao,
          data_inicial: dataInicial || null,
          data_final: dataFinal || null,
          total: data?.length || 0,
        },
      });
    } catch (error: any) {
      console.error("Erro ao carregar atualizações legislativas:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
      });

      alert(error?.message || "Erro ao carregar atualizações.");
      setAtualizacoes([]);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarAtualizacoes();
    // A consulta inicial é executada apenas ao abrir a página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function limparFiltros() {
    setBusca("");
    setCategoria("TODAS");
    setTipo("TODOS");
    setSituacao("ATIVAS");
    setDataInicial("");
    setDataFinal("");
  }

  function abrirNovoCadastro() {
    setEditandoId(null);
    setForm(FORM_INICIAL);
    setFormAberto(true);
  }

  function abrirEdicao(item: Atualizacao) {
    setEditandoId(item.id);
    setForm({
      titulo: item.titulo,
      resumo: item.resumo || "",
      categoria: item.categoria || "GUARDA MUNICIPAL",
      tipo: item.tipo || "LEI",
      fonte: item.fonte || "",
      url: item.url || "",
      data_publicacao:
        item.data_publicacao || new Date().toISOString().split("T")[0],
    });
    setFormAberto(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function fecharFormulario() {
    setEditandoId(null);
    setForm(FORM_INICIAL);
    setFormAberto(false);
  }

  async function salvarAtualizacao(event: FormEvent) {
    event.preventDefault();

    if (!form.titulo.trim()) {
      alert("Informe o título da atualização.");
      return;
    }

    const contexto = await obterUsuario();

    if (!contexto.municipio_id || !podeGerenciar(contexto.perfil)) {
      alert("Você não possui permissão para gerenciar atualizações.");
      return;
    }

    setSalvando(true);

    try {
      const payload = {
        municipio_id: contexto.municipio_id,
        titulo: form.titulo.trim(),
        resumo: form.resumo.trim() || null,
        categoria: form.categoria,
        tipo: form.tipo,
        fonte: form.fonte.trim() || null,
        url: form.url.trim() || null,
        data_publicacao: form.data_publicacao || null,
        atualizado_por: contexto.auth_id || null,
      };

      if (editandoId) {
        const { error } = await supabase
          .from("legislacao_atualizacoes")
          .update(payload)
          .eq("id", editandoId)
          .eq("municipio_id", contexto.municipio_id);

        if (error) throw error;

        await registrarAuditoria({
          modulo: "Central de Legislação",
          acao: "EDITAR",
          descricao: `Editou a atualização legislativa: ${payload.titulo}.`,
          tabela: "legislacao_atualizacoes",
          registro_id: editandoId,
          detalhes: payload,
        });
      } else {
        const { data, error } = await supabase
          .from("legislacao_atualizacoes")
          .insert({
            ...payload,
            criado_por: contexto.auth_id || null,
          })
          .select("id")
          .single();

        if (error) throw error;

        await registrarAuditoria({
          modulo: "Central de Legislação",
          acao: "CADASTRAR",
          descricao: `Cadastrou a atualização legislativa: ${payload.titulo}.`,
          tabela: "legislacao_atualizacoes",
          registro_id: data.id,
          detalhes: payload,
        });
      }

      fecharFormulario();
      await carregarAtualizacoes();
    } catch (error: any) {
      console.error("Erro ao salvar atualização legislativa:", error);
      alert(error?.message || "Erro ao salvar atualização.");
    } finally {
      setSalvando(false);
    }
  }

  async function alterarSituacao(item: Atualizacao) {
    const contexto = await obterUsuario();

    if (!contexto.municipio_id || !podeGerenciar(contexto.perfil)) {
      alert("Você não possui permissão para alterar esta atualização.");
      return;
    }

    const novaSituacao = !item.ativo;
    const confirmar = window.confirm(
      novaSituacao
        ? `Reativar "${item.titulo}"?`
        : `Arquivar "${item.titulo}"?`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("legislacao_atualizacoes")
      .update({
        ativo: novaSituacao,
        atualizado_por: contexto.auth_id || null,
      })
      .eq("id", item.id)
      .eq("municipio_id", contexto.municipio_id);

    if (error) {
      console.error("Erro ao alterar atualização:", error);
      alert("Erro ao alterar a situação.");
      return;
    }

    await registrarAuditoria({
      modulo: "Central de Legislação",
      acao: novaSituacao ? "REATIVAR" : "ARQUIVAR",
      descricao: `${
        novaSituacao ? "Reativou" : "Arquivou"
      } a atualização legislativa: ${item.titulo}.`,
      tabela: "legislacao_atualizacoes",
      registro_id: item.id,
      detalhes: {
        municipio_id: contexto.municipio_id,
        ativo: novaSituacao,
      },
    });

    await carregarAtualizacoes();
  }

  async function abrirAtualizacao(item: Atualizacao) {
    const contexto = await obterUsuario();

    await registrarAuditoria({
      modulo: "Central de Legislação",
      acao: "VISUALIZAR",
      descricao: `Abriu a atualização legislativa: ${item.titulo}.`,
      tabela: "legislacao_atualizacoes",
      registro_id: item.id,
      detalhes: {
        municipio_id: contexto.municipio_id,
        titulo: item.titulo,
        url: item.url,
      },
    });

    if (item.url) {
      window.open(item.url, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 pb-24 text-white md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-cyan-500/20 bg-slate-900/70 p-5 shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-cyan-300">
                <RefreshCw size={30} />
              </div>

              <div>
                <Link
                  href="/sistema/central-legislacao"
                  className="mb-2 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
                >
                  <ArrowLeft size={16} />
                  Voltar à Central de Legislação
                </Link>

                <h1 className="text-2xl font-black md:text-4xl">
                  Atualizações Legislativas
                </h1>

                <p className="mt-1 text-sm text-slate-400 md:text-base">
                  Cadastre, filtre e acompanhe mudanças na legislação.
                </p>
              </div>
            </div>

            {podeGerenciar(usuario.perfil) && (
              <button
                type="button"
                onClick={abrirNovoCadastro}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-black text-slate-950 transition hover:bg-amber-300"
              >
                <Plus size={19} />
                Nova atualização
              </button>
            )}
          </div>
        </header>

        {formAberto && podeGerenciar(usuario.perfil) && (
          <form
            onSubmit={salvarAtualizacao}
            className="rounded-3xl border border-amber-500/30 bg-slate-900/80 p-5"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">
                  {editandoId ? "Editar atualização" : "Nova atualização"}
                </h2>
                <p className="text-sm text-slate-400">
                  Registre a alteração com fonte e data oficial.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharFormulario}
                className="rounded-xl border border-slate-700 p-2 text-slate-300 hover:bg-slate-800"
                aria-label="Fechar formulário"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Campo
                label="Título"
                value={form.titulo}
                onChange={(valor) => setForm({ ...form, titulo: valor })}
                required
              />

              <Campo
                label="Fonte oficial"
                value={form.fonte}
                onChange={(valor) => setForm({ ...form, fonte: valor })}
                placeholder="Planalto, STF, STJ, Diário Oficial..."
              />

              <Selecao
                label="Categoria"
                value={form.categoria}
                opcoes={CATEGORIAS}
                onChange={(valor) => setForm({ ...form, categoria: valor })}
              />

              <Selecao
                label="Tipo"
                value={form.tipo}
                opcoes={TIPOS}
                onChange={(valor) => setForm({ ...form, tipo: valor })}
              />

              <Campo
                label="Data de publicação"
                type="date"
                value={form.data_publicacao}
                onChange={(valor) =>
                  setForm({ ...form, data_publicacao: valor })
                }
              />

              <Campo
                label="Link oficial"
                type="url"
                value={form.url}
                onChange={(valor) => setForm({ ...form, url: valor })}
                placeholder="https://..."
              />

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-bold text-slate-300">
                  Resumo
                </label>
                <textarea
                  value={form.resumo}
                  onChange={(event) =>
                    setForm({ ...form, resumo: event.target.value })
                  }
                  rows={5}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400"
                  placeholder="Explique de forma objetiva o que mudou."
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={salvando}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-black text-slate-950 hover:bg-amber-300 disabled:opacity-50"
              >
                <Save size={18} />
                {salvando ? "Salvando..." : "Salvar atualização"}
              </button>

              <button
                type="button"
                onClick={fecharFormulario}
                className="rounded-xl border border-slate-700 px-5 py-3 font-bold text-slate-300 hover:bg-slate-800"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Campo
              label="Busca"
              value={busca}
              onChange={setBusca}
              placeholder="Título, resumo ou fonte..."
              icon={<Search size={18} />}
            />

            <Selecao
              label="Categoria"
              value={categoria}
              opcoes={["TODAS", ...CATEGORIAS]}
              onChange={setCategoria}
              rotuloTodas="Todas as categorias"
            />

            <Selecao
              label="Tipo"
              value={tipo}
              opcoes={["TODOS", ...TIPOS]}
              onChange={setTipo}
              rotuloTodas="Todos os tipos"
            />

            {podeGerenciar(usuario.perfil) ? (
              <Selecao
                label="Situação"
                value={situacao}
                opcoes={["ATIVAS", "INATIVAS", "TODAS"]}
                onChange={(valor) =>
                  setSituacao(valor as "ATIVAS" | "INATIVAS" | "TODAS")
                }
              />
            ) : (
              <div />
            )}

            <Campo
              label="Data inicial"
              type="date"
              value={dataInicial}
              onChange={setDataInicial}
            />

            <Campo
              label="Data final"
              type="date"
              value={dataFinal}
              onChange={setDataFinal}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void carregarAtualizacoes()}
              disabled={carregando}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-black text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
            >
              <Search size={18} />
              Aplicar filtros
            </button>

            <button
              type="button"
              onClick={() => {
                limparFiltros();
                window.setTimeout(() => void carregarAtualizacoes(), 0);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-5 py-3 font-bold text-slate-300 hover:bg-slate-800"
            >
              <RotateCcw size={18} />
              Limpar
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Indicador titulo="Resultados" valor={atualizacoes.length} />
          <Indicador
            titulo="Com link oficial"
            valor={atualizacoes.filter((item) => Boolean(item.url)).length}
          />
          <Indicador
            titulo="Jurisprudências"
            valor={
              atualizacoes.filter(
                (item) => item.categoria === "JURISPRUDÊNCIA"
              ).length
            }
          />
        </section>

        <section className="space-y-4">
          {carregando ? (
            <Mensagem texto="Carregando atualizações..." />
          ) : atualizacoes.length === 0 ? (
            <Mensagem
              titulo="Nenhuma atualização encontrada"
              texto="Ajuste os filtros ou cadastre uma nova atualização."
              icone={<Gavel className="text-slate-600" size={38} />}
            />
          ) : (
            atualizacoes.map((item) => (
              <article
                key={item.id}
                className={`rounded-3xl border bg-slate-900/60 p-5 transition ${
                  item.ativo
                    ? "border-slate-800 hover:border-cyan-500/30"
                    : "border-red-500/20 opacity-70"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap gap-2">
                      {item.categoria && <Etiqueta texto={item.categoria} />}
                      {item.tipo && (
                        <Etiqueta texto={item.tipo} amarelo />
                      )}
                      {!item.ativo && (
                        <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-black text-red-300">
                          ARQUIVADA
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-black">{item.titulo}</h2>

                    {item.resumo && (
                      <p className="mt-2 leading-6 text-slate-300">
                        {item.resumo}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
                      {item.data_publicacao && (
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays size={16} />
                          {new Date(
                            `${item.data_publicacao}T12:00:00`
                          ).toLocaleDateString("pt-BR")}
                        </span>
                      )}

                      {item.fonte && <span>Fonte: {item.fonte}</span>}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void abrirAtualizacao(item)}
                      disabled={!item.url}
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-3 font-black text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ExternalLink size={18} />
                      Abrir
                    </button>

                    {podeGerenciar(usuario.perfil) && (
                      <>
                        <button
                          type="button"
                          onClick={() => abrirEdicao(item)}
                          className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 font-bold text-cyan-200 hover:bg-cyan-500/20"
                        >
                          <Pencil size={18} />
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => void alterarSituacao(item)}
                          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 font-bold ${
                            item.ativo
                              ? "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                              : "border-green-500/30 bg-green-500/10 text-green-300 hover:bg-green-500/20"
                          }`}
                        >
                          {item.ativo ? (
                            <Archive size={18} />
                          ) : (
                            <RotateCcw size={18} />
                          )}
                          {item.ativo ? "Arquivar" : "Reativar"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  icon,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-slate-300">
        {label}
      </span>
      <span className="relative block">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          required={required}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pr-4 text-white outline-none focus:border-cyan-400 ${
            icon ? "pl-11" : "pl-4"
          }`}
        />
      </span>
    </label>
  );
}

function Selecao({
  label,
  value,
  opcoes,
  onChange,
  rotuloTodas,
}: {
  label: string;
  value: string;
  opcoes: string[];
  onChange: (valor: string) => void;
  rotuloTodas?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-slate-300">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
      >
        {opcoes.map((opcao) => (
          <option key={opcao} value={opcao}>
            {(opcao === "TODAS" || opcao === "TODOS") && rotuloTodas
              ? rotuloTodas
              : opcao}
          </option>
        ))}
      </select>
    </label>
  );
}

function Indicador({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <p className="text-sm font-semibold text-slate-400">{titulo}</p>
      <p className="mt-2 text-4xl font-black">{valor}</p>
    </div>
  );
}

function Etiqueta({
  texto,
  amarelo = false,
}: {
  texto: string;
  amarelo?: boolean;
}) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-bold ${
        amarelo
          ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
          : "border-cyan-500/20 bg-cyan-500/10 text-cyan-300"
      }`}
    >
      {texto}
    </span>
  );
}

function Mensagem({
  titulo,
  texto,
  icone,
}: {
  titulo?: string;
  texto: string;
  icone?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center">
      {icone && <div className="mb-3 flex justify-center">{icone}</div>}
      {titulo && <h2 className="text-lg font-bold">{titulo}</h2>}
      <p className="mt-1 text-sm text-slate-400">{texto}</p>
    </div>
  );
}
