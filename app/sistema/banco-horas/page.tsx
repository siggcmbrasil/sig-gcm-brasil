"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
};

type BancoHoras = {
  id: number;
  municipio_id: number;
  guarda_id: number;
  data_movimento: string;
  tipo: string;
  horas: number;
  motivo: string | null;
  observacao: string | null;
};

export default function BancoHorasPage() {
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [movimentos, setMovimentos] = useState<BancoHoras[]>([]);
  const [municipioId, setMunicipioId] = useState<number>(1);

  const [guardaId, setGuardaId] = useState("");
  const [dataMovimento, setDataMovimento] = useState("");
  const [tipo, setTipo] = useState("CREDITO");
  const [horas, setHoras] = useState("");
  const [motivo, setMotivo] = useState("");
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    carregarSistema();
  }, []);

  async function carregarSistema() {
    
   const usuarioLogado = JSON.parse(
  localStorage.getItem("usuarioLogado") || "{}"
);

const id = usuarioLogado.municipio_id;

if (!id) {
  alert("Município não identificado.");
  return;
}

    setMunicipioId(id);
    carregarGuardas(id);
    carregarMovimentos(id);
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

  async function carregarMovimentos(municipio: number) {
    const { data, error } = await supabase
      .from("banco_horas")
      .select("*")
      .eq("municipio_id", municipio)
      .order("data_movimento", { ascending: false });

    if (error) {
      alert("Erro ao carregar banco de horas.");
      console.error(error);
      return;
    }

    setMovimentos(data || []);
  }

  function nomeGuarda(id: number) {
    return guardas.find((g) => g.id === id)?.nome || `ID ${id}`;
  }

  function formatarData(data: string) {
    if (!data) return "-";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function saldoTotal() {
    return movimentos.reduce((total, item) => {
      const valor = Number(item.horas);
      return item.tipo === "CREDITO" ? total + valor : total - valor;
    }, 0);
  }

  async function salvarMovimento() {
    if (!guardaId || !dataMovimento || !horas || !motivo) {
      alert("Preencha guarda, data, horas e motivo.");
      return;
    }

    const { error } = await supabase.from("banco_horas").insert([
      {
        municipio_id: municipioId,
        guarda_id: Number(guardaId),
        data_movimento: dataMovimento,
        tipo,
        horas: Number(horas),
        motivo,
        observacao,
      },
    ]);

    if (error) {
      alert("Erro ao salvar lançamento.");
      console.error(error);
      return;
    }

    alert("Lançamento salvo com sucesso!");

    setGuardaId("");
    setDataMovimento("");
    setTipo("CREDITO");
    setHoras("");
    setMotivo("");
    setObservacao("");

    carregarMovimentos(municipioId);
  }

  async function excluirMovimento(id: number) {
    const confirmar = confirm("Deseja excluir este lançamento?");

    if (!confirmar) return;

   const { error } = await supabase
  .from("banco_horas")
  .delete()
  .eq("id", id)
  .eq("municipio_id", municipioId);

    if (error) {
      alert("Erro ao excluir lançamento.");
      console.error(error);
      return;
    }

    carregarMovimentos(municipioId);
  }

  function saldoCredito() {
  return movimentos
    .filter((m) => m.tipo === "CREDITO")
    .reduce((t, m) => t + Number(m.horas), 0);
}

function saldoDebito() {
  return movimentos
    .filter((m) => m.tipo === "DEBITO")
    .reduce((t, m) => t + Number(m.horas), 0);
}

  return (
    <div className="p-3 md:p-6 pb-24 space-y-6">
      <header className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl md:text-3xl font-bold">
          ⏱️ Banco de Horas
        </h1>
        <p className="text-slate-400">
          Controle manual de créditos, débitos e saldo de horas dos guardas.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card titulo="Lançamentos" valor={movimentos.length} />
        <Card titulo="Créditos" valor={`${saldoCredito().toFixed(2)}h`} />
<Card titulo="Débitos" valor={`${saldoDebito().toFixed(2)}h`} />
<Card titulo="Saldo Geral" valor={`${saldoTotal().toFixed(2)}h`} />
        <Card
          titulo="Guardas"
          valor={new Set(movimentos.map((m) => m.guarda_id)).size}
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Novo Lançamento</h2>

          <div className="space-y-4">
            <div>
              <label className="label">Guarda</label>
              <select
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white"
                value={guardaId}
                onChange={(e) => setGuardaId(e.target.value)}
              >
                <option value="">Selecione</option>
                {guardas.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome} • {g.matricula || "Sem matrícula"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Data</label>
              <input
                type="date"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white"
                value={dataMovimento}
                onChange={(e) => setDataMovimento(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Tipo</label>
              <select
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="CREDITO">Crédito de Horas</option>
                <option value="DEBITO">Débito / Compensação</option>
              </select>
            </div>

            <div>
              <label className="label">Horas</label>
              <input
                type="number"
                step="0.5"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white"
                value={horas}
                onChange={(e) => setHoras(e.target.value)}
                placeholder="Ex: 8"
              />
            </div>

            <div>
              <label className="label">Motivo</label>
              <select
  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white"
  value={motivo}
  onChange={(e) => setMotivo(e.target.value)}
>
  <option value="">Selecione</option>
  <option value="SERVICO_EXTRA">Serviço Extra</option>
  <option value="OPERACAO">Operação</option>
  <option value="EVENTO">Evento</option>
  <option value="COMPENSACAO">Compensação</option>
  <option value="FOLGA">Folga</option>
</select>
            </div>

            <div>
              <label className="label">Observação</label>
              <textarea
  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white min-h-24 resize-none"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={salvarMovimento}
              className="btn-primary w-full"
            >
              Salvar Lançamento
            </button>
          </div>
        </div>

        <div className="card xl:col-span-2">
          <h2 className="text-xl font-bold mb-4">Histórico</h2>

          {movimentos.length === 0 ? (
            <p className="text-slate-400">Nenhum lançamento encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700 text-slate-400">
                  <tr>
                    <th className="text-left py-3">Data</th>
                    <th className="text-left py-3">Guarda</th>
                    <th className="text-left py-3">Tipo</th>
                    <th className="text-left py-3">Horas</th>
                    <th className="text-left py-3">Motivo</th>
                    <th className="text-right py-3">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {movimentos.map((item) => (
                    <tr key={item.id} className="border-b border-slate-800">
                      <td className="py-4 text-blue-400 font-semibold">
                        {formatarData(item.data_movimento)}
                      </td>
                      <td>{nomeGuarda(item.guarda_id)}</td>
                      <td>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            item.tipo === "CREDITO"
                              ? "bg-green-900/40 text-green-400"
                              : "bg-red-900/40 text-red-400"
                          }`}
                        >
                          {item.tipo === "CREDITO" ? "+ Crédito" : "- Débito"}
                        </span>
                      </td>
                      <td className="font-bold">{Number(item.horas).toFixed(2)}h</td>
                      <td>{item.motivo || "-"}</td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => excluirMovimento(item.id)}
                          className="bg-red-700 hover:bg-red-800 px-3 py-2 rounded-lg text-xs"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number | string }) {
  return (
    <div className="card min-h-28 flex flex-col justify-center">
      <p className="text-slate-400">{titulo}</p>
      <h2 className="text-4xl font-bold">{valor}</h2>
    </div>
  );
}