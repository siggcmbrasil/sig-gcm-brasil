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
  aprovado_por: string | null;
  data_aprovacao: string | null;
};

export default function PermutasPage() {
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [permutas, setPermutas] = useState<Permuta[]>([]);
  const [municipioId, setMunicipioId] = useState<number>(1);

  const [dataOriginal, setDataOriginal] = useState("");
  const [dataTroca, setDataTroca] = useState("");
  const [guardaSolicitanteId, setGuardaSolicitanteId] = useState("");
  const [guardaSubstitutoId, setGuardaSubstitutoId] = useState("");
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
  carregarSistema();
}, []);

async function carregarSistema() {
  const { data } = await supabase
    .from("configuracoes_sistema")
    .select("municipio_padrao_id")
    .limit(1)
    .single();

  const id = data?.municipio_padrao_id || 1;

  setMunicipioId(id);

  carregarGuardas(id);
  carregarPermutas(id);
}

async function carregarGuardas(municipio: number) {
  const { data, error } = await supabase
    .from("guardas")
    .select("id, nome, matricula")
    .eq("municipio_id", municipio)
    .order("nome", { ascending: true });

  if (error) {
    alert("Erro ao carregar guardas.");
    console.error(error);
    return;
  }

  setGuardas(data || []);
}

  async function carregarPermutas(municipio: number) {
    const { data, error } = await supabase
      .from("permutas_plantao")
      .select("*")
      .eq("municipio_id", municipio)
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
    municipio_id: municipioId,
    data_original: dataOriginal,
    data_troca: dataTroca,
    guarda_solicitante_id: Number(guardaSolicitanteId),
    guarda_substituto_id: Number(guardaSubstitutoId),
    motivo,
    status: "PENDENTE",
  },
]);

    if (error) {
  console.error("ERRO AO SALVAR PERMUTA:", error);
  alert(error.message);
  return;
}

    alert("Permuta cadastrada com sucesso!");

    setDataOriginal("");
    setDataTroca("");
    setGuardaSolicitanteId("");
    setGuardaSubstitutoId("");
    setMotivo("");

    carregarPermutas(municipioId);
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

    carregarPermutas(municipioId);
  }

  async function aprovarPermuta(id: number) {
    const usuario = JSON.parse(
  localStorage.getItem("usuarioLogado") || "{}"
);
    const { error } = await supabase
      .from("permutas_plantao")
      .update({
  status: "APROVADA",
  aprovado_por: usuario.nome || "ADMIN",
  data_aprovacao: new Date().toISOString(),
})
      .eq("id", id);

    if (error) {
      alert("Erro ao aprovar permuta.");
      console.error(error);
      return;
    }

    carregarPermutas(municipioId);
  }

  async function negarPermuta(id: number) {
    const usuario = JSON.parse(
  localStorage.getItem("usuarioLogado") || "{}"
);
    const { error } = await supabase
      .from("permutas_plantao")
      .update({
  status: "NEGADA",
  aprovado_por: usuario.nome || "ADMIN",
  data_aprovacao: new Date().toISOString(),
})
      .eq("id", id);

    if (error) {
      alert("Erro ao negar permuta.");
      console.error(error);
      return;
    }

    carregarPermutas(municipioId);
  }

async function excluirPermuta(id: number) {
  const confirmar = confirm("Deseja realmente excluir esta permuta?");

  if (!confirmar) return;

  const { error } = await supabase
    .from("permutas_plantao")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Erro ao excluir permuta.");
    console.error(error);
    return;
  }

  alert("Permuta excluída com sucesso!");

  carregarPermutas(municipioId);
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
<th className="p-3 text-left border">Aprovado por</th>
<th className="p-3 text-left border">Data Aprovação</th>
<th className="p-3 text-left border">Ações</th>
              </tr>
            </thead>

            <tbody>
              {permutas.length === 0 ? (
                <tr>
                  <td className="p-3 border text-center" colSpan={7}>
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

<td className="p-3 border">
  {permuta.aprovado_por || "-"}
</td>

<td className="p-3 border">
  {permuta.data_aprovacao
    ? new Date(permuta.data_aprovacao).toLocaleString("pt-BR")
    : "-"}
</td>

<td className="p-3 border">
  <button
    type="button"
    onClick={() => excluirPermuta(permuta.id)}
    className="bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded text-sm font-semibold"
  >
    Excluir
  </button>
</td>
                    <th className="p-3 text-left border">Ações</th>
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