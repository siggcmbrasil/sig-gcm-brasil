"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Ocorrencia = {
  id: number;
  protocolo: string;
  tipo: string;
  bairro: string | null;
  data: string;
  status: string;
};

export default function Relatorios() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregarDados() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("ocorrencias")
      .select("id, protocolo, tipo, bairro, data, status")
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar relatórios.");
      setCarregando(false);
      return;
    }

    setOcorrencias(data || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const abertas = ocorrencias.filter((o) => o.status === "Aberta").length;
  const andamento = ocorrencias.filter((o) => o.status === "Em andamento").length;
  const finalizadas = ocorrencias.filter((o) => o.status === "Finalizada").length;

  return (
    <div className="p-6">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <p className="text-slate-400">
          Resumo operacional das ocorrências da GCM Biritinga.
        </p>
      </header>

      <section className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-slate-400">Total de ocorrências</p>
          <h2 className="text-4xl font-bold">{ocorrencias.length}</h2>
        </div>

        <div className="card">
          <p className="text-slate-400">Abertas</p>
          <h2 className="text-4xl font-bold">{abertas}</h2>
        </div>

        <div className="card">
          <p className="text-slate-400">Em andamento</p>
          <h2 className="text-4xl font-bold">{andamento}</h2>
        </div>

        <div className="card">
          <p className="text-slate-400">Finalizadas</p>
          <h2 className="text-4xl font-bold">{finalizadas}</h2>
        </div>
      </section>

      <section className="card">
        <h2 className="text-xl font-bold mb-4">
          Últimas ocorrências registradas
        </h2>

        {carregando ? (
          <p className="text-slate-400">Carregando relatório...</p>
        ) : ocorrencias.length === 0 ? (
          <p className="text-slate-400">Nenhuma ocorrência cadastrada.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-slate-400 border-b border-slate-700">
              <tr>
                <th className="text-left py-3">Protocolo</th>
                <th className="text-left py-3">Tipo</th>
                <th className="text-left py-3">Bairro</th>
                <th className="text-left py-3">Data</th>
                <th className="text-left py-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {ocorrencias.map((ocorrencia) => (
                <tr key={ocorrencia.id} className="border-b border-slate-800">
                  <td className="py-4 text-blue-400 font-semibold">
                    {ocorrencia.protocolo}
                  </td>
                  <td>{ocorrencia.tipo}</td>
                  <td className="text-slate-400">
                    {ocorrencia.bairro || "-"}
                  </td>
                  <td>{ocorrencia.data}</td>
                  <td>{ocorrencia.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}