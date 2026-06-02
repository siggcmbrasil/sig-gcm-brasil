"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProtecaoPerfil from "@/components/ProtecaoPerfil";

type Ocorrencia = {
  id: number;
  protocolo: string;
  tipo: string;
  bairro: string | null;
  data: string;
  status: string;
};

type Chamado = {
  id: number;
  status: string;
  prioridade: string;
};

type Patrulhamento = {
  id: number;
  data: string;
};

type Pessoa = {
  id: number;
  data: string;
};

type Veiculo = {
  id: number;
  data: string;
};

export default function Relatorios() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [patrulhamentos, setPatrulhamentos] = useState<Patrulhamento[]>([]);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregarDados() {
    setCarregando(true);

    const { data: ocorrenciasData } = await supabase
      .from("ocorrencias")
      .select("id, protocolo, tipo, bairro, data, status")
      .order("id", { ascending: false });

    const { data: chamadosData } = await supabase
      .from("chamados")
      .select("id, status, prioridade");

    const { data: patrulhamentosData } = await supabase
      .from("patrulhamentos")
      .select("id, data");

    const { data: pessoasData } = await supabase
      .from("pessoas_abordadas")
      .select("id, data");

    const { data: veiculosData } = await supabase
      .from("veiculos_abordados")
      .select("id, data");

    setOcorrencias(ocorrenciasData || []);
    setChamados(chamadosData || []);
    setPatrulhamentos(patrulhamentosData || []);
    setPessoas(pessoasData || []);
    setVeiculos(veiculosData || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const hoje = new Date().toISOString().split("T")[0];
  const mesAtual = hoje.slice(0, 7);

  const ocorrenciasHoje = ocorrencias.filter((o) => o.data === hoje).length;
  const ocorrenciasMes = ocorrencias.filter((o) =>
    o.data?.startsWith(mesAtual)
  ).length;

  const chamadosAbertos = chamados.filter((c) => c.status === "Aberto").length;
  const chamadosUrgentes = chamados.filter(
    (c) => c.prioridade === "Urgente"
  ).length;

  const patrulhamentosHoje = patrulhamentos.filter(
    (p) => p.data === hoje
  ).length;

  const pessoasHoje = pessoas.filter((p) => p.data === hoje).length;
  const veiculosHoje = veiculos.filter((v) => v.data === hoje).length;

  const abertas = ocorrencias.filter((o) => o.status === "Aberta").length;
  const andamento = ocorrencias.filter(
    (o) => o.status === "Em andamento"
  ).length;
  const finalizadas = ocorrencias.filter(
    (o) => o.status === "Finalizada"
  ).length;

  const tiposMaisComuns = contarPorCampo(ocorrencias, "tipo");
  const bairrosMaisComuns = contarPorCampo(ocorrencias, "bairro");

  return (
  <ProtecaoPerfil perfisPermitidos={["ADMIN", "COMANDANTE"]}>
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Relatórios</h1>

        <p className="text-slate-400 text-sm md:text-base">
          Resumo operacional integrado da GCM Biritinga.
        </p>
      </header>

      {carregando ? (
        <p className="text-slate-400">Carregando relatórios...</p>
      ) : (
        <>
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card titulo="Ocorrências hoje" valor={ocorrenciasHoje} />
            <Card titulo="Ocorrências no mês" valor={ocorrenciasMes} />
            <Card titulo="Chamados abertos" valor={chamadosAbertos} />
            <Card titulo="Chamados urgentes" valor={chamadosUrgentes} />
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card titulo="Patrulhamentos hoje" valor={patrulhamentosHoje} />
            <Card titulo="Pessoas abordadas hoje" valor={pessoasHoje} />
            <Card titulo="Veículos abordados hoje" valor={veiculosHoje} />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
            <div className="card">
              <h2 className="text-xl md:text-2xl font-bold mb-4">
                Situação das Ocorrências
              </h2>

              <ResumoLinha nome="Abertas" valor={abertas} cor="text-yellow-400" />
              <ResumoLinha nome="Em andamento" valor={andamento} cor="text-blue-400" />
              <ResumoLinha nome="Finalizadas" valor={finalizadas} cor="text-green-400" />
              <ResumoLinha nome="Total" valor={ocorrencias.length} cor="text-white" />
            </div>

            <div className="card">
              <h2 className="text-xl md:text-2xl font-bold mb-4">
                Tipos mais registrados
              </h2>

              {tiposMaisComuns.length === 0 ? (
                <p className="text-slate-400">Sem dados.</p>
              ) : (
                <div className="space-y-3">
                  {tiposMaisComuns.slice(0, 6).map((item) => (
                    <ResumoLinha
                      key={item.nome}
                      nome={item.nome}
                      valor={item.valor}
                      cor="text-blue-400"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="text-xl md:text-2xl font-bold mb-4">
                Bairros com mais ocorrências
              </h2>

              {bairrosMaisComuns.length === 0 ? (
                <p className="text-slate-400">Sem dados.</p>
              ) : (
                <div className="space-y-3">
                  {bairrosMaisComuns.slice(0, 6).map((item) => (
                    <ResumoLinha
                      key={item.nome}
                      nome={item.nome}
                      valor={item.valor}
                      cor="text-purple-400"
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="card">
            <h2 className="text-xl md:text-2xl font-bold mb-4">
              Últimas ocorrências registradas
            </h2>

            {ocorrencias.length === 0 ? (
              <p className="text-slate-400">Nenhuma ocorrência cadastrada.</p>
            ) : (
              <>
                <div className="md:hidden space-y-4">
                  {ocorrencias.slice(0, 10).map((ocorrencia) => (
                    <div
                      key={ocorrencia.id}
                      className="bg-slate-950/40 border border-slate-700 rounded-xl p-4 space-y-2"
                    >
                      <p className="text-blue-400 font-semibold">
                        {ocorrencia.protocolo}
                      </p>

                      <h3 className="text-xl font-bold">
                        {ocorrencia.tipo}
                      </h3>

                      <p className="text-slate-400">
                        Bairro: {ocorrencia.bairro || "-"}
                      </p>

                      <p className="text-slate-400">
                        Data: {ocorrencia.data}
                      </p>

                      <Status status={ocorrencia.status} />
                    </div>
                  ))}
                </div>

                <div className="hidden md:block overflow-x-auto">
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
                      {ocorrencias.slice(0, 20).map((ocorrencia) => (
                        <tr
                          key={ocorrencia.id}
                          className="border-b border-slate-800"
                        >
                          <td className="py-4 text-blue-400 font-semibold">
                            {ocorrencia.protocolo}
                          </td>
                          <td>{ocorrencia.tipo}</td>
                          <td className="text-slate-400">
                            {ocorrencia.bairro || "-"}
                          </td>
                          <td>{ocorrencia.data}</td>
                          <td>
                            <Status status={ocorrencia.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </>
      )}
        </div>
  </ProtecaoPerfil>
);
}

function contarPorCampo<T extends Record<string, any>>(
  lista: T[],
  campo: keyof T
) {
  const contador: Record<string, number> = {};

  lista.forEach((item) => {
    const valor = String(item[campo] || "Não informado");

    contador[valor] = (contador[valor] || 0) + 1;
  });

  return Object.entries(contador)
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor);
}

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="card min-h-32 flex flex-col justify-center">
      <p className="text-slate-400 text-lg md:text-base">{titulo}</p>
      <h2 className="text-5xl md:text-4xl font-bold">{valor}</h2>
    </div>
  );
}

function ResumoLinha({
  nome,
  valor,
  cor,
}: {
  nome: string;
  valor: number;
  cor: string;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-800 pb-2">
      <span className="text-slate-300">{nome}</span>
      <span className={`font-bold ${cor}`}>{valor}</span>
    </div>
  );
}

function Status({ status }: { status: string }) {
  let cor = "bg-blue-700 text-blue-100";

  if (status === "Aberta") cor = "bg-yellow-600 text-yellow-100";
  if (status === "Em andamento") cor = "bg-blue-700 text-blue-100";
  if (status === "Finalizada") cor = "bg-green-700 text-green-100";

  return (
    <span className={`${cor} px-3 py-2 rounded text-xs inline-block`}>
      {status}
    </span>
  );
}