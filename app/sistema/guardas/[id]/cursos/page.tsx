"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import ProtecaoModulo from "@/components/ProtecaoModulo";

export default function CursosGuardaPage() {
  const params = useParams();
  const id = params.id as string;

  const [curso, setCurso] = useState("");
  const [instituicao, setInstituicao] = useState("");
  const [cargaHoraria, setCargaHoraria] = useState("");
  const [dataConclusao, setDataConclusao] = useState("");
  const [observacao, setObservacao] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [cursos, setCursos] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  useEffect(() => {
    carregarCursos();
  }, []);

  async function carregarCursos() {
    if (!id) return;

    const { data } = await supabase
      .from("cursos_guardas")
      .select("*")
      .eq("guarda_id", Number(id))
      .order("id", { ascending: false });

    setCursos(data || []);
  }

  async function salvarCurso() {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    if (!curso.trim()) {
      alert("Informe o nome do curso.");
      return;
    }

    setSalvando(true);

    let certificadoUrl = "";

    if (arquivo) {
      const nomeArquivo = `${id}/${Date.now()}-${arquivo.name}`;

      const { error: uploadError } = await supabase.storage
        .from("documentos-guardas")
        .upload(nomeArquivo, arquivo);

      if (uploadError) {
        alert(uploadError.message || "Erro ao enviar certificado.");
        setSalvando(false);
        return;
      }

      const { data } = supabase.storage
        .from("documentos-guardas")
        .getPublicUrl(nomeArquivo);

      certificadoUrl = data.publicUrl;
    }

    const { error } = await supabase.from("cursos_guardas").insert({
      municipio_id: usuario.municipio_id,
      guarda_id: Number(id),
      curso: curso.trim(),
      instituicao: instituicao.trim() || null,
      carga_horaria: cargaHoraria ? Number(cargaHoraria) : null,
      data_conclusao: dataConclusao || null,
      certificado_url: certificadoUrl || null,
      observacao: observacao.trim() || null,
    });

    setSalvando(false);

    if (error) {
      alert("Erro ao salvar curso.");
      return;
    }

    await registrarAuditoria({
      modulo: "Dossiê do Guarda",
      acao: "CRIAR_CURSO",
      tabela: "cursos_guardas",
      descricao: `Registrou curso para o guarda ID ${id}.`,
      detalhes: {
        guarda_id: Number(id),
        curso: curso.trim(),
        instituicao: instituicao.trim() || null,
      },
    });

    setCurso("");
    setInstituicao("");
    setCargaHoraria("");
    setDataConclusao("");
    setObservacao("");
    setArquivo(null);

    carregarCursos();
  }

  async function excluirCurso(item: any) {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    if (!confirm(`Excluir curso "${item.curso}"?`)) return;

    if (item.certificado_url) {
      const caminho = item.certificado_url.split("/documentos-guardas/")[1];

      if (caminho) {
        await supabase.storage.from("documentos-guardas").remove([caminho]);
      }
    }

    const { error } = await supabase
      .from("cursos_guardas")
      .delete()
      .eq("id", item.id)
      .eq("guarda_id", Number(id));

    if (error) {
      alert("Erro ao excluir curso.");
      return;
    }

    await registrarAuditoria({
      modulo: "Dossiê do Guarda",
      acao: "EXCLUIR_CURSO",
      tabela: "cursos_guardas",
      descricao: `Excluiu curso do guarda ID ${id}.`,
      detalhes: {
        guarda_id: Number(id),
        curso_id: item.id,
        curso: item.curso,
      },
    });

    carregarCursos();
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <div className="p-6 text-white">
        <h1 className="text-3xl font-black mb-2">
          🎓 Cursos do Guarda
        </h1>

        <p className="text-slate-400 mb-6">Guarda ID: {id}</p>

        <div className="painel-premium p-6">
          <h2 className="font-bold mb-4">Novo Curso</h2>

          <div className="grid gap-4">
            <input
              className="input"
              placeholder="Nome do curso"
              value={curso}
              onChange={(e) => setCurso(e.target.value)}
            />

            <input
              className="input"
              placeholder="Instituição"
              value={instituicao}
              onChange={(e) => setInstituicao(e.target.value)}
            />

            <input
              className="input"
              type="number"
              placeholder="Carga horária"
              value={cargaHoraria}
              onChange={(e) => setCargaHoraria(e.target.value)}
            />

            <input
              className="input"
              type="date"
              value={dataConclusao}
              onChange={(e) => setDataConclusao(e.target.value)}
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
              onClick={salvarCurso}
              disabled={salvando}
              className="btn-primary disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Salvar Curso"}
            </button>
          </div>
        </div>

        <div className="mt-6 painel-premium p-6">
          <h2 className="text-xl font-bold mb-4">
            Cursos Cadastrados
          </h2>

          {cursos.length === 0 ? (
            <p className="text-slate-400">Nenhum curso cadastrado.</p>
          ) : (
            <div className="space-y-3">
              {cursos.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div>
                    <h3 className="font-black text-lg">🎓 {item.curso}</h3>

                    <p className="text-sm text-blue-400">
                      Instituição: {item.instituicao || "-"}
                    </p>

                    <p className="text-sm text-slate-400">
                      Carga horária: {item.carga_horaria || 0}h
                    </p>

                    {item.data_conclusao && (
                      <p className="text-sm text-yellow-400">
                        📅 Conclusão:{" "}
                        {new Date(item.data_conclusao).toLocaleDateString(
                          "pt-BR"
                        )}
                      </p>
                    )}

                    {item.observacao && (
                      <p className="text-sm text-slate-300">
                        📝 {item.observacao}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {item.certificado_url && (
                      <a
                        href={item.certificado_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-bold text-center"
                      >
                        📄 Certificado
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => excluirCurso(item)}
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
    </ProtecaoModulo>
  );
}