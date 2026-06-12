"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import ProtecaoPerfil from "@/components/ProtecaoPerfil";

type Ocorrencia = {
  id: number;
  data: string;
  status: string;
  tipo: string;
};

type Patrulhamento = {
  id: number;
  data: string;
};

type Guarda = {
  id: number;
  status: string;
};

export default function Estatisticas() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [patrulhamentos, setPatrulhamentos] = useState<Patrulhamento[]>([]);
  const [guardas, setGuardas] = useState<Guarda[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);

    const { data: ocorrenciasData } = await supabase
      .from("ocorrencias")
      .select("id, data, status, tipo");

    const { data: patrulhamentosData } = await supabase
      .from("patrulhamentos")
      .select("id, data");

    const { data: guardasData } = await supabase
      .from("guardas")
      .select("id, status");

    setOcorrencias(ocorrenciasData || []);
    setPatrulhamentos(patrulhamentosData || []);
    setGuardas(guardasData || []);

    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const hoje = new Date().toISOString().split("T")[0];

  const ocorrenciasHoje = ocorrencias.filter((o) => o.data === hoje).length;
  const patrulhamentosHoje = patrulhamentos.filter((p) => p.data === hoje).length;
  const abertas = ocorrencias.filter((o) => o.status === "Aberta").length;
  const finalizadas = ocorrencias.filter((o) => o.status === "Finalizada").length;
  const guardasServico = guardas.filter((g) => g.status === "Em serviço").length;

  return (
  <ProtecaoPerfil
  perfisPermitidos={[
    "DESENVOLVEDOR",
    "ADMIN",
    "COMANDANTE",
    "DIRETOR",
  ]}
>
    <div className="p-3 md:p-6 pb-24">
      <header className="mb-6 border-b border-slate-800 pb-5">
        <h1 className="text-3xl md:text-5xl font-bold">
          📊 Estatísticas
        </h1>

        <p className="text-slate-400 mt-2">
          Indicadores operacionais da Guarda Civil Municipal.
        </p>
      </header>

      {carregando ? (
        <p className="text-slate-400">Carregando estatísticas...</p>
      ) : (
        <>
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card titulo="Ocorrências Hoje" valor={ocorrenciasHoje} icone="🚨" />
            <Card titulo="Rondas Hoje" valor={patrulhamentosHoje} icone="🚔" />
            <Card titulo="Abertas" valor={abertas} icone="⚠️" />
            <Card titulo="Finalizadas" valor={finalizadas} icone="✅" />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h2 className="text-xl font-bold mb-4">
                Resumo Geral
              </h2>

              <Linha nome="Total de ocorrências" valor={ocorrencias.length} />
              <Linha nome="Total de patrulhamentos" valor={patrulhamentos.length} />
              <Linha nome="Guardas cadastrados" valor={guardas.length} />
              <Linha nome="Guardas em serviço" valor={guardasServico} />
            </div>

            <div className="card">
              <h2 className="text-xl font-bold mb-4">
                Situação Operacional
              </h2>

              <div className="space-y-3">
                <Barra titulo="Ocorrências abertas" valor={abertas} total={ocorrencias.length} />
                <Barra titulo="Ocorrências finalizadas" valor={finalizadas} total={ocorrencias.length} />
                <Barra titulo="Guardas em serviço" valor={guardasServico} total={guardas.length} />
              </div>
            </div>
          </section>
        </>
      )}
        </div>
  </ProtecaoPerfil>
  );
}

function Card({
  titulo,
  valor,
  icone,
}: {
  titulo: string;
  valor: number;
  icone: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-700 bg-slate-950/40 p-4 min-h-28 flex flex-col justify-between">
      <div className="text-2xl">{icone}</div>
      <div>
        <p className="text-slate-400 text-sm">{titulo}</p>
        <h2 className="text-4xl font-bold">{valor}</h2>
      </div>
    </div>
  );
}

function Linha({ nome, valor }: { nome: string; valor: number }) {
  return (
    <div className="flex justify-between border-b border-slate-800 py-3">
      <span className="text-slate-400">{nome}</span>
      <span className="font-bold">{valor}</span>
    </div>
  );
}

function Barra({
  titulo,
  valor,
  total,
}: {
  titulo: string;
  valor: number;
  total: number;
}) {
  const porcentagem = total > 0 ? Math.round((valor / total) * 100) : 0;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-400">{titulo}</span>
        <span>{porcentagem}%</span>
      </div>

      <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full"
          style={{ width: `${porcentagem}%` }}
        />
      </div>
    </div>
  );
}