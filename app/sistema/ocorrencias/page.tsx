"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import CardIndicador from "@/components/CardIndicador";

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
  const [busca, setBusca] = useState("");
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

  const ocorrenciasFiltradas = ocorrencias.filter((o) => {
    const texto = `${o.protocolo} ${o.tipo} ${o.local} ${o.bairro || ""} ${o.status}`.toLowerCase();
    return texto.includes(busca.toLowerCase());
  });

  return (
  
  <div className="p-3 md:p-6 pb-24">

    <header className="mb-6">
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-5">

        <div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            Ocorrências
          </h1>

          <p className="text-slate-400 text-base md:text-lg mt-1">
            Registro e acompanhamento das ocorrências da GCM.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          ...
        </div>

      </div>
    </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
  <CardIndicador
    titulo="Total"
    valor={ocorrencias.length}
    icone="📋"
    cor="blue"
  />

  <CardIndicador
    titulo="Abertas"
    valor={ocorrencias.filter(o => o.status === "Aberta").length}
    icone="🚨"
    cor="yellow"
  />

  <CardIndicador
    titulo="Andamento"
    valor={ocorrencias.filter(o => o.status === "Em andamento").length}
    icone="🚔"
    cor="purple"
  />

  <CardIndicador
    titulo="Finalizadas"
    valor={ocorrencias.filter(o => o.status === "Finalizada").length}
    icone="✅"
    cor="green"
  />
</section>

      <section className="card mb-6">
        <label className="label">Buscar ocorrência</label>
        <input
          className="input"
          placeholder="Buscar por protocolo, tipo, local, bairro ou status..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </section>

      <section className="card">
        <h2 className="text-xl md:text-2xl font-bold mb-4">
          Ocorrências cadastradas
        </h2>

        {carregando ? (
          <p className="text-slate-400">Carregando ocorrências...</p>
        ) : ocorrenciasFiltradas.length === 0 ? (
          <p className="text-slate-400">Nenhuma ocorrência encontrada.</p>
        ) : (
          <>
            <div className="md:hidden space-y-4">
              {ocorrenciasFiltradas.map((ocorrencia) => (
                <div
                  key={ocorrencia.id}
                  className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-3"
                >
                  <div className="flex justify-between gap-3 items-start">
                    <div>
                      <p className="text-blue-400 font-semibold">
                        {ocorrencia.protocolo}
                      </p>

                      <h3 className="text-xl font-bold">
                        {ocorrencia.tipo}
                      </h3>
                    </div>

                    <Status status={ocorrencia.status} />
                  </div>

                  <div className="text-slate-300 space-y-1">
                    <p>
                      <span className="text-slate-500">Local: </span>
                      {ocorrencia.local}
                    </p>

                    <p>
                      <span className="text-slate-500">Bairro: </span>
                      {ocorrencia.bairro || "-"}
                    </p>

                    <p>
                      <span className="text-slate-500">Data: </span>
                      {ocorrencia.data}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 pt-2">
                    <Link
                      href={`/sistema/ocorrencias/${ocorrencia.id}`}
                      className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-3 rounded-xl text-center font-semibold"
                    >
                      Ver
                    </Link>

                    <Link
                      href={`/sistema/ocorrencias/${ocorrencia.id}/editar`}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-3 rounded-xl text-center font-semibold"
                    >
                      Editar
                    </Link>

                    <button
                      type="button"
                      onClick={() => excluirOcorrencia(ocorrencia.id)}
                      className="bg-red-700 hover:bg-red-800 text-white px-4 py-3 rounded-xl font-semibold"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block overflow-x-auto">
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
                  {ocorrenciasFiltradas.map((ocorrencia) => (
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
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="card min-h-32 flex flex-col justify-center">
      <p className="text-slate-400 text-lg md:text-base">{titulo}</p>
      <h2 className="text-5xl md:text-4xl font-bold">{valor}</h2>
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
    <span className={`${cor} px-3 py-2 rounded text-xs inline-block`}>
      {status}
    </span>
  );
}