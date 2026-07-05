"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import ProtecaoModulo from "@/components/ProtecaoModulo";

export default function AdvertenciasPage() {
  const { id } = useParams();

  const [autoridade, setAutoridade] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [advertencias, setAdvertencias] = useState<any[]>([]);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    if (!id) return;

    const { data, error } = await supabase
      .from("advertencias_guardas")
      .select("*")
      .eq("guarda_id", Number(id))
      .order("id", { ascending: false });

    if (error) {
      alert("Erro ao carregar advertências.");
      return;
    }

    setAdvertencias(data || []);
  }

  async function salvar() {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    if (!autoridade.trim() || !descricao.trim() || !data) {
      alert("Preencha autoridade, data e descrição.");
      return;
    }

    const { error } = await supabase.from("advertencias_guardas").insert({
      municipio_id: usuario.municipio_id,
      guarda_id: Number(id),
      autoridade: autoridade.trim(),
      descricao: descricao.trim(),
      data,
    });

    if (error) {
      alert("Erro ao salvar advertência.");
      return;
    }

    await registrarAuditoria({
      modulo: "Dossiê do Guarda",
      acao: "CRIAR_ADVERTENCIA",
      tabela: "advertencias_guardas",
      descricao: `Registrou advertência para o guarda ID ${id}.`,
      detalhes: {
        guarda_id: Number(id),
        autoridade: autoridade.trim(),
        data,
      },
    });

    setAutoridade("");
    setDescricao("");
    setData("");

    carregar();
  }

  async function excluir(itemId: number) {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    if (!confirm("Excluir esta advertência?")) return;

    const { error } = await supabase
      .from("advertencias_guardas")
      .delete()
      .eq("id", itemId)
      .eq("guarda_id", Number(id));

    if (error) {
      alert("Erro ao excluir advertência.");
      return;
    }

    await registrarAuditoria({
      modulo: "Dossiê do Guarda",
      acao: "EXCLUIR_ADVERTENCIA",
      tabela: "advertencias_guardas",
      descricao: `Excluiu advertência do guarda ID ${id}.`,
      detalhes: {
        guarda_id: Number(id),
        advertencia_id: itemId,
      },
    });

    carregar();
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <div className="p-6 text-white">
        <h1 className="text-3xl font-black mb-6">
          ⚠️ Advertências
        </h1>

        <div className="painel-premium p-6 mb-6">
          <div className="grid gap-4">
            <input
              className="input"
              placeholder="Autoridade"
              value={autoridade}
              onChange={(e) => setAutoridade(e.target.value)}
            />

            <input
              type="date"
              className="input"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />

            <textarea
              className="input h-28"
              placeholder="Descrição"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />

            <button onClick={salvar} className="btn-primary">
              Salvar Advertência
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {advertencias.length === 0 ? (
            <div className="painel-premium p-6 text-slate-400">
              Nenhuma advertência cadastrada.
            </div>
          ) : (
            advertencias.map((item) => (
              <div key={item.id} className="painel-premium p-4">
                <h3 className="font-black">
                  ⚠️ {item.autoridade}
                </h3>

                <p className="text-sm text-slate-400">
                  Data: {item.data || "-"}
                </p>

                <p className="mt-2 whitespace-pre-wrap">
                  {item.descricao}
                </p>

                <button
                  onClick={() => excluir(item.id)}
                  className="mt-3 bg-red-700 hover:bg-red-800 px-3 py-2 rounded-lg"
                >
                  Excluir
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </ProtecaoModulo>
  );
}