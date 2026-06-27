"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type DocumentoSIGIA = {
  id: string;
  titulo: string;
  categoria: string;
  status: string;
  criado_em: string;
};

export default function ProcessamentoSIGIA() {
  const [documentos, setDocumentos] = useState<DocumentoSIGIA[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    carregarDocumentos();
  }, []);

  async function carregarDocumentos() {
    const { data, error } = await supabase
      .from("sigia_documentos")
      .select("id, titulo, categoria, status, criado_em")
      .order("criado_em", { ascending: false });

    if (!error && data) {
      setDocumentos(data);
    }
  }

  async function processarDocumento(id: string) {
    setCarregando(true);

    const resposta = await fetch("/api/sigia/extrair-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ documento_id: id }),
    });

    const retorno = await resposta.json();

    if (!resposta.ok) {
      alert(`Erro ao processar: ${retorno.detalhe || retorno.erro}`);
      setCarregando(false);
      return;
    }

    await carregarDocumentos();

    alert("Documento processado com sucesso.");
    setCarregando(false);
  }

  const resumo = useMemo(() => {
    return {
      total: documentos.length,
      pendentes: documentos.filter((d) => d.status === "PENDENTE").length,
      ativos: documentos.filter((d) => d.status === "ATIVO").length,
      erros: documentos.filter((d) => d.status === "ERRO").length,
    };
  }, [documentos]);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              ⚙️ Processamento SIGIA
            </h1>
            <p className="text-slate-400 mt-2">
              Central para processar PDFs e transformar documentos em conhecimento.
            </p>
          </div>

          <Link
            href="/sistema/sigia/biblioteca"
            className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-xl"
          >
            ← Biblioteca
          </Link>
        </div>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card titulo="Documentos" valor={resumo.total} />
          <Card titulo="Pendentes" valor={resumo.pendentes} />
          <Card titulo="Ativos" valor={resumo.ativos} />
          <Card titulo="Erros" valor={resumo.erros} />
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-xl font-bold mb-5">
            Fila de Processamento
          </h2>

          <div className="overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-700">
                  <th className="py-3">Documento</th>
                  <th>Categoria</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
  {documentos.length === 0 ? (
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
    documentos.map((doc) => (
      <tr key={doc.id} className="border-b border-slate-800">
        <td className="py-4">{doc.titulo}</td>

        <td>{doc.categoria}</td>

        <td>
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-green-300">
            {doc.status}
          </span>
        </td>

        <td className="text-slate-400 text-sm">
          {new Date(doc.criado_em).toLocaleDateString("pt-BR")}
        </td>

        <td>
          {doc.status === "PENDENTE" ? (
            <button
  onClick={() => processarDocumento(doc.id)}
  disabled={carregando}
  className="
    min-w-[120px]
    rounded-xl
    bg-yellow-500
    hover:bg-yellow-400
    px-5
    py-2
    text-sm
    font-semibold
    text-slate-900
    transition-all
    duration-200
    disabled:opacity-50
    disabled:cursor-not-allowed
  "
>
  ⚙️ Processar
</button>
          ) : (
            <span className="inline-flex items-center rounded-xl bg-green-900/40 px-4 py-2 text-sm font-semibold text-green-300">
  ✅ Processado
</span>
          )}
        </td>
      </tr>
    ))
  )}
</tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{titulo}</p>
      <strong className="text-3xl text-yellow-400">{valor}</strong>
    </div>
  );
}