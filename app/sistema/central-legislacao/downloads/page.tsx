"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArrowLeft,
  Download,
  FileText,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Upload,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";

const BUCKET = "legislacao-downloads";

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
  auth_id?: string;
  perfil?: Perfil;
  municipio_id?: number;
};

type MaterialDownload = {
  id: number;
  municipio_id: number;
  titulo: string;
  descricao: string | null;
  categoria: string | null;
  tipo_arquivo: string | null;
  nome_arquivo: string | null;
  arquivo_path: string | null;
  arquivo_url: string | null;
  tamanho_bytes: number | null;
  ativo: boolean;
  criado_em: string;
};

type FormDownload = {
  titulo: string;
  descricao: string;
  categoria: string;
  tipo_arquivo: string;
  arquivo_url: string;
};

const FORM_INICIAL: FormDownload = {
  titulo: "",
  descricao: "",
  categoria: "CARTILHA",
  tipo_arquivo: "PDF",
  arquivo_url: "",
};

const CATEGORIAS = [
  "CARTILHA",
  "POP",
  "MODELO",
  "MANUAL",
  "LEGISLAÇÃO",
  "MATERIAL INSTITUCIONAL",
  "OUTRO",
];

const TIPOS = ["PDF", "DOCX", "XLSX", "PPTX", "ZIP", "LINK", "OUTRO"];

function podeGerenciar(perfil?: Perfil) {
  return ["DESENVOLVEDOR", "ADMIN", "COMANDANTE", "DIRETOR"].includes(
    perfil || ""
  );
}

function limparBuscaSupabase(valor: string) {
  return valor.trim().replace(/[,%()]/g, " ").replace(/\s+/g, " ");
}

