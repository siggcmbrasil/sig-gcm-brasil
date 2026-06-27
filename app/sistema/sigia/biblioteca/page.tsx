"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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
  titulo: string;
  descricao: string | null;
  categoria: string;
  arquivo_url: string | null;
  nome_arquivo: string | null;
  status: string;
  criado_em: string;
};

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
    const { data, error } = await supabase
      .from("sigia_documentos")
      .select("id, titulo, descricao, categoria, arquivo_url, nome_arquivo, status, criado_em")
      .order("criado_em", { ascending: false });

    if (!error && data) {
      setDocumentos(data);
    }
  }

  async function enviarDocumento() {
    if (!titulo || !arquivo) {
      alert("Informe o título e selecione um PDF.");
      return;
    }

    setCarregando(true);

    const nomeArquivoSeguro = arquivo.name
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-zA-Z0-9.-]/g, "_")
  .toLowerCase();

const nomeArquivo = `${Date.now()}-${nomeArquivoSeguro}`;

    const { data: upload, error: erroUpload } = await supabase.storage
      .from("sigia-documentos")
      .upload(nomeArquivo, arquivo);

    if (erroUpload) {
  console.error("Erro no upload:", erroUpload);
  alert(`Erro ao enviar PDF: ${erroUpload.message}`);
  setCarregando(false);
  return;
}

    const { data: documentoCriado, error: erroBanco } = await supabase
  .from("sigia_documentos")
  .insert({
    titulo,
    descricao,
    categoria,
    nome_arquivo: arquivo.name,
    arquivo_url: upload.path,
    tamanho_arquivo: arquivo.size,
    tipo_arquivo: "PDF",
    status: "PENDENTE",
  })
  .select("id")
  .single();

    if (erroBanco) {
      alert("PDF enviado, mas erro ao salvar no banco.");
      setCarregando(false);
      return;
    }

    setTitulo("");
    setDescricao("");
    setCategoria("Legislação");
    setArquivo(null);

    await carregarDocumentos();

    alert("Documento enviado com sucesso. Processamento ficará pendente.");
    setCarregando(false);
  }

async function excluirDocumento(doc: DocumentoSIGIA) {
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
    .eq("id", doc.id);

  if (error) {
    alert("Erro ao excluir documento.");
    setCarregando(false);
    return;
  }

  await carregarDocumentos();

  alert("Documento excluído com sucesso.");
  setCarregando(false);
}

const documentosFiltrados = documentos.filter((doc) => {
  const bateBusca =
    doc.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    doc.categoria.toLowerCase().includes(busca.toLowerCase()) ||
    doc.nome_arquivo?.toLowerCase().includes(busca.toLowerCase());

  const bateCategoria =
    filtroCategoria === "TODAS" || doc.categoria === filtroCategoria;

  return bateBusca && bateCategoria;
});

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              📚 Biblioteca Inteligente
            </h1>

            <p className="text-slate-400 mt-2">
              Central de documentos utilizada pela SIGIA.
            </p>
          </div>

          <Link
  href="/sistema/sigia/processamento"
  className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold px-4 py-2 rounded-xl"
>
  ⚙️ Processar PDFs
</Link>

          <Link
            href="/sistema/sigia"
            className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-xl"
          >
            ← Voltar
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          <div className="lg:col-span-1 rounded-2xl border border-slate-800 bg-slate-900 p-5">

            <h2 className="text-xl font-bold mb-5">
              Novo Documento
            </h2>

            <div className="space-y-4">

              <input
  placeholder="Título"
  value={titulo}
  onChange={(e) => setTitulo(e.target.value)}
  className="w-full rounded-lg bg-slate-800 p-3"
/>

              <textarea
  placeholder="Descrição"
  value={descricao}
  onChange={(e) => setDescricao(e.target.value)}
  className="w-full rounded-lg bg-slate-800 p-3 h-28"
/>

              <select
  value={categoria}
  onChange={(e) => setCategoria(e.target.value)}
  className="w-full rounded-lg bg-slate-800 p-3"
>
                {categorias.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>

              <input
  type="file"
  accept="application/pdf,.pdf"
  onChange={(e) => {
    const file = e.target.files?.[0] || null;
    console.log("Arquivo selecionado:", file);
    setArquivo(file);
  }}
  className="w-full rounded-lg bg-slate-800 p-3"
/>

              <button
  onClick={enviarDocumento}
  disabled={carregando}
  className="w-full rounded-xl bg-yellow-500 text-slate-900 font-bold py-3 hover:bg-yellow-400 disabled:opacity-50"
>
  {carregando ? "Enviando..." : "Enviar Documento"}
</button>

            </div>

          </div>

          <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900 p-5">

            <h2 className="text-xl font-bold mb-5">
              Documentos Cadastrados
            </h2>

            <div className="grid md:grid-cols-2 gap-3 mb-5">
  <input
    placeholder="Pesquisar documento..."
    value={busca}
    onChange={(e) => setBusca(e.target.value)}
    className="w-full rounded-lg bg-slate-800 p-3 text-sm"
  />

  <select
    value={filtroCategoria}
    onChange={(e) => setFiltroCategoria(e.target.value)}
    className="w-full rounded-lg bg-slate-800 p-3 text-sm"
  >
    <option value="TODAS">Todas as categorias</option>
    {categorias.map((c) => (
      <option key={c} value={c}>
        {c}
      </option>
    ))}
  </select>
</div>

            <div className="overflow-auto">

              <table className="w-full">

                <thead>

                  <tr className="text-left border-b border-slate-700">

                    <th className="py-3">Título</th>
                    <th>Categoria</th>
                    <th>Status</th>
                    <th>Data</th>
<th>Ações</th>

                  </tr>

                </thead>

                <tbody>
  {documentosFiltrados.length === 0 ? (
    <tr>
      <td className="py-4 text-slate-400">
        Nenhum documento encontrado.
      </td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
    </tr>
  ) : (
    documentosFiltrados.map((doc) => (
      <tr key={doc.id} className="border-b border-slate-800">
        <td className="py-4">{doc.titulo}</td>

        <td>{doc.categoria}</td>

        <td>
          <span className="rounded-full bg-green-900/60 px-3 py-1 text-xs text-green-300">
            {doc.status}
          </span>
        </td>

        <td className="text-slate-400 text-sm">
          {new Date(doc.criado_em).toLocaleDateString("pt-BR")}
        </td>

        <td className="flex gap-2 py-3">
          {doc.arquivo_url && (
            <button
              onClick={async () => {
                const { data, error } = await supabase.storage
                  .from("sigia-documentos")
                  .createSignedUrl(doc.arquivo_url!, 60);

                if (error || !data?.signedUrl) {
                  alert("Erro ao abrir PDF.");
                  return;
                }

                window.open(data.signedUrl, "_blank");
              }}
              className="rounded-lg bg-blue-700 px-3 py-1 text-xs hover:bg-blue-600"
            >
              Abrir
            </button>
          )}

          <button
            onClick={() => excluirDocumento(doc)}
            className="rounded-lg bg-red-700 px-3 py-1 text-xs hover:bg-red-600"
          >
            Excluir
          </button>
        </td>
      </tr>
    ))
  )}
</tbody>

              </table>

            </div>

          </div>

        </div>

      </div>
    </main>
  );
}