"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Aviso = {
  id: number;
  titulo: string;
  descricao: string;
  criado_em: string;
};

export default function Configuracoes() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [carregando, setCarregando] = useState(true);

  async function carregarAvisos() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("avisos")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar avisos.");
      setCarregando(false);
      return;
    }

    setAvisos(data || []);
    setCarregando(false);
  }

  async function salvarAviso() {
    if (!titulo || !descricao) {
      alert("Preencha título e descrição.");
      return;
    }

    const { error } = await supabase.from("avisos").insert([
      {
        titulo,
        descricao,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Erro ao salvar aviso.");
      return;
    }

    alert("Aviso cadastrado com sucesso!");

    setTitulo("");
    setDescricao("");
    carregarAvisos();
  }

  async function excluirAviso(id: number) {
    const confirmar = confirm("Tem certeza que deseja excluir este aviso?");

    if (!confirmar) return;

    const { error } = await supabase
      .from("avisos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao excluir aviso.");
      return;
    }

    alert("Aviso excluído com sucesso.");
    carregarAvisos();
  }

  useEffect(() => {
    carregarAvisos();
  }, []);

  return (
    <div className="p-6">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-slate-400">
          Gerenciamento dos avisos operacionais do dashboard.
        </p>
      </header>

      <section className="grid grid-cols-3 gap-4">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Novo Aviso</h2>

          <div className="space-y-4">
            <div>
              <label className="label">Título</label>
              <input
                className="input"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Plantão Operacional"
              />
            </div>

            <div>
              <label className="label">Descrição</label>
              <textarea
                className="input h-32 resize-none"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o aviso..."
              />
            </div>

            <button
              type="button"
              onClick={salvarAviso}
              className="btn-primary w-full"
            >
              Salvar Aviso
            </button>
          </div>
        </div>

        <div className="card col-span-2">
          <h2 className="text-xl font-bold mb-4">Avisos Cadastrados</h2>

          {carregando ? (
            <p className="text-slate-400">Carregando avisos...</p>
          ) : avisos.length === 0 ? (
            <p className="text-slate-400">Nenhum aviso cadastrado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="text-left py-3">Título</th>
                  <th className="text-left py-3">Descrição</th>
                  <th className="text-right py-3">Ações</th>
                </tr>
              </thead>

              <tbody>
                {avisos.map((aviso) => (
                  <tr key={aviso.id} className="border-b border-slate-800">
                    <td className="py-4 text-blue-400 font-semibold">
                      {aviso.titulo}
                    </td>

                    <td className="text-slate-400">
                      {aviso.descricao}
                    </td>

                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => excluirAviso(aviso.id)}
                        className="bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-lg text-xs"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}