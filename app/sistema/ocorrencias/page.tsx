"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Ocorrencia = {
  id: number;
  protocolo: string;
  tipo: string;
  local: string;
  bairro: string | null;
  data: string;
  status: string;
};

export default function Ocorrencias() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregarOcorrencias() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("ocorrencias")
      .select("id, protocolo, tipo, local, bairro, data, status")
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar ocorrências.");
      setCarregando(false);
      return;
    }

    setOcorrencias(data || []);
    setCarregando(false);
  }

  async function excluirOcorrencia(id: number) {
    const confirmar = confirm("Tem certeza que deseja excluir esta ocorrência?");

    if (!confirmar) return;

    const { error } = await supabase
      .from("ocorrencias")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erro ao excluir ocorrência.");
      return;
    }

    alert("Ocorrência excluída com sucesso.");
    carregarOcorrencias();
  }

  useEffect(() => {
    carregarOcorrencias();
  }, []);

  return (
    <div className="p-6">
      <header className="flex justify-between items-center border-b border-slate-800 pb-5 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Ocorrências</h1>
          <p className="text-slate-400">
            Registro e acompanhamento das ocorrências da GCM.
          </p>
        </div>

        <Link
          href="/sistema/ocorrencias/nova"
          className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold"
        >
          + Nova Ocorrência
        </Link>
      </header>

      <section className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-slate-400">Total</p>
          <h2 className="text-4xl font-bold">{ocorrencias.length}</h2>
        </div>

        <div className="card">
          <p className="text-slate-400">Abertas</p>
          <h2 className="text-4xl font-bold">
            {ocorrencias.filter((o) => o.status === "Aberta").length}
          </h2>
        </div>

        <div className="card">
          <p className="text-slate-400">Em andamento</p>
          <h2 className="text-4xl font-bold">
            {ocorrencias.filter((o) => o.status === "Em andamento").length}
          </h2>
        </div>

        <div className="card">
          <p className="text-slate-400">Finalizadas</p>
          <h2 className="text-4xl font-bold">
            {ocorrencias.filter((o) => o.status === "Finalizada").length}
          </h2>
        </div>
      </section>

      <section className="card">
        <h2 className="text-xl font-bold mb-4">
          Ocorrências cadastradas
        </h2>

        {carregando ? (
          <p className="text-slate-400">Carregando ocorrências...</p>
        ) : ocorrencias.length === 0 ? (
          <p className="text-slate-400">
            Nenhuma ocorrência cadastrada ainda.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-slate-400 border-b border-slate-700">
              <tr>
                <th className="text-left py-3">Protocolo</th>
                <th className="text-left py-3">Tipo</th>
                <th className="text-left py-3">Local</th>
                <th className="text-left py-3">Bairro</th>
                <th className="text-left py-3">Data</th>
                <th className="text-left py-3">Status</th>
                <th className="text-right py-3">Ações</th>
              </tr>
            </thead>

            <tbody>
              {ocorrencias.map((ocorrencia) => (
                <tr
                  key={ocorrencia.id}
                  className="border-b border-slate-800"
                >
                  <td className="py-4 text-blue-400 font-semibold">
                    {ocorrencia.protocolo}
                  </td>

                  <td>{ocorrencia.tipo}</td>

                  <td className="text-slate-400">
                    {ocorrencia.local}
                  </td>

                  <td className="text-slate-400">
                    {ocorrencia.bairro || "-"}
                  </td>

                  <td>{ocorrencia.data}</td>

                  <td>
                    <Status status={ocorrencia.status} />
                  </td>

                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/sistema/ocorrencias/${ocorrencia.id}`}
                        className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg text-xs"
                      >
                        Ver
                      </Link>

                      <Link
                        href={`/sistema/ocorrencias/${ocorrencia.id}/editar`}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg text-xs"
                      >
                        Editar
                      </Link>

                      <button
                        type="button"
                        onClick={() => excluirOcorrencia(ocorrencia.id)}
                        className="bg-red-700 hover:bg-red-800 text-white px-3 py-2 rounded-lg text-xs"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Status({ status }: { status: string }) {
  let cor = "bg-blue-700 text-blue-100";

  if (status === "Aberta") {
    cor = "bg-yellow-600 text-yellow-100";
  }

  if (status === "Em andamento") {
    cor = "bg-blue-700 text-blue-100";
  }

  if (status === "Finalizada") {
    cor = "bg-green-700 text-green-100";
  }

  return (
    <span className={`${cor} px-3 py-1 rounded text-xs`}>
      {status}
    </span>
  );
}