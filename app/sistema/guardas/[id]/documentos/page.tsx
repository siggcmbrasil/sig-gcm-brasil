"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { podeVerModulo } from "@/lib/permissoesModulo";

export default function DocumentosGuardaPage() {
  const params = useParams();
  const id = params.id as string;

  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("RG");
  const [validade, setValidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [liberado, setLiberado] = useState(false);

  useEffect(() => {
  async function iniciar() {
    const dados = localStorage.getItem("usuarioLogado");

    if (!dados) {
      window.location.href = "/login";
      return;
    }

    const usuario = JSON.parse(dados);

    const permitido = await podeVerModulo(
      usuario.perfil,
      "documentos"
    );

    if (!permitido) {
      alert("Você não tem permissão para acessar documentos.");
      window.location.href = "/sistema";
      return;
    }

    setLiberado(true);
    carregarDocumentos();
  }

  iniciar();
}, []);

  async function carregarDocumentos() {
    const { data } = await supabase
      .from("documentos_guardas")
      .select("*")
      .eq("guarda_id", Number(id))
      .order("id", { ascending: false });

    setDocumentos(data || []);
  }

  async function salvarDocumento() {
    if (!titulo.trim()) {
      alert("Informe o título do documento.");
      return;
    }

    if (!arquivo) {
      alert("Selecione um arquivo.");
      return;
    }

    const nomeArquivo = `${id}/${Date.now()}-${arquivo.name}`;

    const { error: uploadError } = await supabase.storage
      .from("documentos-guardas")
      .upload(nomeArquivo, arquivo);

    if (uploadError) {
      console.error(uploadError);
      alert("Erro ao enviar arquivo.");
      return;
    }

    const { data } = supabase.storage
      .from("documentos-guardas")
      .getPublicUrl(nomeArquivo);

    const { error } = await supabase.from("documentos_guardas").insert({
      guarda_id: Number(id),
      titulo,
      tipo,
      validade: validade || null,
      observacao,
      arquivo_url: data.publicUrl,
    });

    if (error) {
      console.error(error);
      alert("Erro ao salvar documento.");
      return;
    }

    alert("Documento salvo.");

    setTitulo("");
    setTipo("RG");
    setValidade("");
    setObservacao("");
    setArquivo(null);

    carregarDocumentos();
  }

  async function excluirDocumento(doc: any) {
  const confirmar = confirm(
    `Excluir documento "${doc.titulo}"?`
  );

  if (!confirmar) return;

  const caminhoArquivo =
    doc.arquivo_url.split("/documentos-guardas/")[1];

  if (caminhoArquivo) {
    await supabase.storage
      .from("documentos-guardas")
      .remove([caminhoArquivo]);
  }

  const { error } = await supabase
    .from("documentos_guardas")
    .delete()
    .eq("id", doc.id);

  if (error) {
    alert("Erro ao excluir documento.");
    return;
  }

  carregarDocumentos();
}

if (!liberado) {
  return (
    <div className="p-10 text-white">
      Verificando permissão...
    </div>
  );
}

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-black mb-2">
        📄 Documentos do Guarda
      </h1>

      <p className="text-slate-400 mb-6">
        Guarda ID: {id}
      </p>

      <div className="painel-premium p-6">
        <h2 className="font-bold mb-4">Novo Documento</h2>

        <div className="grid gap-4">
          <input
            className="input"
            placeholder="Título do documento"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />

          <select
            className="input"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option>RG</option>
            <option>CPF</option>
            <option>CNH</option>
            <option>Portaria</option>
            <option>Certificado</option>
            <option>Outro</option>
          </select>

          <input
            type="date"
            className="input"
            value={validade}
            onChange={(e) => setValidade(e.target.value)}
          />

          <textarea
            className="input h-28"
            placeholder="Observação"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />

          <input
            type="file"
            className="input"
            accept="image/*,.pdf"
            onChange={(e) => setArquivo(e.target.files?.[0] || null)}
          />

          <button
            type="button"
            onClick={salvarDocumento}
            className="btn-primary"
          >
            Salvar Documento
          </button>
        </div>
      </div>

      <div className="mt-6 painel-premium p-6">
        <h2 className="text-xl font-bold mb-4">
          Documentos Cadastrados
        </h2>

        {documentos.length === 0 ? (
          <p className="text-slate-400">
            Nenhum documento cadastrado.
          </p>
        ) : (
          <div className="space-y-3">
            {documentos.map((doc) => (
              <div
                key={doc.id}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <h3 className="font-black text-lg">
  📄 {doc.titulo}
</h3>
                  <p className="text-sm text-blue-400">
  Tipo: {doc.tipo}
</p>

                  {doc.validade && (
  <p className="text-sm text-yellow-400">
    📅 Validade:{" "}
    {new Date(doc.validade).toLocaleDateString("pt-BR")}
  </p>
)}

                  {doc.observacao && (
                    <p className="text-sm text-slate-300">
                      📝 {doc.observacao}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
  <a
    href={doc.arquivo_url}
    target="_blank"
    rel="noopener noreferrer"
    className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-bold text-center"
  >
    📄 Abrir
  </a>

  <button
    onClick={() => excluirDocumento(doc)}
    className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg font-bold"
  >
    🗑️ Excluir
  </button>
</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}