"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
};

type Permuta = {
  id: number;
  data_original: string;
  data_troca: string;
  guarda_solicitante_id: number;
  guarda_substituto_id: number;
  motivo: string | null;
  status: string;
  criado_em: string;
};

export default function PermutasPage() {
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [permutas, setPermutas] = useState<Permuta[]>([]);

  const [dataOriginal, setDataOriginal] = useState("");
  const [dataTroca, setDataTroca] = useState("");
  const [guardaSolicitanteId, setGuardaSolicitanteId] = useState("");
  const [guardaSubstitutoId, setGuardaSubstitutoId] = useState("");
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    carregarGuardas();
    carregarPermutas();
  }, []);

  async function carregarGuardas() {
    const { data, error } = await supabase
      .from("guardas")
      .select("id, nome, matricula")
      .order("nome", { ascending: true });

    if (error) {
      alert("Erro ao carregar guardas.");
      console.error(error);
      return;
    }

    setGuardas(data || []);
  }

  async function carregarPermutas() {
    const { data, error } = await supabase
      .from("permutas_plantao")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      alert("Erro ao carregar permutas.");
      console.error(error);
      return;
    }

    setPermutas(data || []);
  }

  function nomeGuarda(id: number) {
    const guarda = guardas.find((item) => item.id === id);
    return guarda ? guarda.nome : `ID ${id}`;
  }

  function formatarData(data: string) {
    if (!data) return "-";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function corStatus(status: string) {
    if (status === "PENDENTE") return "bg-yellow-100 text-yellow-700";
    if (status === "ACEITA") return "bg-blue-100 text-blue-700";
    if (status === "APROVADA") return "bg-green-100 text-green-700";
    if (status === "NEGADA") return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-700";
  }

  async function salvarPermuta() {
    if (
      !dataOriginal ||
      !dataTroca ||
      !guardaSolicitanteId ||
      !guardaSubstitutoId
    ) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    if (guardaSolicitanteId === guardaSubstitutoId) {
      alert("O solicitante e o substituto não podem ser o mesmo guarda.");
      return;
    }

    const { error } = await supabase.from("permutas_plantao").insert([
      {
        data_original: dataOriginal,
        data_troca: dataTroca,
        guarda_solicitante_id: Number(guardaSolicitanteId),
        guarda_substituto_id: Number(guardaSubstitutoId),
        motivo,
        status: "PENDENTE",
      },
    ]);

    if (error) {
      alert("Erro ao salvar permuta.");
      console.error(error);
      return;
    }

    alert("Permuta cadastrada com sucesso!");

    setDataOriginal("");
    setDataTroca("");
    setGuardaSolicitanteId("");
    setGuardaSubstitutoId("");
    setMotivo("");

    carregarPermutas();
  }

  async function aceitarPermuta(id: number) {
    const { error } = await supabase
      .from("permutas_plantao")
      .update({
        status: "ACEITA",
      })
      .eq("id", id);

    if (error) {
      alert("Erro ao aceitar permuta.");
      console.error(error);
      return;
    }

    carregarPermutas();
  }

  async function aprovarPermuta(id: number) {
    const { error } = await supabase
      .from("permutas_plantao")
      .update({
        status: "APROVADA",
        aprovado_por: "ADMIN",
      })
      .eq("id", id);

    if (error) {
      alert("Erro ao aprovar permuta.");
      console.error(error);
      return;
    }

    carregarPermutas();
  }

  async function negarPermuta(id: number) {
    const { error } = await supabase
      .from("permutas_plantao")
      .update({
        status: "NEGADA",
        aprovado_por: "ADMIN",
      })
      .eq("id", id);

    if (error) {
      alert("Erro ao negar permuta.");
      console.error(error);
      return;
    }

    carregarPermutas();
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Permutas de Plantão</h1>

      <div className="bg-white rounded-xl shadow p-4 space-y-4 text-black">
        <h2 className="text-xl font-bold">Nova Permuta</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="date"
            value={dataOriginal}
            onChange={(e) => setDataOriginal(e.target.value)}
            className="border p-3 rounded"
          />

          <input
            type="date"
            value={dataTroca}
            onChange={(e) => setDataTroca(e.target.value)}
            className="border p-3 rounded"
          />

          <select
            value={guardaSolicitanteId}
            onChange={(e) => setGuardaSolicitanteId(e.target.value)}
            className="border p-3 rounded"
          >
            <option value="">Guarda solicitante</option>
            {guardas.map((guarda) => (
              <option key={guarda.id} value={guarda.id}>
                {guarda.nome}
              </option>
            ))}
          </select>

          <select
            value={guardaSubstitutoId}
            onChange={(e) => setGuardaSubstitutoId(e.target.value)}
            className="border p-3 rounded"
          >
            <option value="">Guarda substituto</option>
            {guardas.map((guarda) => (
              <option key={guarda.id} value={guarda.id}>
                {guarda.nome}
              </option>
            ))}
          </select>
        </div>

        <textarea
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo da permuta"
          className="border p-3 rounded w-full"
        />

        <button
          onClick={salvarPermuta}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-bold"
        >
          Salvar Permuta
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-4 text-black">
        <h2 className="text-xl font-bold mb-4">Permutas Cadastradas</h2>

        <div className="overflow-x-auto">
          <table className="w-full border">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-3 text-left border">Data Original</th>
                <th className="p-3 text-left border">Data Troca</th>
                <th className="p-3 text-left border">Solicitante</th>
                <th className="p-3 text-left border">Substituto</th>
                <th className="p-3 text-left border">Status</th>
                <th className="p-3 text-left border">Motivo</th>
              </tr>
            </thead>

            <tbody>
              {permutas.length === 0 ? (
                <tr>
                  <td className="p-3 border text-center" colSpan={6}>
                    Nenhuma permuta cadastrada.
                  </td>
                </tr>
              ) : (
                permutas.map((permuta) => (
                  <tr key={permuta.id}>
                    <td className="p-3 border">
                      {formatarData(permuta.data_original)}
                    </td>

                    <td className="p-3 border">
                      {formatarData(permuta.data_troca)}
                    </td>

                    <td className="p-3 border">
                      {nomeGuarda(permuta.guarda_solicitante_id)}
                    </td>

                    <td className="p-3 border">
                      {nomeGuarda(permuta.guarda_substituto_id)}
                    </td>

                    <td className="p-3 border">
                      <div className="flex flex-col gap-2">
                        <span
                          className={`${corStatus(
                            permuta.status
                          )} px-2 py-1 rounded text-center font-semibold`}
                        >
                          {permuta.status}
                        </span>

                        {permuta.status === "PENDENTE" && (
                          <button
                            onClick={() => aceitarPermuta(permuta.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                          >
                            Aceitar
                          </button>
                        )}

                        {permuta.status === "ACEITA" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => aprovarPermuta(permuta.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                            >
                              Aprovar
                            </button>

                            <button
                              onClick={() => negarPermuta(permuta.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                            >
                              Negar
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-3 border">{permuta.motivo || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}