"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import ProtecaoModulo from "@/components/ProtecaoModulo";

export default function HistoricoGuardaPage() {
  const { id } = useParams();

  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("Ingresso");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [registros, setRegistros] = useState<any[]>([]);

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    if (!id) return;

    const { data } = await supabase
      .from("historico_guardas")
      .select("*")
      .eq("guarda_id", Number(id))
      .order("data", { ascending: false });

    setRegistros(data || []);
  }

  async function salvar() {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    if (!titulo.trim() || !descricao.trim()) {
      alert("Preencha título e descrição.");
      return;
    }

    const { error } = await supabase.from("historico_guardas").insert({
      municipio_id: usuario.municipio_id,
      guarda_id: Number(id),
      titulo: titulo.trim(),
      tipo,
      descricao: descricao.trim(),
      data: data || null,
      criado_por: usuario.id,
    });

    if (error) {
      alert("Erro ao salvar histórico.");
      return;
    }

    await registrarAuditoria({
      modulo: "Dossiê do Guarda",
      acao: "CRIAR_HISTORICO",
      tabela: "historico_guardas",
      descricao: `Registrou histórico profissional para o guarda ID ${id}.`,
      detalhes: {
        guarda_id: Number(id),
        titulo: titulo.trim(),
        tipo,
        data: data || null,
      },
    });

    setTitulo("");
    setTipo("Ingresso");
    setDescricao("");
    setData("");

    carregar();
  }

  async function excluir(itemId: number) {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    if (!confirm("Excluir este registro?")) return;

    const { error } = await supabase
      .from("historico_guardas")
      .delete()
      .eq("id", itemId)
      .eq("guarda_id", Number(id));

    if (error) {
      alert("Erro ao excluir histórico.");
      return;
    }

    await registrarAuditoria({
      modulo: "Dossiê do Guarda",
      acao: "EXCLUIR_HISTORICO",
      tabela: "historico_guardas",
      descricao: `Excluiu histórico profissional do guarda ID ${id}.`,
      detalhes: {
        guarda_id: Number(id),
        historico_id: itemId,
      },
    });

    carregar();
  }

  return (
    <ProtecaoModulo modulo="guardas">
      <div className="p-6 text-white">
        <Link
          href={`/sistema/guardas/${id}`}
          className="text-blue-400 font-bold"
        >
          ← Voltar ao Dossiê
        </Link>

        <h1 className="text-3xl font-black mt-4 mb-2">
          🎖️ Histórico Profissional
        </h1>

        <p className="text-slate-400 mb-6">
          Registros funcionais do agente.
        </p>

        <div className="painel-premium p-6 mb-6">
          <h2 className="font-bold mb-4">Novo Registro</h2>

          <div className="grid gap-4">
            <input
              className="input"
              placeholder="Título"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />

            <select
              className="input"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option>Ingresso</option>
              <option>Promoção</option>
              <option>Mudança de função</option>
              <option>Designação</option>
              <option>Condecoração</option>
              <option>Reconhecimento</option>
              <option>Outro</option>
            </select>

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
              Salvar Histórico
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {registros.length === 0 ? (
            <div className="painel-premium p-6 text-slate-400">
              Nenhum registro histórico cadastrado.
            </div>
          ) : (
            registros.map((item) => (
              <div key={item.id} className="painel-premium p-4">
                <h3 className="font-black text-lg">🎖️ {item.titulo}</h3>

                <p className="text-blue-400 text-sm">
                  Tipo: {item.tipo}
                </p>

                {item.data && (
                  <p className="text-yellow-400 text-sm">
                    📅 {new Date(item.data).toLocaleDateString("pt-BR")}
                  </p>
                )}

                {item.descricao && (
                  <p className="text-slate-300 mt-2 whitespace-pre-wrap">
                    📝 {item.descricao}
                  </p>
                )}

                <button
                  onClick={() => excluir(item.id)}
                  className="mt-3 bg-red-700 hover:bg-red-800 px-3 py-2 rounded-lg"
                >
                  🗑️ Excluir
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </ProtecaoModulo>
  );
}