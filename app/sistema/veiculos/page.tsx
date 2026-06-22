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
  const [busca, setBusca] = useState("");

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
  const usuarioLogado =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
    : {};

const perfilUsuario = usuarioLogado?.perfil || "CONSULTA";

const podeEditar = perfilUsuario !== "CONSULTA";

  async function carregarVeiculos() {
    setCarregando(true);

    const { data, error } = await supabase
  .from("veiculos_abordados")
  .select("*")
  .eq("municipio_id", usuarioLogado.municipio_id)
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
  if (!podeEditar) {
    alert("Você não possui permissão para registrar veículos.");
    return;
  }
    if (!placa || !local || !data || !hora) {
      alert("Preencha placa, local, data e hora.");
      return;
    }

    const { error } = await supabase.from("veiculos_abordados").insert([
      {
        municipio_id: usuarioLogado.municipio_id,
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
    if (!podeEditar) {
      alert("Você não possui permissão para excluir veículos.");
      return;
    }

    const confirmar = confirm("Deseja excluir este registro?");

    if (!confirmar) return;

    const { error } = await supabase
  .from("veiculos_abordados")
  .delete()
  .eq("id", id)
  .eq("municipio_id", usuarioLogado.municipio_id);

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

  const hoje = new Date().toISOString().split("T")[0];

  const veiculosFiltrados = veiculos.filter((veiculo) => {
    const texto = `
      ${veiculo.placa}
      ${veiculo.modelo || ""}
      ${veiculo.cor || ""}
      ${veiculo.condutor || ""}
      ${veiculo.documento || ""}
      ${veiculo.local}
      ${veiculo.data}
      ${veiculo.hora}
      ${veiculo.observacao || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">
          Veículos Abordados
        </h1>

        <p className="text-slate-400 text-sm md:text-base">
          Registro de veículos fiscalizados pela Guarda Municipal.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card titulo="Total" valor={veiculos.length} />

        <Card
          titulo="Hoje"
          valor={veiculos.filter((v) => v.data === hoje).length}
        />

        <Card
          titulo="Com condutor"
          valor={veiculos.filter((v) => v.condutor).length}
        />

        <Card
          titulo="Sem condutor"
          valor={veiculos.filter((v) => !v.condutor).length}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {podeEditar && (
  <div className="card">
    <h2 className="text-xl md:text-2xl font-bold mb-4">
      Nova Abordagem
    </h2>

          <div className="space-y-4">
            <Campo
              label="Placa"
              valor={placa}
              setValor={(valor) => setPlaca(valor.toUpperCase())}
              placeholder="ABC1D23"
            />

            <Campo
              label="Modelo"
              valor={modelo}
              setValor={setModelo}
              placeholder="Ex: Gol, Uno, Duster"
            />

            <Campo
              label="Cor"
              valor={cor}
              setValor={setCor}
              placeholder="Ex: Branco"
            />

            <Campo
              label="Condutor"
              valor={condutor}
              setValor={setCondutor}
              placeholder="Nome do condutor"
            />

            <Campo
              label="Documento do condutor"
              valor={documento}
              setValor={setDocumento}
              placeholder="CPF, RG ou CNH"
            />

            <Campo
              label="Local da abordagem"
              valor={local}
              setValor={setLocal}
              placeholder="Ex: Praça Principal"
            />

            <div>
              <label className="label">Data</label>
              <input
                type="date"
                className="input"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Hora</label>
              <input
                type="time"
                className="input"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Observação</label>
              <textarea
                className="input h-32 resize-none"
                placeholder="Observações da abordagem"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={salvarVeiculo}
              className="btn-primary w-full text-lg"
            >
              Registrar Veículo
            </button>
          </div>
          </div>
)}

        <div className="card xl:col-span-2">
          <h2 className="text-xl md:text-2xl font-bold mb-4">
            Veículos Registrados
          </h2>

          <div className="mb-5">
            <label className="label">Buscar veículo</label>
            <input
              className="input"
              placeholder="Buscar por placa, modelo, condutor, local..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          {carregando ? (
            <p className="text-slate-400">Carregando veículos...</p>
          ) : veiculosFiltrados.length === 0 ? (
            <p className="text-slate-400">Nenhum veículo encontrado.</p>
          ) : (
            <>
              <div className="md:hidden space-y-4">
                {veiculosFiltrados.map((veiculo) => (
                  <div
                    key={veiculo.id}
                    className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-3"
                  >
                    <div>
                      <p className="text-blue-400 font-semibold">
                        {veiculo.placa}
                      </p>

                      <h3 className="text-xl font-bold">
                        {veiculo.modelo || "Modelo não informado"}
                      </h3>
                    </div>

                    <div className="text-slate-300 space-y-1">
                      <p>
                        <span className="text-slate-500">Cor: </span>
                        {veiculo.cor || "-"}
                      </p>

                      <p>
                        <span className="text-slate-500">Condutor: </span>
                        {veiculo.condutor || "-"}
                      </p>

                      <p>
                        <span className="text-slate-500">Documento: </span>
                        {veiculo.documento || "-"}
                      </p>

                      <p>
                        <span className="text-slate-500">Local: </span>
                        {veiculo.local}
                      </p>

                      <p>
                        <span className="text-slate-500">Data/Hora: </span>
                        {veiculo.data} às {veiculo.hora}
                      </p>

                      {veiculo.observacao && (
                        <p className="pt-2 text-slate-400">
                          {veiculo.observacao}
                        </p>
                      )}
                    </div>

                    {podeEditar && (
  <button
    type="button"
    onClick={() => excluirVeiculo(veiculo.id)}
    className="w-full bg-red-700 hover:bg-red-800 text-white px-4 py-3 rounded-xl font-semibold"
  >
    Excluir
  </button>
)}
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-700 text-slate-400">
                    <tr>
                      <th className="text-left py-3">Placa</th>
                      <th className="text-left py-3">Modelo</th>
                      <th className="text-left py-3">Cor</th>
                      <th className="text-left py-3">Condutor</th>
                      <th className="text-left py-3">Local</th>
                      <th className="text-left py-3">Data</th>
                      <th className="text-right py-3">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {veiculosFiltrados.map((veiculo) => (
                      <tr key={veiculo.id} className="border-b border-slate-800">
                        <td className="py-4 text-blue-400 font-semibold">
                          {veiculo.placa}
                        </td>

                        <td>{veiculo.modelo || "-"}</td>

                        <td className="text-slate-400">
                          {veiculo.cor || "-"}
                        </td>

                        <td>{veiculo.condutor || "-"}</td>

                        <td className="text-slate-400">
                          {veiculo.local}
                        </td>

                        <td>{veiculo.data}</td>

                        <td className="text-right">
                          {podeEditar && (
  <button
    type="button"
    onClick={() => excluirVeiculo(veiculo.id)}
    className="bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-lg text-xs"
  >
    Excluir
  </button>
)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function Campo({
  label,
  valor,
  setValor,
  placeholder,
}: {
  label: string;
  valor: string;
  setValor: (valor: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>

      <input
        className="input"
        placeholder={placeholder}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />
    </div>
  );
}

function Card({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="card min-h-32 flex flex-col justify-center">
      <p className="text-slate-400 text-lg md:text-base">
        {titulo}
      </p>

      <h2 className="text-5xl md:text-4xl font-bold">
        {valor}
      </h2>
    </div>
  );
}