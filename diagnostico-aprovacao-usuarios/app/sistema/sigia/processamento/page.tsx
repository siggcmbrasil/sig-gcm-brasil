"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Search,
  Send,
  Trash2,
  Upload,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import SigButton from "@/components/sig/SigButton";

const categorias = [
  "Legislação",
  "POP",
  "Manual",
  "Curso",
  "Apostila",
  "Jurisprudência",
  "Portaria",
  "Documento Interno",
  "Outro",
];

type DocumentoSIGIA = {
  id: string;
  municipio_id: number;
  titulo: string;
  descricao: string | null;
  categoria: string;
  arquivo_url: string | null;
  nome_arquivo: string | null;
  status: string;
  criado_em: string;
};

type UsuarioLogado = {
  id?: string;
  municipio_id?: number;
};

function pegarUsuario(): UsuarioLogado {
  try {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  } catch {
    return {};
  }
}

export default function BibliotecaSIGIA() {
  const [documentos, setDocumentos] = useState<DocumentoSIGIA[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("Legislação");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("TODAS");

  useEffect(() => {
    carregarDocumentos();
  }, []);

  async function carregarDocumentos() {
    const usuario = pegarUsuario();

    if (!usuario?.municipio_id) {
      alert("Município do usuário não identificado.");
      return;
    }

    const { data, error } = await supabase
      .from("sigia_documentos")
      .select(
        "id, municipio_id, titulo, descricao, categoria, arquivo_url, nome_arquivo, status, criado_em"
      )
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar documentos.");
      return;
    }

    setDocumentos((data || []) as DocumentoSIGIA[]);
  }

  async function enviarDocumento() {
    const usuario = pegarUsuario();

    if (!usuario?.municipio_id) {
      alert("Município do usuário não identificado.");
      return;
    }

    if (!titulo.trim()) {
      alert("Informe o título do documento.");
      return;
    }

    if (!arquivo) {
      alert("Selecione um PDF.");
      return;
    }

    if (arquivo.type !== "application/pdf") {
      alert("Envie apenas arquivo PDF.");
      return;
    }

    setCarregando(true);

    const nomeArquivoSeguro = arquivo.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .toLowerCase();

    const caminhoArquivo = `${usuario.municipio_id}/${Date.now()}-${nomeArquivoSeguro}`;

    const { data: upload, error: erroUpload } = await supabase.storage
      .from("sigia-documentos")
      .upload(caminhoArquivo, arquivo);

    if (erroUpload) {
      console.error(erroUpload);
      alert(`Erro ao enviar PDF: ${erroUpload.message}`);
      setCarregando(false);
      return;
    }

    const { error: erroBanco } = await supabase.from("sigia_documentos").insert({
      municipio_id: usuario.municipio_id,
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      categoria,
      nome_arquivo: arquivo.name,
      arquivo_url: upload.path,
      tamanho_arquivo: arquivo.size,
      tipo_arquivo: "PDF",
      status: "PENDENTE",
    });

    if (erroBanco) {
      console.error(erroBanco);

      await supabase.storage
        .from("sigia-documentos")
        .remove([upload.path]);

      alert("Erro ao salvar documento no banco.");
      setCarregando(false);
      return;
    }

    setTitulo("");
    setDescricao("");
    setCategoria("Legislação");
    setArquivo(null);

    await carregarDocumentos();

    alert("Documento enviado com sucesso. Processamento pendente.");
    setCarregando(false);
  }

  async function excluirDocumento(doc: DocumentoSIGIA) {
    const usuario = pegarUsuario();

    if (!usuario?.municipio_id) {
      alert("Município do usuário não identificado.");
      return;
    }

    const confirmar = confirm(`Deseja excluir o documento "${doc.titulo}"?`);
    if (!confirmar) return;

    setCarregando(true);

    if (doc.arquivo_url) {
      await supabase.storage
        .from("sigia-documentos")
        .remove([doc.arquivo_url]);
    }

    const { error } = await supabase
      .from("sigia_documentos")
      .delete()
      .eq("id", doc.id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      console.error(error);
      alert("Erro ao excluir documento.");
      setCarregando(false);
      return;
    }

    await carregarDocumentos();

    alert("Documento excluído com sucesso.");
    setCarregando(false);
  }

  async function abrirDocumento(doc: DocumentoSIGIA) {
    if (!doc.arquivo_url) {
      alert("Documento sem arquivo vinculado.");
      return;
    }

    const { data, error } = await supabase.storage
      .from("sigia-documentos")
      .createSignedUrl(doc.arquivo_url, 60);

    if (error || !data?.signedUrl) {
      alert("Erro ao abrir PDF.");
      return;
    }

    window.open(data.signedUrl, "_blank");
  }

  const documentosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    return documentos.filter((doc) => {
      const bateBusca =
        !termo ||
        doc.titulo.toLowerCase().includes(termo) ||
        doc.categoria.toLowerCase().includes(termo) ||
        doc.nome_arquivo?.toLowerCase().includes(termo);

      const bateCategoria =
        filtroCategoria === "TODAS" || doc.categoria === filtroCategoria;

      return bateBusca && bateCategoria;
    });
  }, [documentos, busca, filtroCategoria]);

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Biblioteca Inteligente"
        subtitulo="Central de documentos utilizados pela SIGIA para consulta, estudo e processamento inteligente."
        icone={BookOpen}
      />

      <div className="flex flex-wrap gap-3">
        <Link href="/sistema/sigia/processamento">
          <SigButton type="gold" icon={Send}>
            Processar PDFs
          </SigButton>
        </Link>

        <Link href="/sistema/sigia">
          <SigButton type="blue" icon={ArrowLeft}>
            Voltar para SIGIA
          </SigButton>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <SigCard>
          <h2 className="text-xl font-black text-white mb-2">
            Novo Documento
          </h2>

          <p className="text-slate-400 text-sm mb-5">
            Envie PDFs institucionais, legislações, POPs, manuais e apostilas.
          </p>

          <div className="space-y-4">
            <input
              placeholder="Título"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="input"
            />

            <textarea
              placeholder="Descrição"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="input min-h-[110px]"
            />

            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="input"
            >
              {categorias.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <label className="rounded-2xl border border-dashed border-cyan-500/30 bg-slate-950/70 p-5 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-900 transition">
              <Upload className="w-8 h-8 text-cyan-400 mb-2" />

              <span className="text-white font-bold">
                {arquivo ? arquivo.name : "Selecionar PDF"}
              </span>

              <span className="text-slate-500 text-xs mt-1">
                Apenas arquivos em formato PDF
              </span>

              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setArquivo(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>

            <SigButton
              type="gold"
              icon={Upload}
              onClick={enviarDocumento}
              disabled={carregando}
              className="w-full"
            >
              {carregando ? "Enviando..." : "Enviar Documento"}
            </SigButton>
          </div>
        </SigCard>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Resumo titulo="Documentos" valor={documentos.length} />
            <Resumo
              titulo="Pendentes"
              valor={documentos.filter((d) => d.status === "PENDENTE").length}
            />
            <Resumo
              titulo="Processados"
              valor={documentos.filter((d) => d.status === "PROCESSADO").length}
            />
          </div>

          <SigCard>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-black text-white">
                  Documentos Cadastrados
                </h2>

                <p className="text-slate-400 text-sm">
                  Lista de materiais disponíveis para processamento e consulta.
                </p>
              </div>

              <FileText className="w-9 h-9 text-cyan-400" />
            </div>

            <div className="grid md:grid-cols-2 gap-3 mb-5">
              <div className="relative">
                <Search className="w-5 h-5 text-slate-500 absolute left-3 top-3.5" />

                <input
                  placeholder="Pesquisar documento..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="input pl-10"
                />
              </div>

              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="input"
              >
                <option value="TODAS">Todas as categorias</option>
                {categorias.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {documentosFiltrados.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-10 text-center">
                <FileText className="w-14 h-14 text-slate-600 mx-auto mb-3" />

                <h3 className="text-white font-black text-lg">
                  Nenhum documento encontrado
                </h3>

                <p className="text-slate-400 text-sm mt-2">
                  Envie um PDF ou ajuste os filtros da pesquisa.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {documentosFiltrados.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div>
                        <h3 className="text-white font-black">
                          {doc.titulo}
                        </h3>

                        <p className="text-slate-400 text-sm mt-1">
                          {doc.categoria} •{" "}
                          {doc.nome_arquivo || "Arquivo não informado"}
                        </p>

                        {doc.descricao && (
                          <p className="text-slate-500 text-sm mt-1 line-clamp-2">
                            {doc.descricao}
                          </p>
                        )}

                        <p className="text-slate-500 text-xs mt-2">
                          Enviado em{" "}
                          {new Date(doc.criado_em).toLocaleDateString("pt-BR")}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-green-900/60 px-3 py-2 text-xs font-bold text-green-300">
                          {doc.status}
                        </span>

                        {doc.arquivo_url && (
                          <button
                            type="button"
                            onClick={() => abrirDocumento(doc)}
                            className="rounded-xl bg-blue-700 px-3 py-2 text-xs font-bold text-white hover:bg-blue-600"
                          >
                            Abrir
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => excluirDocumento(doc)}
                          className="rounded-xl bg-red-700 px-3 py-2 text-xs font-bold text-white hover:bg-red-600 inline-flex items-center gap-1"
                        >
                          <Trash2 size={14} />
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SigCard>
        </div>
      </div>
    </div>
  );
}

function Resumo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <SigCard>
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h2 className="text-4xl font-black text-white mt-2">
        {valor}
      </h2>
    </SigCard>
  );
}