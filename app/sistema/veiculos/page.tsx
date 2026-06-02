"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Veiculo = {
  id: number;
  placa: string;
  modelo: string | null;
  cor: string | null;
  condutor: string | null;
  documento: string | null;
  local: string;
  data: string;
  hora: string;
  observacao: string | null;
};

export default function VeiculosAbordados() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);

  const [placa, setPlaca] = useState("");
  const [modelo, setModelo] = useState("");
  const [cor, setCor] = useState("");
  const [condutor, setCondutor] = useState("");
  const [documento, setDocumento] = useState("");
  const [local, setLocal] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [observacao, setObservacao] = useState("");

  const [carregando, setCarregando] = useState(true);

  async function carregarVeiculos() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("veiculos_abordados")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar veículos.");
      setCarregando(false);
      return;
    }

    setVeiculos(data || []);
    setCarregando(false);
  }

  async function salvarVeiculo() {
    if (!placa || !local || !data || !hora) {
      alert("Preencha placa, local, data e hora.");
      return;
    }

    const { error } = await supabase
      .from("veiculos_abordados")
      .insert([
        {
          placa,
          modelo,
          cor,
          condutor,
          documento,
          local,
          data,
          hora,
          observacao,
        },
      ]);

    if (error) {
      console.error(error);
      alert("Erro ao salvar abordagem.");
      return;
    }

    alert("Veículo registrado com sucesso!");

    setPlaca("");
    setModelo("");
    setCor("");
    setCondutor("");
    setDocumento("");
    setLocal("");
    setData("");
    setHora("");
    setObservacao("");

    carregarVeiculos();
  }

  async function excluirVeiculo(id: number) {
    const confirmar = confirm(
      "Deseja excluir este registro?"
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("veiculos_abordados")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao excluir.");
      return;
    }

    carregarVeiculos();
  }

  useEffect(() => {
    carregarVeiculos();
  }, []);

  return (
    <div className="p-6">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-3xl font-bold">
          Veículos Abordados
        </h1>

        <p className="text-slate-400">
          Registro de veículos fiscalizados pela GCM.
        </p>
      </header>

      <section className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-slate-400">
            Total de abordagens
          </p>

          <h2 className="text-4xl font-bold">
            {veiculos.length}
          </h2>
        </div>

        <div className="card">
          <p className="text-slate-400">
            Hoje
          </p>

          <h2 className="text-4xl font-bold">
            {
              veiculos.filter(
                (v) =>
                  v.data ===
                  new Date().toISOString().split("T")[0]
              ).length
            }
          </h2>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-4">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">
            Nova Abordagem
          </h2>

          <div className="space-y-4">
            <input
              className="input"
              placeholder="Placa"
              value={placa}
              onChange={(e) =>
                setPlaca(e.target.value.toUpperCase())
              }
            />

            <input
              className="input"
              placeholder="Modelo"
              value={modelo}
              onChange={(e) =>
                setModelo(e.target.value)
              }
            />

            <input
              className="input"
              placeholder="Cor"
              value={cor}
              onChange={(e) =>
                setCor(e.target.value)
              }
            />

            <input
              className="input"
              placeholder="Condutor"
              value={condutor}
              onChange={(e) =>
                setCondutor(e.target.value)
              }
            />

            <input
              className="input"
              placeholder="Documento"
              value={documento}
              onChange={(e) =>
                setDocumento(e.target.value)
              }
            />

            <input
              className="input"
              placeholder="Local"
              value={local}
              onChange={(e) =>
                setLocal(e.target.value)
              }
            />

            <input
              type="date"
              className="input"
              value={data}
              onChange={(e) =>
                setData(e.target.value)
              }
            />

            <input
              type="time"
              className="input"
              value={hora}
              onChange={(e) =>
                setHora(e.target.value)
              }
            />

            <textarea
              className="input h-28 resize-none"
              placeholder="Observação"
              value={observacao}
              onChange={(e) =>
                setObservacao(e.target.value)
              }
            />

            <button
              onClick={salvarVeiculo}
              className="btn-primary w-full"
            >
              Registrar Abordagem
            </button>
          </div>
        </div>

        <div className="card col-span-2">
          <h2 className="text-xl font-bold mb-4">
            Veículos Registrados
          </h2>

          {carregando ? (
            <p>Carregando...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700 text-slate-400">
                <tr>
                  <th className="text-left py-3">
                    Placa
                  </th>
                  <th className="text-left py-3">
                    Modelo
                  </th>
                  <th className="text-left py-3">
                    Condutor
                  </th>
                  <th className="text-left py-3">
                    Local
                  </th>
                  <th className="text-left py-3">
                    Data
                  </th>
                  <th className="text-right py-3">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {veiculos.map((veiculo) => (
                  <tr
                    key={veiculo.id}
                    className="border-b border-slate-800"
                  >
                    <td className="py-4 text-blue-400 font-semibold">
                      {veiculo.placa}
                    </td>

                    <td>{veiculo.modelo}</td>

                    <td>{veiculo.condutor}</td>

                    <td>{veiculo.local}</td>

                    <td>{veiculo.data}</td>

                    <td className="text-right">
                      <button
                        onClick={() =>
                          excluirVeiculo(veiculo.id)
                        }
                        className="bg-red-700 hover:bg-red-800 px-3 py-2 rounded text-xs"
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