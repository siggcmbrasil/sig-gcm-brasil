"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Municipio = {
  id: number;
  nome: string;
  estado: string;
  brasao: string | null;
  cor_principal: string | null;
  ativo: boolean;
};

export default function MunicipiosPage() {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [nome, setNome] = useState("");
  const [estado, setEstado] = useState("BA");
  const [brasao, setBrasao] = useState("");
  const [corPrincipal, setCorPrincipal] = useState("#1e40af");

  useEffect(() => {
    carregarMunicipios();
  }, []);

  async function carregarMunicipios() {
    const { data } = await supabase
      .from("municipios")
      .select("*")
      .order("nome");

    setMunicipios(data || []);
  }

  async function salvarMunicipio() {
    if (!nome.trim()) {
      alert("Informe o nome do município.");
      return;
    }

    const { error } = await supabase.from("municipios").insert([
      {
        nome,
        estado,
        brasao,
        cor_principal: corPrincipal,
        ativo: true,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Erro ao cadastrar município.");
      return;
    }

    alert("Município cadastrado com sucesso!");

    setNome("");
    setEstado("BA");
    setBrasao("");
    setCorPrincipal("#1e40af");

    carregarMunicipios();
  }

  async function alternarStatus(municipio: Municipio) {
    const { error } = await supabase
      .from("municipios")
      .update({
        ativo: !municipio.ativo,
      })
      .eq("id", municipio.id);

    if (error) {
      console.error(error);
      alert("Erro ao atualizar município.");
      return;
    }

    carregarMunicipios();
  }

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-3xl font-bold">
          🏛️ Municípios
        </h1>

        <p className="text-slate-400">
          Cadastro de municípios atendidos pelo SIG-GCM Brasil.
        </p>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        <div className="card">
          <h2 className="text-xl font-bold mb-4">
            Novo Município
          </h2>

          <div className="space-y-4">

            <input
              className="input"
              placeholder="Nome do município"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />

            <input
              className="input"
              placeholder="Estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            />

            <input
              className="input"
              placeholder="Brasão (/imagem.png)"
              value={brasao}
              onChange={(e) => setBrasao(e.target.value)}
            />

            <input
              type="color"
              value={corPrincipal}
              onChange={(e) => setCorPrincipal(e.target.value)}
              className="w-full h-12 rounded"
            />

            <button
              onClick={salvarMunicipio}
              className="w-full bg-blue-700 hover:bg-blue-800 p-3 rounded-xl font-bold"
            >
              Salvar Município
            </button>

          </div>
        </div>

        <div className="card xl:col-span-2">
          <h2 className="text-xl font-bold mb-4">
            Municípios Cadastrados
          </h2>

          <div className="space-y-3">

            {municipios.map((municipio) => (
              <div
                key={municipio.id}
                className="bg-slate-900 border border-slate-700 rounded-xl p-4"
              >
                <div className="flex justify-between items-center">

                  <div>
                    <p className="font-bold text-lg">
                      {municipio.nome} - {municipio.estado}
                    </p>

                    <p className="text-slate-400 text-sm">
                      Cor principal: {municipio.cor_principal}
                    </p>
                  </div>

                  <button
                    onClick={() => alternarStatus(municipio)}
                    className={`px-4 py-2 rounded-lg font-semibold ${
                      municipio.ativo
                        ? "bg-green-700"
                        : "bg-red-700"
                    }`}
                  >
                    {municipio.ativo ? "Ativo" : "Inativo"}
                  </button>

                </div>
              </div>
            ))}

          </div>
        </div>

      </section>
    </div>
  );
}