function nomeSeguro(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function formatarTamanho(bytes: number | null) {
  if (!bytes || bytes <= 0) return "Tamanho não informado";

  const unidades = ["B", "KB", "MB", "GB"];
  const indice = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    unidades.length - 1
  );

  return `${(bytes / 1024 ** indice).toFixed(indice === 0 ? 0 : 1)} ${
    unidades[indice]
  }`;
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

export default function DownloadsLegislacaoPage() {
  const [usuario, setUsuario] = useState<UsuarioLocal>({});
  const [materiais, setMateriais] = useState<MaterialDownload[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("TODAS");
  const [tipo, setTipo] = useState("TODOS");
  const [situacao, setSituacao] = useState<"ATIVOS" | "INATIVOS" | "TODOS">(
    "ATIVOS"
  );

  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<MaterialDownload | null>(null);
  const [form, setForm] = useState<FormDownload>(FORM_INICIAL);
  const [arquivo, setArquivo] = useState<File | null>(null);

  async function carregarMateriais() {
    setCarregando(true);

    try {
      const contexto = await obterUsuario();
      setUsuario(contexto);

      if (!contexto.municipio_id) {
        throw new Error("Município não identificado.");
      }

      let consulta = supabase
        .from("legislacao_downloads")
        .select(
          "id,municipio_id,titulo,descricao,categoria,tipo_arquivo,nome_arquivo,arquivo_path,arquivo_url,tamanho_bytes,ativo,criado_em"
        )
        .eq("municipio_id", contexto.municipio_id);

      if (!podeGerenciar(contexto.perfil) || situacao === "ATIVOS") {
        consulta = consulta.eq("ativo", true);
      } else if (situacao === "INATIVOS") {
        consulta = consulta.eq("ativo", false);
      }

      if (categoria !== "TODAS") {
        consulta = consulta.eq("categoria", categoria);
      }

      if (tipo !== "TODOS") {
        consulta = consulta.eq("tipo_arquivo", tipo);
      }

      const termo = limparBuscaSupabase(busca);

      if (termo) {
        consulta = consulta.or(
          `titulo.ilike.%${termo}%,descricao.ilike.%${termo}%,nome_arquivo.ilike.%${termo}%`
        );
      }

      const { data, error } = await consulta.order("criado_em", {
        ascending: false,
      });

      if (error) throw error;

      setMateriais(data || []);

      await registrarAuditoria({
        modulo: "Central de Legislação",
        acao: "CONSULTAR",
        descricao: "Filtrou os materiais jurídicos.",
        tabela: "legislacao_downloads",
        detalhes: {
          municipio_id: contexto.municipio_id,
          busca,
          categoria,
          tipo,
          situacao,
          total: data?.length || 0,
        },
      });
    } catch (error: any) {
      console.error("Erro ao carregar downloads jurídicos:", error);
      alert(error?.message || "Erro ao carregar downloads.");
      setMateriais([]);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarMateriais();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function limparFiltros() {
    setBusca("");
    setCategoria("TODAS");
    setTipo("TODOS");
    setSituacao("ATIVOS");
  }

  function abrirNovoCadastro() {
    setEditando(null);
    setForm(FORM_INICIAL);
    setArquivo(null);
    setFormAberto(true);
  }

  function abrirEdicao(item: MaterialDownload) {
    setEditando(item);
    setForm({
      titulo: item.titulo,
      descricao: item.descricao || "",
      categoria: item.categoria || "CARTILHA",
      tipo_arquivo: item.tipo_arquivo || "PDF",
      arquivo_url: item.arquivo_url || "",
    });
    setArquivo(null);
    setFormAberto(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function fecharFormulario() {
    setEditando(null);
    setForm(FORM_INICIAL);
    setArquivo(null);
    setFormAberto(false);
  }

  function selecionarArquivo(event: ChangeEvent<HTMLInputElement>) {
    setArquivo(event.target.files?.[0] || null);
  }

  async function salvarMaterial(event: FormEvent) {
    event.preventDefault();

    if (!form.titulo.trim()) {
      alert("Informe o título do material.");
      return;
    }

    if (!editando && !arquivo && !form.arquivo_url.trim()) {
      alert("Selecione um arquivo ou informe um link externo.");
      return;
    }

    const contexto = await obterUsuario();

    if (!contexto.municipio_id || !podeGerenciar(contexto.perfil)) {
      alert("Você não possui permissão para gerenciar downloads.");
      return;
    }

    setSalvando(true);

    let novoPath: string | null = null;

    try {
      let arquivoPath = editando?.arquivo_path || null;
      let nomeArquivo = editando?.nome_arquivo || null;
      let tamanhoBytes = editando?.tamanho_bytes || null;

      if (arquivo) {
        novoPath = `${contexto.municipio_id}/${crypto.randomUUID()}-${nomeSeguro(
          arquivo.name
        )}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(novoPath, arquivo, {
            cacheControl: "3600",
            upsert: false,
            contentType: arquivo.type || undefined,
          });

        if (uploadError) throw uploadError;

        arquivoPath = novoPath;
        nomeArquivo = arquivo.name;
        tamanhoBytes = arquivo.size;
      }

      const payload = {
        municipio_id: contexto.municipio_id,
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || null,
        categoria: form.categoria,
        tipo_arquivo: form.tipo_arquivo,
        nome_arquivo: nomeArquivo,
        arquivo_path: arquivoPath,
        arquivo_url: form.arquivo_url.trim() || null,
        tamanho_bytes: tamanhoBytes,
        atualizado_por: contexto.auth_id || null,
      };

      if (editando) {
        const { error } = await supabase
          .from("legislacao_downloads")
          .update(payload)
          .eq("id", editando.id)
          .eq("municipio_id", contexto.municipio_id);

        if (error) throw error;

        if (
          novoPath &&
          editando.arquivo_path &&
          editando.arquivo_path !== novoPath
        ) {
          await supabase.storage
            .from(BUCKET)
            .remove([editando.arquivo_path]);
        }

        await registrarAuditoria({
          modulo: "Central de Legislação",
          acao: "EDITAR",
          descricao: `Editou o material jurídico: ${payload.titulo}.`,
          tabela: "legislacao_downloads",
          registro_id: editando.id,
          detalhes: payload,
        });
      } else {
        const { data, error } = await supabase
          .from("legislacao_downloads")
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
          descricao: `Cadastrou o material jurídico: ${payload.titulo}.`,
          tabela: "legislacao_downloads",
          registro_id: data.id,
          detalhes: {
            ...payload,
            arquivo_path: arquivoPath,
          },
        });
      }

      fecharFormulario();
      await carregarMateriais();
    } catch (error: any) {
      if (novoPath) {
        await supabase.storage.from(BUCKET).remove([novoPath]);
      }

      console.error("Erro ao salvar material jurídico:", error);
      alert(error?.message || "Erro ao salvar material.");
    } finally {
      setSalvando(false);
    }
  }

  async function alterarSituacao(item: MaterialDownload) {
    const contexto = await obterUsuario();

    if (!contexto.municipio_id || !podeGerenciar(contexto.perfil)) {
      alert("Você não possui permissão para alterar este material.");
      return;
    }

    const ativo = !item.ativo;
    const confirmar = window.confirm(
      ativo ? `Reativar "${item.titulo}"?` : `Arquivar "${item.titulo}"?`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("legislacao_downloads")
      .update({
        ativo,
        atualizado_por: contexto.auth_id || null,
      })
      .eq("id", item.id)
      .eq("municipio_id", contexto.municipio_id);

    if (error) {
      console.error("Erro ao alterar material:", error);
      alert("Erro ao alterar a situação.");
      return;
    }

    await registrarAuditoria({
      modulo: "Central de Legislação",
      acao: ativo ? "REATIVAR" : "ARQUIVAR",
      descricao: `${ativo ? "Reativou" : "Arquivou"} o material: ${
        item.titulo
      }.`,
      tabela: "legislacao_downloads",
      registro_id: item.id,
      detalhes: {
        municipio_id: contexto.municipio_id,
        ativo,
      },
    });

    await carregarMateriais();
  }

  async function baixarMaterial(item: MaterialDownload) {
    const contexto = await obterUsuario();

    if (!contexto.municipio_id || !contexto.auth_id) {
      alert("Usuário não identificado.");
      return;
    }

    let url = item.arquivo_url || "";

    if (item.arquivo_path) {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(item.arquivo_path, 300, {
          download: item.nome_arquivo || true,
        });

      if (error) {
        console.error("Erro ao gerar link do arquivo:", error);
        alert("Não foi possível preparar o download.");
        return;
      }

      url = data.signedUrl;
    }

    if (!url) {
      alert("Este material não possui arquivo ou link.");
      return;
    }

    const { error: historicoError } = await supabase
      .from("legislacao_download_historico")
      .insert({
        municipio_id: contexto.municipio_id,
        auth_user_id: contexto.auth_id,
        download_id: item.id,
      });

    if (historicoError) {
      console.error(
        "Erro ao registrar histórico de download:",
        historicoError
      );
    }

    await registrarAuditoria({
      modulo: "Central de Legislação",
      acao: "DOWNLOAD",
      descricao: `Baixou o material jurídico: ${item.titulo}.`,
      tabela: "legislacao_downloads",
      registro_id: item.id,
      detalhes: {
        municipio_id: contexto.municipio_id,
        titulo: item.titulo,
      },
    });

    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 pb-24 text-white md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-cyan-500/20 bg-slate-900/70 p-5 shadow-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-cyan-300">
                <Download size={30} />
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
                  Downloads Jurídicos
                </h1>

                <p className="mt-1 text-sm text-slate-400 md:text-base">
                  Cadastre arquivos, links, cartilhas, POPs e modelos.
                </p>
              </div>
            </div>

            {podeGerenciar(usuario.perfil) && (
              <button
                type="button"
                onClick={abrirNovoCadastro}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-black text-slate-950 hover:bg-amber-300"
              >
                <Plus size={19} />
                Novo material
              </button>
            )}
          </div>
        </header>

        {formAberto && podeGerenciar(usuario.perfil) && (
          <form
            onSubmit={salvarMaterial}
            className="rounded-3xl border border-amber-500/30 bg-slate-900/80 p-5"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black">
                  {editando ? "Editar material" : "Novo material"}
                </h2>
                <p className="text-sm text-slate-400">
                  Envie um arquivo privado ou informe um link externo.
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
                label="Link externo (opcional)"
                type="url"
                value={form.arquivo_url}
                onChange={(valor) =>
                  setForm({ ...form, arquivo_url: valor })
                }
                placeholder="https://..."
              />

              <Selecao
                label="Categoria"
                value={form.categoria}
                opcoes={CATEGORIAS}
                onChange={(valor) => setForm({ ...form, categoria: valor })}
              />

              <Selecao
                label="Tipo de arquivo"
                value={form.tipo_arquivo}
                opcoes={TIPOS}
                onChange={(valor) =>
                  setForm({ ...form, tipo_arquivo: valor })
                }
              />

              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-bold text-slate-300">
                  Arquivo
                </span>
                <span className="flex min-h-14 items-center gap-3 rounded-xl border border-dashed border-slate-600 bg-slate-950 px-4 py-3">
                  <Upload size={20} className="text-cyan-300" />
                  <input
                    type="file"
                    onChange={selecionarArquivo}
                    className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-500 file:px-4 file:py-2 file:font-black file:text-slate-950"
                  />
                </span>
                {editando?.nome_arquivo && !arquivo && (
                  <span className="mt-1 block text-xs text-slate-500">
                    Arquivo atual: {editando.nome_arquivo}
                  </span>
                )}
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-bold text-slate-300">
                  Descrição
                </span>
                <textarea
                  value={form.descricao}
                  onChange={(event) =>
                    setForm({ ...form, descricao: event.target.value })
                  }
                  rows={4}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={salvando}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-black text-slate-950 hover:bg-amber-300 disabled:opacity-50"
              >
                <Save size={18} />
                {salvando ? "Salvando..." : "Salvar material"}
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
              placeholder="Título, descrição ou arquivo..."
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
                opcoes={["ATIVOS", "INATIVOS", "TODOS"]}
                onChange={(valor) =>
                  setSituacao(valor as "ATIVOS" | "INATIVOS" | "TODOS")
                }
              />
            ) : (
              <div />
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void carregarMateriais()}
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
                window.setTimeout(() => void carregarMateriais(), 0);
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
            Materiais encontrados
          </p>
          <p className="mt-2 text-4xl font-black">{materiais.length}</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {carregando ? (
            <Mensagem texto="Carregando materiais..." />
          ) : materiais.length === 0 ? (
            <Mensagem
              titulo="Nenhum material encontrado"
              texto="Ajuste os filtros ou cadastre um novo material."
            />
          ) : (
            materiais.map((item) => (
              <article
                key={item.id}
                className={`flex min-h-72 flex-col rounded-3xl border bg-slate-900/60 p-5 ${
                  item.ativo
                    ? "border-slate-800 hover:border-cyan-500/30"
                    : "border-red-500/20 opacity-70"
                }`}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3 text-cyan-300">
                    <FileText size={26} />
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    {item.categoria && (
                      <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
                        {item.categoria}
                      </span>
                    )}

                    {!item.ativo && (
                      <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-black text-red-300">
                        ARQUIVADO
                      </span>
                    )}
                  </div>
                </div>

                <h2 className="text-xl font-black">{item.titulo}</h2>

                <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-400">
                  {item.descricao || "Material disponível para download."}
                </p>

                <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
                  <span>{item.tipo_arquivo || "ARQUIVO"}</span>
                  <span>{formatarTamanho(item.tamanho_bytes)}</span>
                  {item.nome_arquivo && <span>{item.nome_arquivo}</span>}
                </div>

                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  <button
                    type="button"
                    onClick={() => void baixarMaterial(item)}
                    disabled={!item.ativo}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 font-black text-slate-950 hover:bg-amber-300 disabled:opacity-40"
                  >
                    <Download size={18} />
                    Baixar
                  </button>

                  {podeGerenciar(usuario.perfil) && (
                    <>
                      <button
                        type="button"
                        onClick={() => abrirEdicao(item)}
                        className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-cyan-200 hover:bg-cyan-500/20"
                        aria-label={`Editar ${item.titulo}`}
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={() => void alterarSituacao(item)}
                        className={`rounded-xl border p-3 ${
                          item.ativo
                            ? "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                            : "border-green-500/30 bg-green-500/10 text-green-300 hover:bg-green-500/20"
                        }`}
                        aria-label={
                          item.ativo
                            ? `Arquivar ${item.titulo}`
                            : `Reativar ${item.titulo}`
                        }
                      >
                        {item.ativo ? (
                          <Archive size={18} />
                        ) : (
                          <RotateCcw size={18} />
                        )}
                      </button>
                    </>
                  )}
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
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-slate-300">
        {label}
      </span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
      />
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

function Mensagem({
  titulo,
  texto,
}: {
  titulo?: string;
  texto: string;
}) {
  return (
    <div className="col-span-full rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center">
      <FileText className="mx-auto mb-3 text-slate-600" size={38} />
      {titulo && <h2 className="text-lg font-bold">{titulo}</h2>}
      <p className="mt-1 text-sm text-slate-400">{texto}</p>
    </div>
  );
}
